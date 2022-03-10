use noirc_abi::Abi;
use noirc_errors::Span;

use super::expr::{RBlockExpression, RIdent};
use super::stmt::RPattern;
use crate::node_interner::NodeInterner;
use crate::util::vecmap;
use crate::Type;
use crate::{token::Attribute, FunctionKind};

/// An interned function parameter from a function definition
#[derive(Debug)]
pub struct Param(pub RPattern, pub Type);

/// Attempts to retrieve the name of this parameter. Returns None
/// if this parameter is a tuple or struct pattern.
fn get_param_name(pattern: &RPattern, interner: &NodeInterner) -> Option<String> {
    match pattern {
        RPattern::Identifier(ident) => Some(ident.name.clone()),
        RPattern::Mutable(pattern, _) => get_param_name(pattern, interner),
        RPattern::Tuple(_, _) => None,
        RPattern::Struct(_, _, _) => None,
    }
}

#[derive(Debug)]
pub struct Parameters(Vec<Param>);

impl Parameters {
    pub fn into_abi(self, interner: &NodeInterner) -> Abi {
        let parameters = vecmap(self.0, |param| {
            let param_name = get_param_name(&param.0, interner)
                .expect("Abi for tuple and struct parameters is unimplemented");
            (param_name, param.1.as_abi_type())
        });
        noirc_abi::Abi { parameters }
    }

    pub fn span(&self, interner: &NodeInterner) -> Span {
        assert!(!self.is_empty());
        let mut spans = vecmap(&self.0, |param| match &param.0 {
            RPattern::Identifier(ident) => ident.span,
            RPattern::Mutable(_, span) => *span,
            RPattern::Tuple(_, span) => *span,
            RPattern::Struct(_, _, span) => *span,
        });

        let merged_span = spans.pop().unwrap();
        for span in spans {
            let _ = merged_span.merge(span);
        }

        merged_span
    }

    pub fn len(&self) -> usize {
        self.0.len()
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    pub fn iter(&self) -> impl Iterator<Item = &Param> {
        self.0.iter()
    }
}

impl IntoIterator for Parameters {
    type Item = Param;
    type IntoIter = <Vec<Param> as IntoIterator>::IntoIter;
    fn into_iter(self) -> Self::IntoIter {
        self.0.into_iter()
    }
}

impl From<Vec<Param>> for Parameters {
    fn from(vec: Vec<Param>) -> Parameters {
        Parameters(vec)
    }
}
#[derive(Debug)]
pub struct RFunction {
    pub name: RIdent,

    pub kind: FunctionKind,

    pub attributes: Option<Attribute>,
    pub parameters: Parameters,
    pub return_type: Type,

    pub body: Option<RBlockExpression>,
}

impl RFunction {
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
