use acvm::FieldElement;
use noirc_errors::Span;

use crate::node_interner::{FuncId, TypeId};
use crate::{BinaryOp, Ident, StructTypeRef, Type, UnaryOp};

use super::stmt::TStatement;

/// A Typed Expression is produced by adding Types
/// to each node of a Resolved Expression
#[derive(Debug)]
pub enum TExpression {
    Ident(TIdent),
    Literal(TLiteral),
    Block(TBlockExpression),
    Prefix(TPrefixExpression),
    Infix(TInfixExpression),
    Index(TIndexExpression),
    Constructor(TConstructorExpression),
    MemberAccess(TMemberAccess),
    Call(TCallExpression),
    Cast(TCastExpression),
    For(TForExpression),
    If(TIfExpression),
    Tuple(Vec<TExpression>, Type),
}

impl TExpression {
    pub fn get_type(&self) -> &Type {
        match self {
            TExpression::Ident(i) => &i.typ,
            TExpression::Literal(TLiteral::Array(_, typ)) => typ,
            TExpression::Literal(TLiteral::Bool(_, typ)) => typ,
            TExpression::Literal(TLiteral::Integer(_, typ)) => typ,
            TExpression::Literal(TLiteral::Str(_, typ)) => typ,
            TExpression::Block(b) => &b.1,
            TExpression::Prefix(p) => &p.typ,
            TExpression::Infix(i) => &i.typ,
            TExpression::Index(i) => &i.typ,
            TExpression::Constructor(c) => &c.typ,
            TExpression::MemberAccess(m) => &m.typ,
            TExpression::Call(c) => &c.typ,
            TExpression::Cast(c) => &c.typ,
            TExpression::For(f) => &f.typ,
            TExpression::If(i) => &i.typ,
            TExpression::Tuple(_, typ) => typ,
        }
    }
}

#[derive(Debug)]
pub struct TForExpression {
    pub identifier: TIdent,
    pub start_range: Box<TExpression>,
    pub end_range: Box<TExpression>,
    pub block: Box<TExpression>,
    pub typ: Type,
}

#[derive(Debug)]
pub struct TIdent {
    pub name: String,
    pub span: Span,
    pub typ: Type,
}

#[derive(Debug)]
pub enum TLiteral {
    Array(TArrayLiteral, Type),
    Bool(bool, Type),
    Integer(FieldElement, Type),
    Str(String, Type),
}

#[derive(Debug)]
pub struct TPrefixExpression {
    pub operator: UnaryOp,
    pub rhs: Box<TExpression>,
    pub typ: Type,
}

#[derive(Debug)]
pub struct TInfixExpression {
    pub lhs: Box<TExpression>,
    pub operator: BinaryOp,
    pub rhs: Box<TExpression>,
    pub typ: Type,
}

#[derive(Debug)]
pub struct TMemberAccess {
    pub lhs: Box<TExpression>,
    // This field is not an IdentId since the rhs of a field
    // access has no corresponding definition
    pub rhs: Ident,
    pub typ: Type,
}

#[derive(Debug)]
pub struct TIfExpression {
    pub condition: Box<TExpression>,
    pub consequence: Box<TExpression>,
    pub alternative: Option<Box<TExpression>>,
    pub typ: Type,
}

#[derive(Debug)]
pub struct TCastExpression {
    pub lhs: Box<TExpression>,
    pub typ: Type,
}

#[derive(Debug)]
pub struct TArrayLiteral {
    // Do we really expect users to create array literals with more than 2^64-1 elements?
    pub length: u128,
    pub contents: Vec<TExpression>,
}

#[derive(Debug)]
pub struct TCallExpression {
    pub func_id: FuncId,
    pub arguments: Vec<TExpression>,
    pub typ: Type,
}

#[derive(Debug)]
pub struct TConstructorExpression {
    pub type_id: TypeId,
    pub r#type: StructTypeRef,

    // NOTE: It is tempting to make this a BTreeSet to force ordering of field
    //       names (and thus remove the need to normalize them during type checking)
    //       but doing so would force the order of evaluation of field
    //       arguments to be alphabetical rather than the ordering the user
    //       included in the source code.
    pub fields: Vec<(TIdent, TExpression)>,
    pub typ: Type,
}

#[derive(Debug)]
pub struct TIndexExpression {
    pub collection_name: TIdent,
    pub index: Box<TExpression>,
    pub typ: Type,
}

#[derive(Debug)]
pub struct TBlockExpression(pub Vec<TStatement>, pub Type);
