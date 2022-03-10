use std::cell::RefCell;
use std::rc::Rc;

use super::expr::{RExpression, RIdent, RInfixExpression};
use crate::{StructType, Type};
use noirc_errors::Span;

#[derive(Debug)]
pub struct RLetStatement {
    pub pattern: RPattern,
    pub r#type: Type,
    pub expression: Box<RExpression>,
}

#[derive(Debug)]
pub struct RAssignStatement {
    pub identifier: RIdent,
    pub expression: Box<RExpression>,
}

#[derive(Debug)]
pub struct RConstrainStatement(pub RInfixExpression);

#[derive(Debug)]
pub enum RStatement {
    Let(RLetStatement),
    Constrain(RConstrainStatement),
    Assign(RAssignStatement),
    Expression(RExpression),
    Semi(RExpression),
    Error,
}

#[derive(Debug)]
pub enum RPattern {
    Identifier(RIdent),
    Mutable(Box<RPattern>, Span),
    Tuple(Vec<RPattern>, Span),
    Struct(Rc<RefCell<StructType>>, Vec<(RIdent, RPattern)>, Span),
}
