use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use crate::ast_resolved::types::StructType;
use crate::graph::CrateId;
use crate::resolver::def_collector::dc_crate::UnresolvedStruct;
use crate::resolver::def_map::{LocalModuleId, ModuleId};
use crate::Type;

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash)]
pub struct IdentId(usize);

impl IdentId {
    //dummy id for error reporting
    pub fn dummy_id() -> IdentId {
        IdentId(std::usize::MAX)
    }
}

#[derive(Debug, Eq, PartialEq, Hash, Copy, Clone)]
pub struct FuncId(pub u32);

impl FuncId {
    //dummy id for error reporting
    // This can be anything, as the program will ultimately fail
    // after resolution
    pub fn dummy_id() -> FuncId {
        FuncId(std::u32::MAX)
    }
}

#[derive(Debug, Eq, PartialEq, Hash, Copy, Clone)]
pub struct TypeId(pub ModuleId);

impl TypeId {
    //dummy id for error reporting
    // This can be anything, as the program will ultimately fail
    // after resolution
    pub fn dummy_id() -> TypeId {
        TypeId(ModuleId {
            krate: CrateId::dummy_id(),
            local_id: LocalModuleId::dummy_id(),
        })
    }
}

#[derive(Debug, Clone, Default)]
pub struct NodeInterner {
    next_unique_id: u32,

    /// Maps IdentId -> Definition
    definitions: Vec<Definition>,

    // Struct map.
    //
    // Each struct definition is possibly shared across multiple type nodes.
    // It is also mutated through the RefCell during name resolution to append
    // methods from impls to the type.
    structs: HashMap<TypeId, Rc<RefCell<StructType>>>,
}

#[derive(Debug, Clone)]
struct Definition {
    name: String,
    typ: Type,
}

// XXX: Add check that insertions are not overwrites for maps
// XXX: Maybe change push to intern, and remove comments
impl NodeInterner {
    pub fn next_unique_id(&mut self) -> u32 {
        self.next_unique_id += 1;
        self.next_unique_id
    }

    pub fn push_definition(&mut self, name: String) -> IdentId {
        let len = self.definitions.len();
        self.definitions.push(Definition {
            name,
            typ: Type::Unspecified,
        });
        IdentId(len)
    }

    pub fn get_definition_type_mut(&mut self, id: IdentId) -> &mut Type {
        &mut self.definitions[id.0].typ
    }

    pub fn get_definition(&self, id: IdentId) -> &Definition {
        &self.definitions[id.0]
    }

    pub fn push_empty_struct(&mut self, type_id: TypeId, typ: &UnresolvedStruct) {
        self.structs.insert(
            type_id,
            Rc::new(RefCell::new(StructType {
                id: type_id,
                name: typ.struct_def.name.clone(),
                fields: vec![],
                methods: HashMap::new(),
                span: typ.struct_def.span,
            })),
        );
    }

    pub fn update_struct<F>(&mut self, type_id: TypeId, f: F)
    where
        F: FnOnce(&mut StructType),
    {
        let value = self.structs.get_mut(&type_id).unwrap().borrow_mut();
        f(&mut value)
    }

    pub fn get_struct(&self, id: TypeId) -> Rc<RefCell<StructType>> {
        self.structs[&id].clone()
    }
}
