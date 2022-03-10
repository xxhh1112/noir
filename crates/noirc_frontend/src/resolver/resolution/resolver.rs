// Fix usage of intern and resolve
// In some places, we do intern, however in others we are resolving and interning
// Ideally, I want to separate the interning and resolving abstractly
// so separate functions, but combine them naturally
// This could be possible, if lowering, is given a mutable map/scope as a parameter.
// So that it can match Idents to Ids. This is close to what the Scope map looks like
// Except for the num_times_used parameter.
// We can instead have a map from Ident to Into<IdentId> and implement that trait on ResolverMeta
//
//
// XXX: Change mentions of intern to resolve. In regards to the above comment
//
// XXX: Resolver does not check for unused functions
#[derive(Debug, PartialEq, Eq)]
struct ResolverMeta {
    num_times_used: usize,
    ident: Ident,
    id: IdentId,
}

use crate::ast_resolved::expr::{
    RArrayLiteral, RBinaryOp, RBlockExpression, RCallExpression, RCastExpression,
    RConstructorExpression, RForExpression, RIdent, RIfExpression, RIndexExpression,
    RInfixExpression, RLiteral, RMemberAccess, RMethodCallExpression, RPrefixExpression,
};
use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use std::rc::Rc;

use crate::ast_resolved::expr::RExpression;
use crate::ast_resolved::stmt::{RAssignStatement, RPattern};
use crate::graph::CrateId;
use crate::node_interner::{FuncId, IdentId, NodeInterner, TypeId};
use crate::resolver::def_map::{ModuleDefId, TryFromModuleDefId};
use crate::util::vecmap;
use crate::{
    resolver::{def_map::CrateDefMap, resolution::path_resolver::PathResolver},
    BlockExpression, Expression, ExpressionKind, FunctionKind, Ident, Literal, NoirFunction,
    Statement,
};
use crate::{NoirStruct, Path, Pattern, StructType, Type, UnresolvedType, ERROR_IDENT};
use noirc_errors::{Span, Spanned};

use crate::ast_resolved::{
    function::{Param, RFunction},
    stmt::{RConstrainStatement, RLetStatement, RStatement},
};
use crate::resolver::scope::{
    Scope as GenericScope, ScopeForest as GenericScopeForest, ScopeTree as GenericScopeTree,
};

use super::errors::ResolverError;

type Scope = GenericScope<String, ResolverMeta>;
type ScopeTree = GenericScopeTree<String, ResolverMeta>;
type ScopeForest = GenericScopeForest<String, ResolverMeta>;

pub struct Resolver<'a> {
    scopes: ScopeForest,
    path_resolver: &'a dyn PathResolver,
    def_maps: &'a HashMap<CrateId, CrateDefMap>,
    interner: &'a mut NodeInterner,
    self_type: Option<TypeId>,
    errors: Vec<ResolverError>,
}

impl<'a> Resolver<'a> {
    pub fn new(
        interner: &'a mut NodeInterner,
        path_resolver: &'a dyn PathResolver,
        def_maps: &'a HashMap<CrateId, CrateDefMap>,
    ) -> Resolver<'a> {
        Self {
            path_resolver,
            def_maps,
            scopes: ScopeForest::new(),
            interner,
            self_type: None,
            errors: Vec::new(),
        }
    }

    pub fn set_self_type(&mut self, self_type: Option<TypeId>) {
        self.self_type = self_type;
    }

    fn push_err(&mut self, err: ResolverError) {
        self.errors.push(err)
    }

    /// Resolving a function involves interning the metadata
    /// interning any statements inside of the function
    /// and interning the function itself
    /// We resolve and lower the function at the same time
    /// Since lowering would require scope data, unless we add an extra resolution field to the AST
    pub fn resolve_function(mut self, func: NoirFunction) -> (RFunction, Vec<ResolverError>) {
        self.scopes.start_function();
        let func = self.intern_function(func);
        let func_scope_tree = self.scopes.end_function();

        self.check_for_unused_variables_in_scope_tree(func_scope_tree);

        (func, self.errors)
    }

    fn check_for_unused_variables_in_scope_tree(&mut self, scope_decls: ScopeTree) {
        scope_decls
            .0
            .into_iter()
            .flat_map(Resolver::check_for_unused_variables_in_local_scope)
            .filter(|unused_var| unused_var != ERROR_IDENT)
            .for_each(|ident| self.push_err(ResolverError::UnusedVariable { ident }));
    }

    fn check_for_unused_variables_in_local_scope(decl_map: Scope) -> impl Iterator<Item = Ident> {
        decl_map.filter_map(|(variable_name, metadata)| {
            let has_underscore_prefix = variable_name.starts_with('_'); // XXX: This is used for development mode, and will be removed
            (metadata.num_times_used == 0 && !has_underscore_prefix).then(|| metadata.ident)
        })
    }

    /// Run the given function in a new scope.
    fn in_new_scope<T, F: FnOnce(&mut Self) -> T>(&mut self, f: F) -> T {
        self.scopes.start_scope();
        let ret = f(self);
        let scope = self.scopes.end_scope();
        self.check_for_unused_variables_in_scope_tree(scope.into());
        ret
    }

    fn add_variable_decl(&mut self, name: Ident) -> RIdent {
        let id = IdentId(self.interner.next_unique_id());

        let scope = self.scopes.get_mut_scope();
        let resolver_meta = ResolverMeta {
            num_times_used: 0,
            ident: name.clone(),
            id,
        };

        if let Some(old_value) = scope.add_key_value(name.0.contents, resolver_meta) {
            self.push_err(ResolverError::DuplicateDefinition {
                first_ident: old_value.ident,
                second_ident: name.clone(),
            });
        }

        RIdent::new(name, id)
    }

    // Checks for a variable having been declared before
    // variable declaration and definition cannot be separate in Noir
    // Once the variable has been found, intern and link `name` to this definition
    // return the IdentId of `name`
    //
    // If a variable is not found, then an error is logged and a dummy id
    // is returned, for better error reporting UX
    fn find_variable(&mut self, ident: Ident) -> RIdent {
        // Find the definition for this Ident
        let scope_tree = self.scopes.current_scope_tree();
        let variable = scope_tree.find(ident.name());

        let mut ret = RIdent {
            name: ident.0.contents,
            span: ident.span(),
            definition: IdentId::dummy_id(),
        };

        if let Some(variable_found) = variable {
            variable_found.num_times_used += 1;
            ret.definition = variable_found.id;
            return ret;
        }

        self.push_err(ResolverError::VariableNotDeclared {
            name: ident.0.contents.clone(),
            span: ident.0.span(),
        });

        ret
    }

    pub fn intern_function(&mut self, func: NoirFunction) -> RFunction {
        let name = func.def.name;
        let id = FuncId(self.interner.next_unique_id());
        let attributes = func.attribute().cloned();

        let mut parameters = Vec::new();
        for (pattern, typ) in func.parameters().iter().cloned() {
            let pattern = self.resolve_pattern(pattern);
            let typ = self.resolve_type(typ);
            parameters.push(Param(pattern, typ));
        }

        let return_type = self.resolve_type(func.return_type());

        let body = match func.kind {
            FunctionKind::Builtin | FunctionKind::LowLevel => None,
            FunctionKind::Normal => Some(self.resolve_block(func.def.body)),
        };

        RFunction {
            name,
            id,
            kind: func.kind,
            attributes,
            parameters: parameters.into(),
            return_type,
            body,
        }
    }

    fn resolve_type(&mut self, typ: UnresolvedType) -> Type {
        match typ {
            UnresolvedType::FieldElement(vis) => Type::FieldElement(vis),
            UnresolvedType::Array(vis, size, elem) => {
                Type::Array(vis, size, Box::new(self.resolve_type(*elem)))
            }
            UnresolvedType::Integer(vis, sign, bits) => Type::Integer(vis, sign, bits),
            UnresolvedType::Bool => Type::Bool,
            UnresolvedType::Unit => Type::Unit,
            UnresolvedType::Unspecified => Type::Unspecified,
            UnresolvedType::Error => Type::Error,
            UnresolvedType::Struct(vis, path) => match self.lookup_struct(path) {
                Some(definition) => Type::Struct(vis, definition),
                None => Type::Error,
            },
            UnresolvedType::Tuple(fields) => {
                Type::Tuple(vecmap(fields, |field| self.resolve_type(field)))
            }
        }
    }

    pub fn resolve_struct_fields(
        mut self,
        unresolved: NoirStruct,
    ) -> (Vec<(Ident, Type)>, Vec<ResolverError>) {
        let fields = vecmap(unresolved.fields, |(ident, typ)| {
            (ident, self.resolve_type(typ))
        });

        (fields, self.errors)
    }

    pub fn resolve_stmt(&mut self, stmt: Statement) -> RStatement {
        match stmt {
            Statement::Let(let_stmt) => RStatement::Let(RLetStatement {
                pattern: self.resolve_pattern(let_stmt.pattern),
                r#type: self.resolve_type(let_stmt.r#type),
                expression: self.resolve_expression_boxed(let_stmt.expression),
            }),
            Statement::Constrain(constrain_stmt) => {
                let lhs = self.resolve_expression_boxed(constrain_stmt.0.lhs);
                let operator: RBinaryOp = constrain_stmt.0.operator.into();
                let rhs = self.resolve_expression_boxed(constrain_stmt.0.rhs);

                let stmt = RConstrainStatement(RInfixExpression { lhs, operator, rhs });
                RStatement::Constrain(stmt)
            }
            Statement::Expression(expr) => RStatement::Expression(self.resolve_expression(expr)),
            Statement::Semi(expr) => RStatement::Semi(self.resolve_expression(expr)),
            Statement::Assign(assign_stmt) => RStatement::Assign(RAssignStatement {
                identifier: self.find_variable(assign_stmt.identifier),
                expression: self.resolve_expression_boxed(assign_stmt.expression),
            }),
            Statement::Error => RStatement::Error,
        }
    }

    pub fn resolve_expression_boxed(&mut self, expr: Expression) -> Box<RExpression> {
        Box::new(self.resolve_expression(expr))
    }

    pub fn resolve_expression(&mut self, expr: Expression) -> RExpression {
        match expr.kind {
            ExpressionKind::Ident(string) => {
                let ident: Ident = Spanned::from(expr.span, string).into();
                let ident_id = self.find_variable(ident);
                RExpression::Ident(ident_id)
            }
            ExpressionKind::Literal(literal) => RExpression::Literal(match literal {
                Literal::Bool(b) => RLiteral::Bool(b),
                Literal::Array(arr) => RLiteral::Array(RArrayLiteral {
                    contents: vecmap(arr.contents, |elem| self.resolve_expression(elem)),
                    length: arr.length,
                }),
                Literal::Integer(integer) => RLiteral::Integer(integer),
                Literal::Str(str) => RLiteral::Str(str),
            }),
            ExpressionKind::Prefix(prefix) => {
                let operator = prefix.operator;
                let rhs = self.resolve_expression_boxed(prefix.rhs);
                RExpression::Prefix(RPrefixExpression { operator, rhs })
            }
            ExpressionKind::Infix(infix) => {
                let lhs = self.resolve_expression_boxed(infix.lhs);
                let rhs = self.resolve_expression_boxed(infix.rhs);

                RExpression::Infix(RInfixExpression {
                    lhs,
                    operator: infix.operator.into(),
                    rhs,
                })
            }
            ExpressionKind::Call(call_expr) => {
                // Get the span and name of path for error reporting
                let func_id = self.lookup_function(call_expr.func_name);
                let arguments = vecmap(call_expr.arguments, |arg| self.resolve_expression(arg));
                RExpression::Call(RCallExpression { func_id, arguments })
            }
            ExpressionKind::MethodCall(call_expr) => {
                let method = call_expr.method_name;
                let object = self.resolve_expression_boxed(call_expr.object);
                let arguments = vecmap(call_expr.arguments, |arg| self.resolve_expression(arg));
                RExpression::MethodCall(RMethodCallExpression {
                    arguments,
                    method,
                    object,
                })
            }
            ExpressionKind::Cast(cast_expr) => RExpression::Cast(RCastExpression {
                lhs: Box::new(self.resolve_expression(cast_expr.lhs)),
                r#type: self.resolve_type(cast_expr.r#type),
            }),
            ExpressionKind::For(for_expr) => {
                let start_range = Box::new(self.resolve_expression(for_expr.start_range));
                let end_range = Box::new(self.resolve_expression(for_expr.end_range));
                let (identifier, block) = (for_expr.identifier, for_expr.block);

                let (identifier, block) = self.in_new_scope(|this| {
                    (
                        this.add_variable_decl(identifier),
                        this.resolve_block(block),
                    )
                });

                RExpression::For(RForExpression {
                    start_range,
                    end_range,
                    block,
                    identifier,
                })
            }
            ExpressionKind::If(if_expr) => RExpression::If(RIfExpression {
                condition: self.resolve_expression_boxed(if_expr.condition),
                consequence: self.resolve_block(if_expr.consequence),
                alternative: if_expr.alternative.map(|e| self.resolve_block(e)),
            }),
            ExpressionKind::Index(indexed_expr) => RExpression::Index(RIndexExpression {
                collection_name: self.find_variable(indexed_expr.collection_name),
                index: self.resolve_expression_boxed(indexed_expr.index),
            }),
            ExpressionKind::Path(path) => {
                // If the Path is being used as an Expression, then it is referring to an Identifier
                //
                // This is currently not supported : const x = foo::bar::SOME_CONST + 10;
                RExpression::Ident(match path.into_ident() {
                    Some(identifier) => self.find_variable(identifier),
                    None => {
                        self.push_err(ResolverError::PathIsNotIdent { span: path.span() });
                        RIdent {
                            name: ERROR_IDENT.to_owned(),
                            span: path.span(),
                            definition: IdentId::dummy_id(),
                        }
                    }
                })
            }
            ExpressionKind::Block(block_expr) => RExpression::Block(self.resolve_block(block_expr)),
            ExpressionKind::Constructor(constructor) => {
                let span = constructor.type_name.span();

                if let Some(typ) = self.lookup_struct(constructor.type_name) {
                    let type_id = typ.borrow().id;

                    RExpression::Constructor(RConstructorExpression {
                        type_id,
                        fields: self.resolve_constructor_fields(
                            type_id,
                            constructor.fields,
                            span,
                            Resolver::resolve_expression,
                        ),
                        r#type: typ,
                    })
                } else {
                    RExpression::Error
                }
            }
            ExpressionKind::MemberAccess(access) => {
                // Validating whether the lhs actually has the rhs as a field
                // needs to wait until type checking when we know the type of the lhs
                RExpression::MemberAccess(RMemberAccess {
                    lhs: Box::new(self.resolve_expression(access.lhs)),
                    rhs: access.rhs,
                })
            }
            ExpressionKind::Error => RExpression::Error,
            ExpressionKind::Tuple(elements) => {
                let elements = vecmap(elements, |elem| self.resolve_expression(elem));
                RExpression::Tuple(elements)
            }
        }
    }

    fn resolve_pattern(&mut self, pattern: Pattern) -> RPattern {
        self.resolve_pattern_mutable(pattern, None)
    }

    fn resolve_pattern_mutable(&mut self, pattern: Pattern, mutable: Option<Span>) -> RPattern {
        match pattern {
            Pattern::Identifier(name) => {
                let id = self.add_variable_decl(name);
                RPattern::Identifier(id)
            }
            Pattern::Mutable(pattern, span) => {
                if let Some(first_mut) = mutable {
                    self.push_err(ResolverError::UnnecessaryMut {
                        first_mut,
                        second_mut: span,
                    })
                }

                let pattern = self.resolve_pattern_mutable(*pattern, Some(span));
                RPattern::Mutable(Box::new(pattern), span)
            }
            Pattern::Tuple(fields, span) => {
                let fields = vecmap(fields, |field| self.resolve_pattern_mutable(field, mutable));
                RPattern::Tuple(fields, span)
            }
            Pattern::Struct(name, fields, span) => {
                let struct_id = self.lookup_type(name);
                let struct_type = self.get_struct(struct_id);
                let resolve_field =
                    |this: &mut Self, pattern| this.resolve_pattern_mutable(pattern, mutable);
                let fields =
                    self.resolve_constructor_fields(struct_id, fields, span, resolve_field);
                RPattern::Struct(struct_type, fields, span)
            }
        }
    }

    /// Resolve all the fields of a struct constructor expression.
    /// Ensures all fields are present, none are repeated, and all
    /// are part of the struct.
    ///
    /// This is generic to allow it to work for constructor expressions
    /// and constructor patterns.
    fn resolve_constructor_fields<T, U, F>(
        &mut self,
        type_id: TypeId,
        fields: Vec<(Ident, T)>,
        span: Span,
        mut resolve_function: F,
    ) -> Vec<(Ident, U)>
    where
        F: FnMut(&mut Self, T) -> U,
    {
        let mut ret = Vec::with_capacity(fields.len());
        let mut seen_fields = HashSet::new();
        let mut unseen_fields = self.get_field_names_of_type(type_id);

        for (field, expr) in fields {
            let resolved = resolve_function(self, expr);

            if unseen_fields.contains(&field) {
                unseen_fields.remove(&field);
                seen_fields.insert(field.clone());
            } else if seen_fields.contains(&field) {
                // duplicate field
                self.push_err(ResolverError::DuplicateField {
                    field: field.clone(),
                });
            } else {
                // field not required by struct
                self.push_err(ResolverError::NoSuchField {
                    field: field.clone(),
                    struct_definition: self.get_struct(type_id).borrow().name.clone(),
                });
            }

            ret.push((field, resolved));
        }

        if !unseen_fields.is_empty() {
            self.push_err(ResolverError::MissingFields {
                span,
                missing_fields: unseen_fields
                    .into_iter()
                    .map(|field| field.to_string())
                    .collect(),
                struct_definition: self.get_struct(type_id).borrow().name.clone(),
            });
        }

        ret
    }

    pub fn get_struct(&self, type_id: TypeId) -> Rc<RefCell<StructType>> {
        self.interner.get_struct(type_id)
    }

    fn get_field_names_of_type(&self, type_id: TypeId) -> HashSet<Ident> {
        let typ = self.get_struct(type_id);
        let typ = typ.borrow();
        typ.fields.iter().map(|(name, _)| name.clone()).collect()
    }

    fn lookup<T: TryFromModuleDefId>(&mut self, path: Path) -> T {
        let span = path.span();
        match self.resolve_path(path) {
            // Could not resolve this symbol, the error is already logged, return a dummy function id
            None => T::dummy_id(),
            Some(def_id) => T::try_from(def_id).unwrap_or_else(|| {
                self.push_err(ResolverError::Expected {
                    expected: T::description(),
                    got: def_id.as_str().to_owned(),
                    span,
                });
                T::dummy_id()
            }),
        }
    }

    fn lookup_function(&mut self, path: Path) -> FuncId {
        self.lookup(path)
    }

    fn lookup_type(&mut self, path: Path) -> TypeId {
        let ident = path.into_ident();
        if ident.map_or(false, |i| &i == "Self") {
            if let Some(id) = &self.self_type {
                return *id;
            }
        }

        self.lookup(path)
    }

    pub fn lookup_struct(&mut self, path: Path) -> Option<Rc<RefCell<StructType>>> {
        let id = self.lookup_type(path);
        (id != TypeId::dummy_id()).then(|| self.get_struct(id))
    }

    pub fn lookup_type_for_impl(mut self, path: Path) -> (TypeId, Vec<ResolverError>) {
        (self.lookup_type(path), self.errors)
    }

    fn resolve_path(&mut self, path: Path) -> Option<ModuleDefId> {
        let span = path.span();
        let name = path.as_string();
        self.path_resolver
            .resolve(self.def_maps, path)
            .unwrap_or_else(|segment| {
                self.push_err(ResolverError::PathUnresolved {
                    name,
                    span,
                    segment,
                });
                None
            })
    }

    fn resolve_block(&mut self, block_expr: BlockExpression) -> RBlockExpression {
        RBlockExpression(
            self.in_new_scope(|this| vecmap(block_expr.0, |stmt| this.resolve_stmt(stmt))),
        )
    }
}

// XXX: These tests repeat a lot of code
// what we should do is have test cases which are passed to a test harness
// A test harness will allow for more expressive and readable tests
#[cfg(test)]
mod test {

    use std::collections::HashMap;

    use crate::{resolver::resolution::errors::ResolverError, Ident};

    use crate::graph::CrateId;
    use crate::node_interner::{FuncId, NodeInterner};
    use crate::{
        parse_program,
        resolver::def_map::{CrateDefMap, ModuleDefId},
        Path,
    };

    use super::{PathResolver, Resolver};

    // func_namespace is used to emulate the fact that functions can be imported
    // and functions can be forward declared
    fn resolve_src_code(
        src: &str,
        func_namespace: Vec<String>,
    ) -> (NodeInterner, Vec<ResolverError>) {
        let (program, errors) = parse_program(src);
        assert!(errors.is_empty());

        let mut interner = NodeInterner::default();

        let mut path_resolver = TestPathResolver(HashMap::new());
        for name in func_namespace {
            path_resolver.insert_func(name, FuncId(interner.next_unique_id()));
        }

        let def_maps = HashMap::new();
        let mut errors = Vec::new();
        for func in program.functions {
            let resolver = Resolver::new(&mut interner, &path_resolver, &def_maps);
            let (_, err) = resolver.resolve_function(func);
            errors.extend(err);
        }

        (interner, errors)
    }

    #[test]
    fn resolve_empty_function() {
        let src = "
            fn main() {

            }
        ";

        let (_, errors) = resolve_src_code(src, vec![String::from("main")]);
        assert!(errors.is_empty());
    }
    #[test]
    fn resolve_basic_function() {
        let src = r#"
            fn main(x : Field) {
                let y = x + x;
                constrain y == x;
            }
        "#;

        let (_, errors) = resolve_src_code(src, vec![String::from("main")]);
        assert!(errors.is_empty());
    }
    #[test]
    fn resolve_unused_var() {
        let src = r#"
            fn main(x : Field) {
                let y = x + x;
                constrain x == x;
            }
        "#;

        let (interner, mut errors) = resolve_src_code(src, vec![String::from("main")]);

        // There should only be one error
        assert!(errors.len() == 1, "Expected 1 error, got: {:?}", errors);
        let err = errors.pop().unwrap();
        // It should be regarding the unused variable
        match err {
            ResolverError::UnusedVariable { ident } => {
                assert_eq!(ident.name(), "y");
            }
            _ => unimplemented!("we should only have an unused var error"),
        }
    }
    #[test]
    fn resolve_unresolved_var() {
        let src = r#"
            fn main(x : Field) {
                let y = x + x;
                constrain y == z;
            }
        "#;

        let (_, mut errors) = resolve_src_code(src, vec![String::from("main")]);

        // There should only be one error
        assert!(errors.len() == 1);
        let err = errors.pop().unwrap();

        // It should be regarding the unresolved var `z` (Maybe change to undeclared and special case)
        match err {
            ResolverError::VariableNotDeclared { name, span: _ } => assert_eq!(name, "z"),
            _ => unimplemented!("we should only have an unresolved variable"),
        }
    }

    #[test]
    fn unresolved_path() {
        let src = "
            fn main(x : Field) {
                let _z = some::path::to::a::func(x);
            }
        ";

        let (_, mut errors) =
            resolve_src_code(src, vec![String::from("main"), String::from("foo")]);
        assert_eq!(errors.len(), 1);
        let err = errors.pop().unwrap();

        path_unresolved_error(err, "some::path::to::a::func");
    }

    #[test]
    fn resolve_literal_expr() {
        let src = r#"
            fn main(x : Field) {
                let y = 5;
                constrain y == x;
            }
        "#;

        let (_, errors) = resolve_src_code(src, vec![String::from("main")]);
        assert!(errors.is_empty());
    }

    #[test]
    fn multiple_resolution_errors() {
        let src = r#"
            fn main(x : Field) {
               let y = foo::bar(x);
               let z = y + a;
            }
        "#;

        let (interner, errors) = resolve_src_code(src, vec![String::from("main")]);
        assert!(errors.len() == 3, "Expected 3 errors, got: {:?}", errors);

        // Errors are:
        // `a` is undeclared
        // `z` is unused
        // `foo::bar` does not exist
        for err in errors {
            match &err {
                ResolverError::UnusedVariable { ident } => {
                    assert_eq!(ident.name(), "z");
                }
                ResolverError::VariableNotDeclared { name, .. } => {
                    assert_eq!(name, "a");
                }
                ResolverError::PathUnresolved { .. } => path_unresolved_error(err, "foo::bar"),
                _ => unimplemented!(),
            };
        }
    }
    #[test]
    fn resolve_prefix_expr() {
        let src = r#"
            fn main(x : Field) {
                let _y = -x;
            }
        "#;

        let (_, errors) = resolve_src_code(src, vec![String::from("main")]);
        assert!(errors.is_empty());
    }
    #[test]
    fn resolve_for_expr() {
        let src = r#"
            fn main(x : Field) {
                for i in 1..20 {
                    let _z = x + i;
                };
            }
        "#;

        let (_, errors) = resolve_src_code(src, vec![String::from("main")]);
        assert!(errors.is_empty());
    }
    #[test]
    fn resolve_call_expr() {
        let src = r#"
            fn main(x : Field) {
                let _z = foo(x);
            }

            fn foo(x : Field) -> Field {
                x
            }
        "#;

        let (_, errors) = resolve_src_code(src, vec![String::from("main"), String::from("foo")]);
        assert!(errors.is_empty());
    }

    fn path_unresolved_error(err: ResolverError, expected_unresolved_path: &str) {
        match err {
            ResolverError::PathUnresolved {
                span: _,
                name,
                segment: _,
            } => {
                assert_eq!(name, expected_unresolved_path)
            }
            _ => unimplemented!("expected an unresolved path"),
        }
    }

    struct TestPathResolver(HashMap<String, ModuleDefId>);

    impl PathResolver for TestPathResolver {
        fn resolve(
            &self,
            _def_maps: &HashMap<CrateId, CrateDefMap>,
            path: Path,
        ) -> Result<Option<ModuleDefId>, Ident> {
            // Not here that foo::bar and hello::foo::bar would fetch the same thing
            let name = path.segments.last().unwrap();
            let mod_def = self.0.get(&name.0.contents).cloned();
            match mod_def {
                None => Err(name.clone()),
                Some(_) => Ok(mod_def),
            }
        }
    }

    impl TestPathResolver {
        pub fn insert_func(&mut self, name: String, func_id: FuncId) {
            self.0.insert(name, func_id.into());
        }
    }
}
