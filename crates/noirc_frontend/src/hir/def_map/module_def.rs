use crate::node_interner::{DefinitionId, StmtId, StructId};

use super::ModuleId;

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum ModuleDefId {
    ModuleId(ModuleId),
    VariableId(DefinitionId),
    TypeId(StructId),
    GlobalId(StmtId),
}

impl ModuleDefId {
    pub fn as_type(&self) -> Option<StructId> {
        match self {
            ModuleDefId::TypeId(type_id) => Some(*type_id),
            _ => None,
        }
    }

    pub fn as_global(&self) -> Option<StmtId> {
        match self {
            ModuleDefId::GlobalId(stmt_id) => Some(*stmt_id),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            ModuleDefId::VariableId(_) => "variable",
            ModuleDefId::TypeId(_) => "type",
            ModuleDefId::ModuleId(_) => "module",
            ModuleDefId::GlobalId(_) => "global",
        }
    }
}

impl From<ModuleId> for ModuleDefId {
    fn from(mid: ModuleId) -> Self {
        ModuleDefId::ModuleId(mid)
    }
}

impl From<StmtId> for ModuleDefId {
    fn from(stmt_id: StmtId) -> Self {
        ModuleDefId::GlobalId(stmt_id)
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

impl TryFromModuleDefId for StmtId {
    fn try_from(id: ModuleDefId) -> Option<Self> {
        id.as_global()
    }

    fn dummy_id() -> Self {
        StmtId::dummy_id()
    }

    fn description() -> String {
        "global".to_string()
    }
}
