use super::expr::{TBlockExpression, TIdent};
use crate::Type;
use crate::{token::Attribute, FunctionKind};

#[derive(Debug)]
pub struct TFunction {
    pub name: TIdent,

    pub kind: FunctionKind,

    pub attributes: Option<Attribute>,

    /// Parameters carry over from the Resolved Ast's parameters since they're already Typed.
    pub parameters: crate::ast_resolved::function::Parameters,
    pub return_type: Type,

    pub body: Option<TBlockExpression>,
}

impl TFunction {
    /// Builtin and LowLevel functions usually have the return type
    /// declared, however their function bodies will be empty
    /// So this method tells the type checker to ignore the return
    /// of the empty function, which is unit
    pub fn can_ignore_return_type(&self) -> bool {
        match self.kind {
            FunctionKind::LowLevel | FunctionKind::Builtin => true,
            FunctionKind::Normal => false,
        }
    }
}
