use noirc_errors::Span;

use crate::token::{Keyword, SpannedToken, Token, TokenKind};

use super::ParserError;

pub type ParseResult<T> = Result<T, ParserError>;

pub type Input<'a> = &'a [SpannedToken];

#[derive(Default)]
pub struct Context<'a> {
    input: Input<'a>,
    errors: Vec<ParserError>,
}

impl<'a> Context<'a> {
    fn first(&self) -> Option<&SpannedToken> {
        self.input.first()
    }

    fn next(&mut self) -> Option<&SpannedToken> {
        let first = self.first();
        self.input = &self.input[1..];
        first
    }
}

/// Check the given function on the first Token in the input and either
/// forward its error if it returned one or return its successful result,
/// along with the rest of the input.
///
/// This is the most primitive combinator upon which all others are built upon.
pub fn filter_map<'a, F, T>(f: F) -> impl FnOnce(&'a mut Context) -> ParseResult<T>
    where F: FnOnce(Span, &'_ Token, &'_ Context) -> Result<T, ParserError>
{
    move |context| {
        match context.first() {
            Some(spanned) => {
                let value = f(spanned.to_span(), spanned.token(), context)?;
                context.next();
                Ok(value)
            }
            // TODO: find a more elegant way to express errors with no span
            None => Err(ParserError::empty(Token::EOF, Span::single_char(0))),
        }
    }
}

/// Matches a single token in the input and returns it.
pub fn token<'a>(expected: Token) -> impl FnOnce(&'a mut Context) -> ParseResult<Token> {
    filter_map(move |span, found, _| {
        if found == &expected {
            Ok(expected)
        } else {
            Err(ParserError::expected(expected, found.clone(), span))
        }
    })
}

/// Matches a single keyword token and returns it.
pub fn keyword<'a>(keyword: Keyword) -> impl FnOnce(&'a mut Context) -> ParseResult<Token> {
    token(Token::Keyword(keyword))
}

/// Matches any token of the given TokenKind
pub fn tokenkind<'a>(expected: TokenKind) -> impl FnOnce(&'a mut Context) -> ParseResult<Token> {
    filter_map(move |span, found, _| {
        if found.kind() == expected {
            Ok(found.clone())
        } else {
            Err(ParserError::expected_label(expected.to_string(), found.clone(), span))
        }
    })
}

/// Try to parse any of the parsers in the given non-empty
/// iterator. If all of these parsers fail, the errors from
/// each will be merged into a single resulting error.
pub fn choice<'a, It, P, T>(parsers: It) -> impl FnOnce(&'a mut Context) -> ParseResult<T>
    where It: IntoIterator<Item = P>,
          P: Fn(&'_ mut Context) -> ParseResult<T>
{
    move |context| {
        let mut iter = parsers.into_iter();
        let first = iter.next().expect("choice must be given at least 1 parser");

        let mut error = match first(context) {
            Ok(value) => return Ok(value),
            Err(e) => e,
        };

        for parser in iter {
            match parser(context) {
                Ok(value) => return Ok(value),
                Err(e) => error.merge(e),
            };
        }

        Err(error)
    }
}

/// Sequence both parsers, returning their result as a pair
pub fn then<'a, P1, P2, T1, T2>(first_parser: P1, second_parser: P2) -> impl FnOnce(&'a mut Context) -> ParseResult<(T1, T2)>
    where P1: FnOnce(&'_ mut Context) -> ParseResult<T1>,
          P2: FnOnce(&'_ mut Context) -> ParseResult<T2>,
{
    move |context| {
        let t1 = first_parser(context)?;
        let t2 = second_parser(context)?;
        Ok((t1, t2))
    }
}

/// Sequence both parsers, returning the result of the first
pub fn then_ignore<'a, P1, P2, T1, T2>(first_parser: P1, second_parser: P2) -> impl Fn(&'a mut Context) -> ParseResult<T1>
    where P1: Fn(&'_ mut Context) -> ParseResult<T1>,
          P2: Fn(&'_ mut Context) -> ParseResult<T2>,
{
    move |context| {
        let t1 = first_parser(context)?;
        let _ = second_parser(context)?;
        Ok(t1)
    }
}

/// Sequence both parsers, returning the result of the second
pub fn ignore_then<'a, P1, P2, T1, T2>(first_parser: P1, second_parser: P2) -> impl Fn(&'a mut Context) -> ParseResult<T2>
    where P1: Fn(&'_ mut Context) -> ParseResult<T1>,
          P2: Fn(&'_ mut Context) -> ParseResult<T2>,
{
    move |context| {
        let _ = first_parser(context)?;
        let t2 = second_parser(context)?;
        Ok(t2)
    }
}

/// Parses left_delim, then parser, then right_delim, and returns
/// the result of the middle parser
pub fn delimited_by_tokens<'a, P, T>(left_delim: Token, parser: P, right_delim: Token) -> impl FnOnce(&'a mut Context) -> ParseResult<T>
    where P: FnOnce(&'_ mut Context) -> ParseResult<T>,
{
    move |context| {
        let _ = token(left_delim)(context)?;
        let t2 = parser(context)?;
        let _ = token(right_delim)(context)?;
        Ok(t2)
    }
}

pub fn parenthesized<'a, P, T>(parser: P) -> impl FnOnce(&'a mut Context) -> ParseResult<T>
    where P: Fn(&'_ mut Context) -> ParseResult<T>,
{
    delimited_by_tokens(Token::LeftParen, parser, Token::RightParen)
}

/// Runs the given parser 0.. times
pub fn many0<'a, P, T>(mut parser: P) -> impl FnOnce(&'a mut Context) -> ParseResult<Vec<T>>
    where P: FnMut(&'_ mut Context) -> ParseResult<T>
{
    move |context| {
        let mut values = vec![];
        let mut input = context.input;

        loop {
            match parser(context) {
                Ok(value) => {
                    values.push(value);
                    input = context.input;
                }
                Err(_) => {
                    context.input = input;
                    return Ok(values);
                }
            }
        }
    }
}

/// Repeat the given parser 1.. times
pub fn many1<'a, P, T>(mut parser: P) -> impl FnOnce(&'a mut Context) -> ParseResult<Vec<T>>
    where P: FnMut(&'_ mut Context) -> ParseResult<T>
{
    move |context| {
        let mut values = vec![parser(context)?];
        let mut input = context.input;

        loop {
            match parser(context) {
                Ok(value) => {
                    values.push(value);
                    input = context.input;
                }
                Err(_) => {
                    context.input = input;
                    return Ok(values);
                }
            }
        }
    }
}

fn spanned<'a, P, T>(parser: P) -> impl FnOnce(&'a mut Context) -> ParseResult<(T, Span)>
where
    P: FnOnce(&'_ mut Context) -> ParseResult<T>,
{
    parser.map_with_span(|value, span| (value, span))
}

pub fn optional<'a, P, T>(parser: P) -> impl FnOnce(&'a mut Context) -> ParseResult<Option<T>>
    where P: FnOnce(&'_ mut Context) -> ParseResult<T>,
{
    move |context| {
        let input = context.input;
        match parser(context) {
            Ok(value) => Ok(Some(value)),
            Err(_) => {
                context.input = input;
                Ok(None)
            }
        }
    }
}

// Parse with the first parser, then continue by
// repeating the second parser 0 or more times.
// The passed in function is then used to combine the
// results of both parsers along with their spans at
// each step.
pub fn foldl_with_span<'a, P1, P2, T1, T2, F>(
    first_parser: P1,
    to_be_repeated: P2,
    f: F,
) -> impl Fn(&'a mut Context) -> ParseResult<T1>
where
    P1: FnOnce(&'_ mut Context) -> ParseResult<T1>,
    P2: Fn(&'_ mut Context) -> ParseResult<T2>,
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
