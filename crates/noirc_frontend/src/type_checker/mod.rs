mod errors;
mod expr;
mod stmt;

// Type checking at the moment is very simple due to what is supported in the grammar.
// If polymorphism is never need, then Wands algorithm should be powerful enough to accommodate
// all foreseeable types, if it is needed then we would need to switch to Hindley-Milner type or maybe bidirectional

use errors::TypeCheckError;
use expr::type_check_expression;

use crate::{
    ast_resolved::{function::RFunction, types::Type},
    node_interner::{FuncId, NodeInterner},
};

use self::stmt::bind_pattern;

/// Type checks a function and assigns the
/// appropriate types to expressions in a side table
pub fn type_check_func(interner: &mut NodeInterner, function: RFunction) -> Vec<TypeCheckError> {
    // First fetch the metadata and add the types for parameters
    // Note that we do not look for the defining Identifier for a parameter,
    // since we know that it is the parameter itself
    let declared_return_type = &function.return_type;
    let mut errors = vec![];
    for param in function.parameters.into_iter() {
        bind_pattern(interner, &param.0, param.1, &mut errors);
    }

    let func_span = function.name.span(); // XXX: We could be more specific and return the span of the last stmt, however stmts do not have spans yet

    if function.can_ignore_return_type() {
        // Fetch the HirFunction and iterate all of it's statements
        let body = function.body.unwrap();
        let function_last_type = type_check_block(interner, body, &mut errors);

        // Check declared return type and actual return type
        if &function_last_type != declared_return_type && function_last_type != Type::Error {
            errors.push(TypeCheckError::TypeMismatch {
                expected_typ: declared_return_type.to_string(),
                expr_typ: function_last_type.to_string(),
                expr_span: func_span,
            });
        }
    }

    // Return type cannot be public
    if declared_return_type.is_public() {
        errors.push(TypeCheckError::PublicReturnType {
            typ: declared_return_type.clone(),
            span: func_span,
        });
    }

    errors
}

// XXX: These tests are all manual currently.
/// We can either build a test apparatus or pass raw code through the resolver
#[cfg(test)]
mod test {
    use std::collections::HashMap;

    use noirc_errors::{Span, Spanned};

    use crate::ast_resolved::expr::RIdent;
    use crate::ast_resolved::stmt::RLetStatement;
    use crate::ast_resolved::stmt::RPattern::Identifier;
    use crate::ast_resolved::types::Type;
    use crate::node_interner::{FuncId, IdentId, NodeInterner};
    use crate::{
        ast_resolved::{
            expr::{BinaryOpKind, RBinaryOp, RBlockExpression, RExpression, RInfixExpression},
            function::{Param, RFunction},
            stmt::RStatement,
        },
        util::vecmap,
    };
    use crate::{graph::CrateId, Ident};
    use crate::{
        parse_program,
        resolver::{
            def_map::{CrateDefMap, ModuleDefId},
            resolution::{path_resolver::PathResolver, resolver::Resolver},
        },
        FunctionKind, Path,
    };

    fn ident(name: &str, id: u32) -> RIdent {
        RIdent {
            name: name.to_owned(),
            span: Span::default(),
            definition: IdentId(id),
        }
    }

    #[test]
    fn basic_let() {
        let mut interner = NodeInterner::default();

        // Add a simple let Statement into the interner
        // let z = x + y;
        let x = ident("x", 0);
        let y = ident("y", 1);
        let x_expr = RExpression::Ident(x.clone());
        let y_expr = RExpression::Ident(y.clone());

        // Create Infix
        let operator = RBinaryOp {
            span: Span::default(),
            kind: BinaryOpKind::Add,
        };
        let expr = RExpression::Infix(RInfixExpression {
            lhs: Box::new(x_expr),
            operator,
            rhs: Box::new(y_expr),
        });

        // Create let statement
        let let_stmt = RLetStatement {
            pattern: Identifier(ident("z", 2)),
            r#type: Type::Unspecified,
            expression: Box::new(expr),
        };
        let stmt_id = RStatement::Let(let_stmt);
        let block = RBlockExpression(vec![stmt_id]);

        // Create function to enclose the let statement
        let name = "test_func".to_owned();
        let fake_span = Span::single_char(0);

        let function = RFunction {
            name: Spanned::from(fake_span, name).into(),
            id: FuncId(3),
            kind: FunctionKind::Normal,
            attributes: None,
            parameters: vec![
                Param(Identifier(x), Type::WITNESS),
                Param(Identifier(y), Type::WITNESS),
            ]
            .into(),
            return_type: Type::Unit,
            body: Some(block),
        };

        let errors = super::type_check_func(&mut interner, function);
        assert!(errors.is_empty());
    }

    #[test]
    #[should_panic]
    fn basic_let_stmt() {
        let src = r#"
            fn main(x : Field) {
                let k = [x,x];
                let _z = x + k;
            }
        "#;

        type_check_src_code(src, vec![String::from("main")]);
    }

    #[test]
    fn basic_index_expr() {
        let src = r#"
            fn main(x : Field) {
                let k = [x,x];
                let _z = x + k[0];
            }
        "#;

        type_check_src_code(src, vec![String::from("main")]);
    }
    #[test]
    fn basic_call_expr() {
        let src = r#"
            fn main(x : Field) {
                let _z = x + foo(x);
            }

            fn foo(x : Field) -> Field {
                x
            }
        "#;

        type_check_src_code(src, vec![String::from("main"), String::from("foo")]);
    }
    #[test]
    fn basic_for_expr() {
        let src = r#"
            fn main(_x : Field) {
                let _j = for _i in 0..10 {
                    for _k in 0..100 {

                    }
                };
            }

        "#;

        type_check_src_code(src, vec![String::from("main"), String::from("foo")]);
    }

    // This is the same Stub that is in the resolver, maybe we can pull this out into a test module and re-use?
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

    // This function assumes that there is only one function and this is the
    // func id that is returned
    fn type_check_src_code(src: &str, func_namespace: Vec<String>) {
        let (program, errors) = parse_program(src);
        let mut interner = NodeInterner::default();

        // Using assert_eq here instead of assert(errors.is_empty()) displays
        // the whole vec if the assert fails rather than just two booleans
        assert_eq!(errors, vec![]);

        let mut path_resolver = TestPathResolver(HashMap::new());
        for (name, id) in func_namespace.into_iter().zip(func_namespace) {
            let id = FuncId(interner.next_unique_id());
            path_resolver.insert_func(name, id);
        }

        let def_maps: HashMap<CrateId, CrateDefMap> = HashMap::new();

        let functions = vecmap(program.functions, |nf| {
            let resolver = Resolver::new(&mut interner, &path_resolver, &def_maps);
            let (function, resolver_errors) = resolver.resolve_function(nf);
            assert_eq!(resolver_errors, vec![]);
            function
        });

        assert_eq!(functions.len(), 1);

        // Type check section
        let errors = super::type_check_func(&mut interner, functions[0]);
        assert_eq!(errors, vec![]);
    }
}
