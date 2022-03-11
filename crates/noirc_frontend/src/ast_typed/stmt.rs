use std::cell::RefCell;
use std::rc::Rc;

use super::expr::{TExpression, TIdent, TInfixExpression};
use crate::{StructType, Type};
use noirc_errors::Span;

#[derive(Debug)]
pub struct TLetStatement {
    pub pattern: TPattern,
    pub r#type: Type,
    pub expression: Box<TExpression>,
}

#[derive(Debug)]
pub struct TAssignStatement {
    pub identifier: TIdent,
    pub expression: Box<TExpression>,
}

#[derive(Debug)]
pub struct TConstrainStatement(pub TInfixExpression);

#[derive(Debug)]
pub enum TStatement {
    Let(TLetStatement),
    Constrain(TConstrainStatement),
    Assign(TAssignStatement),
    Expression(TExpression),
    Semi(TExpression),
    Error,
}

#[derive(Debug)]
pub enum TPattern {
    Identifier(TIdent),
    Mutable(Box<TPattern>, Span),
    Tuple(Vec<TPattern>, Span),
    Struct(Rc<RefCell<StructType>>, Vec<(TIdent, TPattern)>, Span),
}
