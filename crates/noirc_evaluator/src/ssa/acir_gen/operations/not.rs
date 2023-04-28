use crate::{
    ssa::{
        acir_gen::{internal_var_cache::InternalVarCache, InternalVar},
        context::SsaContext,
        node::{NodeId, ObjectType},
    },
    Evaluator,
};
use acvm::FieldElement;

pub(crate) fn evaluate(
    value: &NodeId,
    res_type: ObjectType,
    var_cache: &mut InternalVarCache,
    evaluator: &mut Evaluator,
    ctx: &SsaContext,
) -> Option<InternalVar> {
    let a = (1_u128 << res_type.bits()) - 1;
    let l_c = var_cache.get_or_compute_internal_var_unwrap(*value, evaluator, ctx);
    Some((FieldElement::from(a) - l_c.expression().clone()).into())
}
