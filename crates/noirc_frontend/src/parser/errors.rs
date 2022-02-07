use std::collections::BTreeSet;

use crate::lexer::errors::LexerErrorKind;
use crate::lexer::token::Token;
use crate::token::SpannedToken;
use crate::BinaryOp;

use noirc_errors::CustomDiagnostic as Diagnostic;
use noirc_errors::DiagnosableError;
use noirc_errors::Span;

#[derive(Debug)]
pub struct ParserError {
    expected_tokens: BTreeSet<Token>,
    expected_labels: BTreeSet<String>,
    found: Token,
    lexer_errors: Vec<LexerErrorKind>,
    reason: Option<String>,
    span: Span,
}

impl ParserError {
    pub fn empty(found: Token, span: Span) -> ParserError {
        ParserError {
            expected_tokens: BTreeSet::new(),
            expected_labels: BTreeSet::new(),
            found,
            lexer_errors: vec![],
            reason: None,
            span,
        }
    }

    pub fn expected(token: Token, found: Token, span: Span) -> ParserError {
        let mut error = ParserError::empty(found, span);
        error.expected_tokens.insert(token);
        error
    }

    pub fn expected_label(label: String, found: Token, span: Span) -> ParserError {
        let mut error = ParserError::empty(found, span);
        error.expected_labels.insert(label);
        error
    }

    pub fn with_reason(reason: String, span: Span) -> ParserError {
        let mut error = ParserError::empty(Token::EOF, span);
        error.reason = Some(reason);
        error
    }

    pub fn invalid_constrain_operator(operator: BinaryOp) -> ParserError {
        let message = format!(
            "Cannot use the {} operator in a constraint statement.",
            operator.contents.as_string()
        );
        let mut error = ParserError::empty(operator.contents.as_token(), operator.span());
        error.reason = Some(message);
        error
    }
}

impl DiagnosableError for ParserError {
    fn to_diagnostic(&self) -> Diagnostic {
        match &self.reason {
            Some(reason) => Diagnostic::simple_error(reason.clone(), String::new(), self.span),
            None => {
                let mut expected = self
                    .expected_tokens
                    .iter()
                    .map(ToString::to_string)
                    .collect::<Vec<_>>();
                expected.append(&mut self.expected_labels.iter().cloned().collect());

                let primary = if expected.is_empty() {
                    format!("Unexpected {} in input", self.found)
                } else if expected.len() == 1 {
                    format!(
                        "Expected a {} but found {}",
                        expected.first().unwrap(),
                        self.found
                    )
                } else {
                    let expected = expected
                        .iter()
                        .map(ToString::to_string)
                        .collect::<Vec<_>>()
                        .join(", ");

                    format!("Unexpected {}, expected one of {}", self.found, expected)
                };

                Diagnostic::simple_error(primary, String::new(), self.span)
            }
        }
    }
}

impl From<LexerErrorKind> for ParserError {
    fn from(error: LexerErrorKind) -> Self {
        let span = error.span();
        ParserError {
            expected_tokens: BTreeSet::new(),
            expected_labels: BTreeSet::new(),
            found: Token::EOF,
            lexer_errors: vec![error],
            reason: None,
            span,
        }
    }
}

impl nom::error::ParseError<SpannedToken> for ParserError {
    fn from_error_kind(input: SpannedToken, kind: nom::error::ErrorKind) -> Self {
        todo!()
    }

    fn append(input: SpannedToken, kind: nom::error::ErrorKind, other: Self) -> Self {
        todo!()
    }

    fn from_char(input: SpannedToken, _: char) -> Self {
        Self::from_error_kind(input, nom::error::ErrorKind::Char)
    }

    fn or(self, other: Self) -> Self {
        other
    }
}
