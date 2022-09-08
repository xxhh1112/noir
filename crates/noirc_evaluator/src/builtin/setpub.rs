use noirc_errors::Location;
use noirc_frontend::hir_def::expr::HirCallExpression;

use super::BuiltInCaller;
use crate::interpreter::Interpreter;
use crate::object::Object;
use crate::FuncContext;
use crate::{Environment, RuntimeError, RuntimeErrorKind};
pub struct SetPub;

impl BuiltInCaller for SetPub {
    fn call(
        evaluator: &mut Interpreter,
        env: &mut Environment,
        mut call_expr: HirCallExpression,
        location: Location,
    ) -> Result<Object, RuntimeError> {
        assert_eq!(call_expr.arguments.len(), 1);
        let expr = call_expr.arguments.pop().unwrap();

        let object = evaluator.expression_to_object(env, &expr)?;

        // This can only be called in the main context
        if env.func_context != FuncContext::Main {
            // Can no longer retrieve function name, setpub should be deprecated anyway
            let func_name = "(unknown)".into();
            return Err(
                RuntimeErrorKind::FunctionNonMainContext { func_name }.add_location(location)
            );
        }

        let witness = object.witness().expect("expected a witness");

        evaluator.push_public_input(witness);

        Ok(object)
    }
}
