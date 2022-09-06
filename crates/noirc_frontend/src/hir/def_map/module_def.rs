use crate::node_interner::{DefinitionId, StructId};

use super::ModuleId;

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum ModuleDefId {
    ModuleId(ModuleId),
    VariableId(DefinitionId),
    TypeId(StructId),
}

impl ModuleDefId {
    pub fn as_type(&self) -> Option<StructId> {
        match self {
            ModuleDefId::TypeId(type_id) => Some(*type_id),
            _ => None,
        }
    }

    // XXX: We are still allocating for error reporting even though strings are stored in binary
    // It is a minor performance issue, which can be addressed by having the error reporting, not allocate
    pub fn as_str(&self) -> &'static str {
        match self {
            ModuleDefId::VariableId(_) => "variable",
            ModuleDefId::TypeId(_) => "type",
            ModuleDefId::ModuleId(_) => "module",
        }
    }
}

impl From<ModuleId> for ModuleDefId {
    fn from(mid: ModuleId) -> Self {
        ModuleDefId::ModuleId(mid)
    }
}

pub trait TryFromModuleDefId: Sized {
    fn try_from(id: ModuleDefId) -> Option<Self>;
    fn dummy_id() -> Self;
    fn description() -> String;
}

impl TryFromModuleDefId for StructId {
    fn try_from(id: ModuleDefId) -> Option<Self> {
        id.as_type()
    }

    fn dummy_id() -> Self {
        StructId::dummy_id()
    }

    fn description() -> String {
        "type".to_string()
    }
}
