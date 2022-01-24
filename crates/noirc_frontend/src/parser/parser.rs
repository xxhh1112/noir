use super::{
    ParsedModule, ParserError, Precedence, TopLevelStatement,
};
use super::combinators::*;
use crate::lexer::Lexer;
use crate::token::{Attribute, Keyword, Token, TokenKind};
use crate::{
    ast::{ArraySize, Expression, ExpressionKind, Statement, Type},
    FieldElementType,
};
use crate::{
    AssignStatement, BinaryOp, BinaryOpKind, BlockExpression, CastExpression, ConstrainStatement,
    ForExpression, FunctionDefinition, Ident, IfExpression, ImportStatement, InfixExpression, Path,
    PathKind, UnaryOp,
};

use noirc_errors::{Span, Spanned};

/// TODO: We can leverage 'parse_recovery' and return both
/// (ParsedModule, Vec<ParseError>) instead of only one
pub fn parse_program(program: &str) -> Result<ParsedModule, Vec<ParserError>> {
    let lexer = Lexer::new(program);

    const APPROX_CHARS_PER_FUNCTION: usize = 250;
    let mut program = ParsedModule::with_capacity(lexer.approx_len() / APPROX_CHARS_PER_FUNCTION);
    let (tokens, lexing_errors) = lexer.lex();

    let parser = top_level_statement()
        .repeated()
        .then_ignore(token(Token::EOF));

    let (tree, mut parsing_errors) = parser.parse_recovery(tokens);
    match tree {
        Some(statements) => {
            for statement in statements {
                println!("{};", statement);
                match statement {
                    TopLevelStatement::Function(f) => program.push_function(f),
                    TopLevelStatement::Module(m) => program.push_module_decl(m),
                    TopLevelStatement::Import(i) => program.push_import(i),
                }
            }
            Ok(program)
        }
        None => {
            println!("no parse tree");
            let mut errors: Vec<_> = lexing_errors.into_iter().map(Into::into).collect();
            errors.append(&mut parsing_errors);
            Err(errors)
        }
    }
}

fn top_level_statement<'a>(input: Input<'a>, context: &'a mut Context) -> ParseResult<TopLevelStatement> {
    choice((
        function_definition(),
        module_declaration().then_ignore(token(Token::Semicolon)),
        use_statement().then_ignore(token(Token::Semicolon)),
    ))(input, context)
}

fn function_definition<'a>() -> impl Fn(&'a mut Context) -> ParseResult<TopLevelStatement> {
    optional(attribute)
        .then_ignore(keyword(Keyword::Fn))
        .then(ident)
        .then(parenthesized(function_parameters()))
        .then(function_return_type())
        .then(block)
        .map(|((((attribute, name), parameters), return_type), body)| {
            TopLevelStatement::Function(
                FunctionDefinition {
                    span: name.0.span(),
                    name,
                    attribute, // XXX: Currently we only have one attribute defined. If more attributes are needed per function, we can make this a vector and make attribute definition more expressive
                    parameters,
                    body,
                    return_type,
                }
                .into(),
            )
        })
}

fn function_return_type<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Type> {
    token(Token::Arrow)
        .ignore_then(parse_type())
        .or_not()
        .map(|r#type| r#type.unwrap_or(Type::Unit))
}

fn attribute<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Attribute> {
    tokenkind(TokenKind::Attribute).map(|token| match token {
        Token::Attribute(attribute) => attribute,
        _ => unreachable!(),
    })
}

fn function_parameters<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Vec<(Ident, Type)>> {
    ident()
        .then_ignore(token(Token::Colon))
        .then(parse_type())
        .separated_by(token(Token::Comma))
        .allow_trailing()
}

fn block<'a>() -> impl Fn(&'a mut Context) -> ParseResult<BlockExpression> {
    use Token::*;
    statement
        .separated_by(token(Semicolon))
        .then(optional(token(Semicolon)))
        .delimited_by(LeftBrace, RightBrace)
        .map(into_block)
}

fn into_block<'a>(
    (mut statements, last_semicolon): (Vec<Statement>, Option<Token>),
) -> BlockExpression {
    if last_semicolon.is_some() && !statements.is_empty() {
        let last = match statements.pop().unwrap() {
            Statement::Expression(expr) => Statement::Semi(expr),
            other => other,
        };
        statements.push(last);
    }
    BlockExpression(statements)
}

fn optional_type_annotation<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Type> {
    optional(
        token(Token::Colon).ignore_then(parse_type)
    ).map(|r#type| r#type.unwrap_or(Type::Unspecified))
}

fn module_declaration<'a>() -> impl Fn(&'a mut Context) -> ParseResult<TopLevelStatement> {
    keyword(Keyword::Mod)
        .ignore_then(ident)
        .map(TopLevelStatement::Module)
}

fn use_statement<'a>() -> impl Fn(&'a mut Context) -> ParseResult<TopLevelStatement> {
    keyword(Keyword::Use)
        .ignore_then(path)
        .then(optional(keyword(Keyword::As).ignore_then(ident)))
        .map(|(path, alias)| TopLevelStatement::Import(ImportStatement { path, alias }))
}

fn path<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Path> {
    let prefix = |key| keyword(key).ignore_then(token(Token::DoubleColon));
    let idents = || ident().separated_by(token(Token::DoubleColon)).at_least(1);
    let make_path = |kind| move |segments| Path { segments, kind };

    choice((
        prefix(Keyword::Crate)
            .ignore_then(idents())
            .map(make_path(PathKind::Crate)),
        prefix(Keyword::Dep)
            .ignore_then(idents())
            .map(make_path(PathKind::Dep)),
        idents().map(make_path(PathKind::Plain)),
    ))
}

fn ident<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Ident> {
    tokenkind(TokenKind::Ident).map_with_span(Ident::new)
}

fn statement<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Statement> {
    choice((
        constrain,
        declaration,
        assignment,
        expression.map(Statement::Expression),
    ))
    .labelled("statement")
}

fn operator_disallowed_in_constrain<'a>(operator: BinaryOpKind) -> bool {
    [
        BinaryOpKind::And,
        BinaryOpKind::Subtract,
        BinaryOpKind::Divide,
        BinaryOpKind::Multiply,
        BinaryOpKind::Or,
        BinaryOpKind::Assign,
    ]
    .contains(&operator)
}

fn constrain<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Statement> {
    keyword(Keyword::Constrain)
        .ignore_then(expression)
        .try_map(|expr, span| match expr.kind.into_infix() {
            Some(infix) if operator_disallowed_in_constrain(infix.operator.contents) => {
                Err(ParserError::invalid_constrain_operator(infix.operator))
            }
            None => Err(ParserError::with_reason(
                "Only an infix expression can follow the constrain keyword".to_string(),
                span,
            )),
            Some(infix) => Ok(Statement::Constrain(ConstrainStatement(infix))),
        })
}

fn declaration<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Statement> {
    let let_statement = generic_declaration(Keyword::Let, Statement::new_let);
    let priv_statement = generic_declaration(Keyword::Priv, Statement::new_priv);
    let const_statement = generic_declaration(Keyword::Const, Statement::new_const);

    choice(&[let_statement, priv_statement, const_statement])
}

fn generic_declaration<'a, F>(key: Keyword, f: F) -> impl Fn(&'a mut Context) -> ParseResult<Statement>
    where F: Fn(((Ident, Type), Expression)) -> Statement,
{
    keyword(key)
        .ignore_then(ident)
        .then(optional_type_annotation)
        .then_ignore(token(Token::Assign))
        .then(expression)
        .map(f)
}

fn assignment<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Statement> {
    ident
        .then_ignore(token(Token::Assign))
        .then(expression)
        .map(|(identifier, expression)| {
            Statement::Assign(AssignStatement {
                identifier,
                expression,
            })
        })
}

fn parse_type<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Type> {
    choice((
        field_type(optional_visibility),
        int_type(optional_visibility),
        array_type(optional_visibility),
    ))
}

fn parse_type_no_field_element<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Type> {
    choice((
        field_type(no_visibility),
        int_type(no_visibility),
        array_type(no_visibility),
    ))
}

// Parse nothing, just default to FieldElementType::Private
fn no_visibility<'a>(input: Input<'a>, context: &'a Context) -> ParseResult<FieldElementType> {
    Ok((input, FieldElementType::Private))
}

fn optional_visibility<'a>() -> impl Fn(&'a mut Context) -> ParseResult<FieldElementType> {
    optional(choice(&[
        keyword(Keyword::Pub).map(|_| FieldElementType::Public),
        keyword(Keyword::Priv).map(|_| FieldElementType::Private),
        keyword(Keyword::Const).map(|_| FieldElementType::Constant),
    ]))
    .map(|opt| opt.unwrap_or(FieldElementType::Private))
}

fn field_type<'a, P>(visibility_parser: P) -> impl Fn(&'a mut Context) -> ParseResult<Type>
    where P: Fn(&'a mut Context) -> ParseResult<FieldElementType>,
{
    visibility_parser
        .then_ignore(keyword(Keyword::Field))
        .map(Type::FieldElement)
}

fn int_type<'a, P>(visibility_parser: P) -> impl Fn(&'a mut Context) -> ParseResult<Type>
    where P: Fn(&'a mut Context) -> ParseResult<FieldElementType>,
{
    visibility_parser
        .then(filter_map(|span, token: Token| match token {
            Token::IntType(int_type) => Ok(int_type),
            unexpected => Err(ParserError::expected_label(
                "integer type".to_string(),
                unexpected,
                span,
            )),
        }))
        .map(|(visibility, int_type)| Type::from_int_tok(visibility, &int_type))
}

fn array_type<'a, P>(visibility_parser: P) -> impl Fn(&'a mut Context) -> ParseResult<Type>
where
    P: Fn(&'a mut Context) -> ParseResult<FieldElementType>,
{
    visibility_parser
        .then_ignore(token(Token::LeftBracket))
        .then(optional(fixed_array_size))
        .then_ignore(token(Token::RightBracket))
        .then(parse_type_no_field_element)
        .try_map(|((visibility, size), element_type), span| {
            if let Type::Array(..) = &element_type {
                return Err(ParserError::with_reason(
                    "Multi-dimensional arrays are currently unsupported".to_string(),
                    span,
                ));
            }
            let size = size.unwrap_or(ArraySize::Variable);
            Ok(Type::Array(visibility, size, Box::new(element_type)))
        })
}

fn expression<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Expression> {
    expression_with_precedence(Precedence::Lowest)
}

// An expression is a single term followed by 0 or more (OP subexpr)*
// where OP is an operator at the given precedence level and subexpr
// is an expression at the current precedence level plus one.
fn expression_with_precedence<'a, P>(precedence: Precedence)
    -> impl Fn(&'a mut Context) -> ParseResult<Expression>
{
    if precedence == Precedence::Highest {
        term
    } else {
        expression_with_precedence(precedence.higher())
            .then(
                operator_with_precedence(precedence)
                    .then(expression_with_precedence(precedence.higher()))
                    .repeated()
            )
            .foldl(create_infix_expression)
    }
}

fn create_infix_expression<'a>(lhs: Expression, (operator, rhs): (BinaryOp, Expression)) -> Expression {
    let span = lhs.span.merge(rhs.span);
    let is_comparator = operator.contents.is_comparator();
    let infix = Box::new(InfixExpression { lhs, operator, rhs });

    if is_comparator {
        Expression {
            span,
            kind: ExpressionKind::Predicate(infix),
        }
    } else {
        Expression {
            span,
            kind: ExpressionKind::Infix(infix),
        }
    }
}

fn operator_with_precedence<'a>(precedence: Precedence) -> impl Fn(&'a mut Context) -> ParseResult<Spanned<BinaryOpKind>> {
    filter_map(move |span, token, context| {
        if Precedence::token_precedence(token) == Some(precedence) {
            let bin_op_kind: Option<BinaryOpKind> = token.into();
            Ok(Spanned::from(span, bin_op_kind.unwrap()))
        } else {
            Err(ParserError::expected_label("binary operator".to_string(), token.clone(), span))
        }
    })
}

fn term<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Expression> {
    choice((
        if_expr,
        for_expr,
        array_expr,
        not,
        negation,
        block.map(ExpressionKind::Block),
    ))
    .map_with_span(Expression::new)
    .or(value_or_cast)
}

fn if_expr<'a>() -> impl Fn(&'a mut Context) -> ParseResult<ExpressionKind> {
    keyword(Keyword::If)
        .ignore_then(expression)
        .then(block)
        .then(optional(keyword(Keyword::Else).ignore_then(block)))
        .map(|((condition, consequence), alternative)| {
            ExpressionKind::If(Box::new(IfExpression {
                condition,
                consequence,
                alternative,
            }))
        })
}

fn for_expr<'a>() -> impl Fn(&'a mut Context) -> ParseResult<ExpressionKind> {
    keyword(Keyword::For)
        .ignore_then(ident)
        .then_ignore(keyword(Keyword::In))
        .then(expression)
        .then_ignore(token(Token::DoubleDot))
        .then(expression)
        .then(block)
        .map(|(((identifier, start_range), end_range), block)| {
            ExpressionKind::For(Box::new(ForExpression {
                identifier,
                start_range,
                end_range,
                block,
            }))
        })
}

fn array_expr<'a>() -> impl Fn(&'a mut Context) -> ParseResult<ExpressionKind> {
    expression_list
        .delimited_by(Token::LeftBracket, Token::RightBracket)
        .map(ExpressionKind::array)
}

fn expression_list<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Vec<Expression>> {
    expression.separated_by(token(Token::Comma)).allow_trailing()
}

fn not<'a>() -> impl Fn(&'a mut Context) -> ParseResult<ExpressionKind> {
    token(Token::Bang)
        .ignore_then(term)
        .map(|rhs| ExpressionKind::prefix(UnaryOp::Not, rhs))
}

fn negation<'a>() -> impl Fn(&'a mut Context) -> ParseResult<ExpressionKind> {
    token(Token::Minus)
        .ignore_then(term)
        .map(|rhs| ExpressionKind::prefix(UnaryOp::Minus, rhs))
}

fn value<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Expression> {
    choice(&[
        function_call,
        array_access,
        variable,
        literal,
    ])
    .map_with_span(Expression::new)
    .or(parenthesized(expression))
}

// This function is parses a value followed by 0 or more cast expressions.
fn value_or_cast<'a>() -> impl Fn(&'a mut Context) -> ParseResult<Expression> {
    let cast_rhs = keyword(Keyword::As).ignore_then(parse_type_no_field_element);

    foldl_with_span(value, cast_rhs, |(lhs, lhs_span), (r#type, rhs_span)| {
        Expression {
            kind: ExpressionKind::Cast(Box::new(CastExpression { lhs, r#type })),
            span: lhs_span.merge(rhs_span),
        }
    })
}

fn function_call<'a>() -> impl Fn(&'a mut Context) -> ParseResult<ExpressionKind> {
    path
        .then(parenthesized(expression_list))
        .map(|(path, args)| ExpressionKind::function_call(path, args))
}

fn array_access<'a>() -> impl Fn(&'a mut Context) -> ParseResult<ExpressionKind> {
    ident
        .then(expression.delimited_by(Token::LeftBracket, Token::RightBracket))
        .map(|(variable, index)| ExpressionKind::index(variable, index))
}

fn variable<'a>() -> impl Fn(&'a mut Context) -> ParseResult<ExpressionKind> {
    ident.map(|name| ExpressionKind::Ident(name.0.contents))
}

fn literal<'a>() -> impl Fn(&'a mut Context) -> ParseResult<ExpressionKind> {
    tokenkind(TokenKind::Literal).map(|token| match token {
        Token::Int(x) => ExpressionKind::integer(x),
        Token::Bool(b) => ExpressionKind::boolean(b),
        Token::Str(s) => ExpressionKind::string(s),
        unexpected => unreachable!("Non-literal {} parsed as a literal", unexpected),
    })
}

fn fixed_array_size<'a>() -> impl Fn(&'a mut Context) -> ParseResult<ArraySize> {
    filter_map(|span, token: Token| match token {
        Token::Int(integer) => {
            if !integer.fits_in_u128() {
                let message = "Array sizes must fit within a u128".to_string();
                Err(ParserError::with_reason(message, span))
            } else {
                Ok(ArraySize::Fixed(integer.to_u128()))
            }
        }
        _ => {
            let message = "The array size is defined as [k] for fixed size or [] for variable length. k must be a literal".to_string();
            Err(ParserError::with_reason(message, span))
        }
    })
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::Literal;

    fn parse_with<'a, P, T>(parser: P, program: &str) -> Result<T, Vec<ParserError>>
    where
        P: Fn(&'a mut Context) -> ParseResult<T>,
    {
        let lexer = Lexer::new(program);
        let (tokens, lexer_errors) = lexer.lex();
        if !lexer_errors.is_empty() {
            return Err(lexer_errors.into_iter().map(Into::into).collect());
        }
        parser.then_ignore(token(Token::EOF)).parse(tokens)
    }

    fn parse_all<'a, P, T>(parser: P, programs: Vec<&str>) -> Vec<T>
    where
        P: Fn(&'a mut Context) -> ParseResult<T>,
    {
        programs
            .into_iter()
            .map(move |program| {
                let message = format!("Failed to parse:\n{}", program);
                parse_with(&parser, program).expect(&message)
            })
            .collect()
    }

    fn parse_all_failing<'a, P, T>(parser: P, programs: Vec<&str>) -> Vec<ParserError>
    where
        P: Fn(&'a mut Context) -> ParseResult<T>,
        T: std::fmt::Display,
    {
        programs
            .into_iter()
            .flat_map(|program| match parse_with(&parser, program) {
                Ok(expr) => unreachable!(
                    "Expected this input to fail:\n{}\nYet it successfully parsed as:\n{}",
                    program, expr
                ),
                Err(error) => error,
            })
            .collect()
    }

    #[test]
    fn regression_skip_comment() {
        parse_all(
            function_definition(),
            vec![
                "fn main<'a>(
                // This comment should be skipped
                x : Field,
                // And this one
                y : Field,
            ) {
            }",
                "fn main<'a>(x : Field, y : Field,) {
                foo::bar(
                    // Comment for x argument
                    x,
                    // Comment for y argument
                    y
                )
            }",
            ],
        );
    }

    #[test]
    fn parse_infix() {
        let valid = vec!["x + 6", "x - k", "x + (x + a)", " x * (x + a) + (x - 4)"];
        parse_all(expression(), valid);
        parse_all_failing(expression(), vec!["y ! x"]);
    }

    #[test]
    fn parse_function_call() {
        let valid = vec![
            "std::hash ()",
            " std::hash(x,y,a+b)",
            "crate::foo (x)",
            "hash (x,)",
        ];
        parse_all(function_call, valid);
    }

    #[test]
    fn parse_cast() {
        parse_all(
            value_or_cast,
            vec!["x as u8", "0 as Field", "(x + 3) as [8]Field"],
        );
        parse_all_failing(value_or_cast, vec!["x as pub u8"]);
    }

    #[test]
    fn parse_array_index() {
        let valid = vec!["x[9]", "y[x+a]", " foo [foo+5]", "baz[bar]"];
        parse_all(array_access, valid);
    }

    fn expr_to_array(expr: ExpressionKind) -> crate::ArrayLiteral {
        let lit = match expr {
            ExpressionKind::Literal(literal) => literal,
            _ => unreachable!("expected a literal"),
        };

        match lit {
            Literal::Array(arr) => arr,
            _ => unreachable!("expected an array"),
        }
    }

    /// This is the standard way to declare an array
    #[test]
    fn parse_array() {
        let valid = vec![
            "[0, 1, 2,3, 4]",
            "[0,1,2,3,4,]", // Trailing commas are valid syntax
        ];

        for expr in parse_all(array_expr, valid) {
            let arr_lit = expr_to_array(expr);
            assert_eq!(arr_lit.length, 5);

            // All array types are unknown at parse time
            // This makes parsing simpler. The type checker
            // needs to iterate the whole array to ensure homogeneity
            // so there is no advantage to deducing the type here.
            assert_eq!(arr_lit.r#type, Type::Unknown);
        }

        parse_all_failing(
            array_expr,
            vec!["0,1,2,3,4]", "[[0,1,2,3,4]", "[0,1,2,,]", "[0,1,2,3,4"],
        );
    }

    #[test]
    fn parse_block() {
        parse_with(block, "{ [0,1,2,3,4] }").unwrap();

        parse_all_failing(
            block,
            vec![
                "[0,1,2,3,4] }",
                "{ [0,1,2,3,4]",
                "{ [0,1,2,,] }", // Contents of the block must still be a valid expression
                "{ [0,1,2,3 }",
                "{ 0,1,2,3] }",
                "[[0,1,2,3,4]}",
            ],
        );
    }

    /// This is the standard way to declare a constrain statement
    #[test]
    fn parse_constrain() {
        parse_with(constrain, "constrain x == y").unwrap();

        // Currently we disallow constrain statements where the outer infix operator
        // produces a value. This would require an implicit `==` which
        // may not be intuitive to the user.
        //
        // If this is deemed useful, one would either apply a transformation
        // or interpret it with an `==` in the evaluator
        let disallowed_operators = vec![
            BinaryOpKind::And,
            BinaryOpKind::Subtract,
            BinaryOpKind::Divide,
            BinaryOpKind::Multiply,
            BinaryOpKind::Or,
            BinaryOpKind::Assign,
        ];

        for operator in disallowed_operators {
            let src = format!("constrain x {} y;", operator.as_string());
            parse_with(constrain, &src).unwrap_err();
        }

        // These are general cases which should always work.
        //
        // The first case is the most noteworthy. It contains two `==`
        // The first (inner) `==` is a predicate which returns 0/1
        // The outer layer is an infix `==` which is
        // associated with the Constrain statement
        parse_all(
            constrain,
            vec![
                "constrain ((x + y) == k) + z == y",
                "constrain (x + !y) == y",
                "constrain (x ^ y) == y",
                "constrain (x ^ y) == (y + m)",
                "constrain x + x ^ x == y | m",
            ],
        );
    }

    #[test]
    fn parse_let() {
        // Why is it valid to specify a let declaration as having type u8?
        //
        // Let statements are not type checked here, so the parser will accept as
        // long as it is a type. Other statements such as Public are type checked
        // Because for now, they can only have one type
        parse_all(
            declaration,
            vec!["let x = y", "let x : u8 = y"],
        );
    }
    #[test]
    fn parse_priv() {
        parse_all(
            declaration,
            vec!["priv x = y", "priv x : pub Field = y"],
        );
    }

    #[test]
    fn parse_invalid_pub() {
        // pub cannot be used to declare a statement
        parse_all_failing(
            statement,
            vec!["pub x = y", "pub x : pub Field = y"],
        );
    }

    #[test]
    fn parse_const() {
        // XXX: We have `Constant` because we may allow constants to
        // be casted to integers. Maybe rename this to `Field` instead
        parse_all(
            declaration,
            vec!["const x = y", "const x : const Field = y"],
        );
    }

    #[test]
    fn parse_for_loop() {
        parse_all(
            for_expr,
            vec!["for i in x+y..z {}", "for i in 0..100 { foo; bar }"],
        );

        parse_all_failing(
            for_expr,
            vec![
                "for 1 in x+y..z {}",  // Cannot have a literal as the loop identifier
                "for i in 0...100 {}", // Only '..' is supported, there are no inclusive ranges yet
                "for i in 0..=100 {}", // Only '..' is supported, there are no inclusive ranges yet
            ],
        );
    }

    #[test]
    fn parse_function() {
        parse_all(
            function_definition(),
            vec![
                "fn func_name() {}",
                "fn f(foo: pub u8, y : pub Field) -> u8 { x + a }",
                "fn f(f: pub Field, y : Field, z : const Field) -> u8 { x + a }",
                "fn func_name(f: Field, y : pub Field, z : pub [5]u8,) {}",
                "fn func_name(x: []Field, y : [2]Field,y : pub [2]Field, z : pub [5]u8)  {}",
            ],
        );

        parse_all_failing(
            function_definition(),
            vec![
                "fn x2( f: []Field,,) {}",
                "fn ( f: []Field) {}",
                "fn ( f: []Field) {}",
            ],
        );
    }

    #[test]
    fn parse_parenthesized_expression() {
        parse_all(
            value,
            vec!["(0)", "(x+a)", "({(({{({(nested)})}}))})"],
        );

        parse_all_failing(value, vec!["(x+a", "((x+a)", "()"]);
    }

    #[test]
    fn parse_if_expr() {
        parse_all(
            if_expr,
            vec!["if x + a {  } else {  }", "if x {}"],
        );

        parse_all_failing(
            if_expr,
            vec![
                "if (x / a) + 1 {} else",
                "if foo then 1 else 2",
                "if true { 1 }else 3",
            ],
        );
    }

    fn expr_to_lit(expr: ExpressionKind) -> Literal {
        match expr {
            ExpressionKind::Literal(literal) => literal,
            _ => unreachable!("expected a literal"),
        }
    }

    #[test]
    fn parse_int() {
        let int = parse_with(literal(), "5").unwrap();
        let hex = parse_with(literal(), "0x05").unwrap();

        match (expr_to_lit(int), expr_to_lit(hex)) {
            (Literal::Integer(int), Literal::Integer(hex)) => assert_eq!(int, hex),
            _ => unreachable!(),
        }
    }

    #[test]
    fn parse_string() {
        let expr = parse_with(literal(), r#""hello""#).unwrap();
        match expr_to_lit(expr) {
            Literal::Str(s) => assert_eq!(s, "hello"),
            _ => unreachable!(),
        };
    }

    #[test]
    fn parse_bool() {
        let expr_true = parse_with(literal(), "true").unwrap();
        let expr_false = parse_with(literal(), "false").unwrap();

        match (expr_to_lit(expr_true), expr_to_lit(expr_false)) {
            (Literal::Bool(t), Literal::Bool(f)) => {
                assert!(t);
                assert!(!f);
            }
            _ => unreachable!(),
        };
    }

    #[test]
    fn parse_module_declaration() {
        parse_with(module_declaration(), "mod foo").unwrap();
        parse_with(module_declaration(), "mod 1").unwrap_err();
    }

    #[test]
    fn parse_path() {
        let cases = vec![
            ("std", vec!["std"]),
            ("std::hash", vec!["std", "hash"]),
            ("std::hash::collections", vec!["std", "hash", "collections"]),
            ("dep::foo::bar", vec!["foo", "bar"]),
            ("crate::std::hash", vec!["std", "hash"]),
        ];

        for (src, expected_segments) in cases {
            let path: Path = parse_with(path(), src).unwrap();
            for (segment, expected) in path.segments.into_iter().zip(expected_segments) {
                assert_eq!(segment.0.contents, expected);
            }
        }

        parse_all_failing(path(), vec!["std::", "::std", "std::hash::", "foo::1"]);
    }

    #[test]
    fn parse_path_kinds() {
        let cases = vec![
            ("std", PathKind::Plain),
            ("dep::hash::collections", PathKind::Dep),
            ("crate::std::hash", PathKind::Crate),
        ];

        for (src, expected_path_kind) in cases {
            let path = parse_with(path(), src).unwrap();
            assert_eq!(path.kind, expected_path_kind)
        }

        parse_all_failing(
            path(),
            vec![
                "dep",
                "crate",
                "crate::std::crate",
                "foo::bar::crate",
                "foo::dep",
            ],
        );
    }

    #[test]
    fn parse_unary() {
        parse_all(
            term,
            vec!["!hello", "-hello", "--hello", "-!hello", "!-hello"],
        );
        parse_all_failing(term, vec!["+hello", "/hello"]);
    }

    #[test]
    fn parse_use() {
        parse_all(
            use_statement(),
            vec![
                "use std::hash",
                "use std",
                "use foo::bar as hello",
                "use bar as bar",
            ],
        );

        parse_all_failing(
            use_statement(),
            vec!["use std as ;", "use foobar as as;", "use hello:: as foo;"],
        );
    }
}
