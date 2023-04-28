use acvm::{acir::circuit::opcodes::Opcode as AcirOpcode, FieldElement};

use crate::{
    ssa::{
        acir_gen::{internal_var_cache::InternalVarCache, InternalVar},
        context::SsaContext,
        node::NodeId,
    },
    Evaluator,
};

pub(crate) fn evaluate(
    value: &NodeId,
    var_cache: &mut InternalVarCache,
    evaluator: &mut Evaluator,
    ctx: &SsaContext,
) -> Option<InternalVar> {
    let value = var_cache.get_or_compute_internal_var_unwrap(*value, evaluator, ctx);
    let subtract = FieldElement::one() - value.expression().clone();
    evaluator.push_opcode(AcirOpcode::Arithmetic(subtract));
    Some(value)
}
