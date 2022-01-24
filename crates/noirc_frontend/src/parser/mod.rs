mod errors;
#[allow(clippy::module_inception)]
mod parser;

use std::cell::RefCell;

use crate::token::{Attribute, Token};
use crate::{ast::ImportStatement, NoirFunction};
use crate::{BlockExpression, FunctionDefinition, Ident, Type};

pub use errors::ParserError;
use noirc_errors::Span;
use nom::character::complete::satisfy;
use nom::combinator::opt;
use nom::multi::separated_list0;
use nom::sequence::terminated;
pub use parser::parse_program;

use nom::Parser;

#[derive(Debug)]
enum TopLevelStatement {
    Function(NoirFunction),
    Module(Ident),
    Import(ImportStatement),
}

impl TopLevelStatement {
    fn function((attribute, name, parameters, return_type, body): (Option<Attribute>, Ident, Vec<(Ident, Type)>, Type, BlockExpression)) -> TopLevelStatement {
        TopLevelStatement::Function(FunctionDefinition {
            span: name.0.span(),
            name,
            attribute, // XXX: Currently we only have one attribute defined. If more attributes are needed per function, we can make this a vector and make attribute definition more expressive
            parameters,
            body,
            return_type,
        }.into())
    }
}

struct Input<'a> {
    tokens: &'a [Token],
    errors: &'a RefCell<Vec<ParserError>>,
}

type ParseResult<'a, T> = nom::IResult<Input<'a>>;

// Helper trait that gives us simpler type signatures for return types:
// e.g. impl Parser<'a, T> versus impl Parser<Input<'a>, T, ParserError>
pub trait NoirParser<'a, T>: Parser<Input<'a>, T, ParserError> + Sized {}
impl<'a, P, T> NoirParser<'a, T> for P where P: Parser<Input<'a>, T, Error = ParserError> {}

fn token<'a>(expected: Token) -> impl NoirParser<'a, Token> {
    satisfy(|token| token == expected)
}

fn separated_by_trailing0<'a, P1, P2, T, U>(separator: P1, repeated: P2) -> impl NoirParser<'a, Vec<T>>
    where P1: NoirParser<'a, U> + Copy,
          P2: NoirParser<'a, T>,
{
    terminated(separated_list0(separator, repeated), opt(separator))
}

fn parenthesized<P, F, T>(parser: P, default: F) -> impl NoirParser<T>
where
    P: NoirParser<T>,
    F: Fn(Span) -> T,
{
    parser.delimited_by(Token::LeftParen, Token::RightParen)
}

fn spanned<P, T>(parser: P) -> impl NoirParser<(T, Span)>
where
    P: NoirParser<T>,
{
    parser.map_with_span(|value, span| (value, span))
}

// Parse with the first parser, then continue by
// repeating the second parser 0 or more times.
// The passed in function is then used to combine the
// results of both parsers along with their spans at
// each step.
fn foldl_with_span<P1, P2, T1, T2, F>(
    first_parser: P1,
    to_be_repeated: P2,
    f: F,
) -> impl NoirParser<T1>
where
    P1: NoirParser<T1>,
    P2: NoirParser<T2>,
    F: Fn((T1, Span), (T2, Span)) -> T1,
{
    spanned(first_parser)
        .then(spanned(to_be_repeated).repeated())
        .foldl(move |a, b| {
            let span = a.1;
            (f(a, b), span)
        })
        .map(|(value, _span)| value)
}

#[derive(Clone, Debug)]
pub struct ParsedModule {
    pub imports: Vec<ImportStatement>,
    pub functions: Vec<NoirFunction>,
    pub module_decls: Vec<Ident>,
}

impl ParsedModule {
    fn with_capacity(cap: usize) -> Self {
        ParsedModule {
            imports: Vec::with_capacity(cap),
            functions: Vec::with_capacity(cap),
            module_decls: Vec::new(),
        }
    }

    fn push_function(&mut self, func: NoirFunction) {
        self.functions.push(func);
    }
    fn push_import(&mut self, import_stmt: ImportStatement) {
        self.imports.push(import_stmt);
    }
    fn push_module_decl(&mut self, mod_name: Ident) {
        self.module_decls.push(mod_name);
    }
}

#[derive(Debug, Copy, Clone, PartialEq, PartialOrd)]
pub enum Precedence {
    Lowest,
    LessGreater,
    Sum,
    Product,
    Highest,
}

impl Precedence {
    // Higher the number, the higher(more priority) the precedence
    // XXX: Check the precedence is correct for operators
    fn token_precedence(tok: &Token) -> Option<Precedence> {
        let precedence = match tok {
            Token::Assign => Precedence::Lowest,
            Token::Equal => Precedence::Lowest,
            Token::NotEqual => Precedence::Lowest,
            Token::Less => Precedence::LessGreater,
            Token::LessEqual => Precedence::LessGreater,
            Token::Greater => Precedence::LessGreater,
            Token::GreaterEqual => Precedence::LessGreater,
            Token::Ampersand => Precedence::Sum,
            Token::Caret => Precedence::Sum,
            Token::Pipe => Precedence::Sum,
            Token::Plus => Precedence::Sum,
            Token::Minus => Precedence::Sum,
            Token::Slash => Precedence::Product,
            Token::Star => Precedence::Product,
            _ => return None,
        };

        assert_ne!(precedence, Precedence::Highest, "expression_with_precedence in the parser currently relies on the highest precedence level being uninhabited");
        Some(precedence)
    }

    fn higher(self) -> Self {
        use Precedence::*;
        match self {
            Lowest => LessGreater,
            LessGreater => Sum,
            Sum => Product,
            Product => Highest,
            Highest => Highest,
        }
    }
}

impl std::fmt::Display for TopLevelStatement {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TopLevelStatement::Function(fun) => fun.fmt(f),
            TopLevelStatement::Module(m) => write!(f, "mod {}", m),
            TopLevelStatement::Import(i) => i.fmt(f),
        }
    }
}
