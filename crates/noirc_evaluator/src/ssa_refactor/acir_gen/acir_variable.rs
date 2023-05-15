use super::{errors::AcirGenError, GeneratedAcir};
use acvm::{
    acir::native_types::{Expression, Witness},
    FieldElement,
};
use std::collections::HashMap;

#[derive(Debug, Default)]
struct AcirContext {
    data: HashMap<AcirVar, AcirVarData>,
    data_reverse_map: HashMap<AcirVarData, AcirVar>,

    acir_ir: GeneratedAcir,
}

impl AcirContext {
    pub(crate) fn add_constant(&mut self, constant: FieldElement) -> AcirVar {
        let constant_data = AcirVarData::Const(constant);

        if let Some(var) = self.data_reverse_map.get(&constant_data) {
            return *var;
        };

        self.add_data(constant_data)
    }

    pub(crate) fn add_variable(&mut self) -> AcirVar {
        let var_index = self.acir_ir.next_witness_index();

        let var_data = AcirVarData::Witness(var_index);

        self.add_data(var_data)
    }

    pub(crate) fn neg_var(&mut self, var: AcirVar) -> AcirVar {
        let var_data = &self.data[&var];
        match var_data {
            AcirVarData::Witness(witness) => {
                let mut expr = Expression::default();
                expr.push_addition_term(-FieldElement::one(), *witness);

                self.add_data(AcirVarData::Expr(expr))
            }
            AcirVarData::Expr(expr) => self.add_data(AcirVarData::Expr(-expr)),
            AcirVarData::Const(constant) => self.add_data(AcirVarData::Const(-*constant)),
        }
    }

    pub(crate) fn inv_var(&mut self, var: AcirVar) -> AcirVar {
        let var_data = &self.data[&var];
        let inverted_witness = match var_data {
            AcirVarData::Witness(witness) => {
                let expr = Expression::from(*witness);
                self.acir_ir.directive_inverse(&expr)
            }
            AcirVarData::Expr(expr) => self.acir_ir.directive_inverse(expr),
            AcirVarData::Const(constant) => {
                // Note that this will return a 0 if the inverse is not available
                return self.add_data(AcirVarData::Const(constant.inverse()));
            }
        };
        let inverted_var = self.add_data(AcirVarData::Witness(inverted_witness));

        let should_be_one = self.mul_var(inverted_var, var);
        self.assert_eq_one(should_be_one);

        inverted_var
    }
    // TODO: All of these should return a Result
    pub(crate) fn more_than_eq(
        &mut self,
        lhs: AcirVar,
        rhs: AcirVar,
        max_bits: u32,
    ) -> Result<AcirVar, AcirGenError> {
        let lhs_data = &self.data[&lhs];
        let rhs_data = &self.data[&rhs];
        match (lhs_data, rhs_data) {
            (AcirVarData::Expr(lhs_expr), AcirVarData::Expr(rhs_expr)) => {
                let comparison_result = self.acir_ir.bound_check(lhs_expr, rhs_expr, max_bits)?;
                return Ok(self.add_data(AcirVarData::Witness(comparison_result)));
            }
            _ => todo!("more than eq, not implemented"),
        }
    }
    pub(crate) fn assert_eq_one(&mut self, lhs: AcirVar) {
        let one_var = self.add_constant(FieldElement::one());
        self.assert_eq_var(lhs, one_var)
    }
    pub(crate) fn assert_eq_var(&mut self, lhs: AcirVar, rhs: AcirVar) {
        // TODO: could use sub_var and then assert_eq_zero
        let lhs_data = &self.data[&lhs];
        let rhs_data = &self.data[&rhs];

        match (lhs_data, rhs_data) {
            (AcirVarData::Witness(witness), AcirVarData::Expr(expr))
            | (AcirVarData::Expr(expr), AcirVarData::Witness(witness)) => {
                self.acir_ir.assert_is_zero(expr - *witness);
            }
            (AcirVarData::Witness(witness), AcirVarData::Const(constant))
            | (AcirVarData::Const(constant), AcirVarData::Witness(witness)) => self
                .acir_ir
                .assert_is_zero(&Expression::from(*witness) - &Expression::from(*constant)),
            (AcirVarData::Expr(expr), AcirVarData::Const(constant))
            | (AcirVarData::Const(constant), AcirVarData::Expr(expr)) => {
                self.acir_ir.assert_is_zero(expr.clone() - *constant)
            }
            (AcirVarData::Expr(lhs_expr), AcirVarData::Expr(rhs_expr)) => {
                self.acir_ir.assert_is_zero(lhs_expr - rhs_expr)
            }
            (AcirVarData::Witness(lhs_witness), AcirVarData::Witness(rhs_witness)) => self
                .acir_ir
                .assert_is_zero(&Expression::from(*lhs_witness) - &Expression::from(*rhs_witness)),
            (AcirVarData::Const(lhs_constant), AcirVarData::Const(rhs_constant)) => {
                // TODO: for constants, we add it as a gate.
                // TODO: Assuming users will never want to create unsatisfiable programs
                // TODO: We could return an error here instead
                self.acir_ir.assert_is_zero(Expression::from(FieldElement::from(
                    lhs_constant == rhs_constant,
                )));
            }
        }
    }

    pub(crate) fn div_var(&mut self, lhs: AcirVar, rhs: AcirVar) -> AcirVar {
        let inv_rhs = self.inv_var(rhs);
        self.mul_var(lhs, inv_rhs)
    }

    pub(crate) fn mul_var(&mut self, lhs: AcirVar, rhs: AcirVar) -> AcirVar {
        let lhs_data = &self.data[&lhs];
        let rhs_data = &self.data[&rhs];
        match (lhs_data, rhs_data) {
            (AcirVarData::Witness(witness), AcirVarData::Expr(expr))
            | (AcirVarData::Expr(expr), AcirVarData::Witness(witness)) => {
                let expr_as_witness = self.acir_ir.expression_to_witness(expr);
                let mut expr = Expression::default();
                expr.push_multiplication_term(FieldElement::one(), *witness, expr_as_witness);

                self.add_data(AcirVarData::Expr(expr))
            }
            (AcirVarData::Witness(witness), AcirVarData::Const(constant))
            | (AcirVarData::Const(constant), AcirVarData::Witness(witness)) => {
                let mut expr = Expression::default();
                expr.push_addition_term(*constant, *witness);
                self.add_data(AcirVarData::Expr(expr))
            }
            (AcirVarData::Const(constant), AcirVarData::Expr(expr))
            | (AcirVarData::Expr(expr), AcirVarData::Const(constant)) => {
                self.add_data(AcirVarData::Expr(expr * *constant))
            }
            (AcirVarData::Witness(lhs_witness), AcirVarData::Witness(rhs_witness)) => {
                let mut expr = Expression::default();
                expr.push_multiplication_term(FieldElement::one(), *lhs_witness, *rhs_witness);
                self.add_data(AcirVarData::Expr(expr))
            }
            (AcirVarData::Const(lhs_constant), AcirVarData::Const(rhs_constant)) => {
                self.add_data(AcirVarData::Const(*lhs_constant * *rhs_constant))
            }
            (AcirVarData::Expr(lhs_expr), AcirVarData::Expr(rhs_expr)) => {
                let lhs_expr_as_witness = self.acir_ir.expression_to_witness(lhs_expr);
                let rhs_expr_as_witness = self.acir_ir.expression_to_witness(rhs_expr);
                let mut expr = Expression::default();
                expr.push_multiplication_term(
                    FieldElement::one(),
                    lhs_expr_as_witness,
                    rhs_expr_as_witness,
                );
                self.add_data(AcirVarData::Expr(expr))
            }
        }
    }

    pub(crate) fn sub_var(&mut self, lhs: AcirVar, rhs: AcirVar) -> AcirVar {
        let neg_rhs = self.neg_var(rhs);
        self.add_var(lhs, neg_rhs)
    }

    pub(crate) fn add_var(&mut self, lhs: AcirVar, rhs: AcirVar) -> AcirVar {
        let lhs_data = &self.data[&lhs];
        let rhs_data = &self.data[&rhs];
        match (lhs_data, rhs_data) {
            (AcirVarData::Witness(witness), AcirVarData::Expr(expr))
            | (AcirVarData::Expr(expr), AcirVarData::Witness(witness)) => {
                self.add_data(AcirVarData::Expr(expr + &Expression::from(*witness)))
            }
            (AcirVarData::Witness(witness), AcirVarData::Const(constant))
            | (AcirVarData::Const(constant), AcirVarData::Witness(witness)) => self.add_data(
                AcirVarData::Expr(&Expression::from(*witness) + &Expression::from(*constant)),
            ),
            (AcirVarData::Expr(expr), AcirVarData::Const(constant))
            | (AcirVarData::Const(constant), AcirVarData::Expr(expr)) => {
                self.add_data(AcirVarData::Expr(expr + &Expression::from(*constant)))
            }
            (AcirVarData::Expr(lhs_expr), AcirVarData::Expr(rhs_expr)) => {
                self.add_data(AcirVarData::Expr(lhs_expr + rhs_expr))
            }
            (AcirVarData::Witness(lhs), AcirVarData::Witness(rhs)) => {
                // TODO: impl Add for Witness which returns an Expression instead of the below
                self.add_data(AcirVarData::Expr(&Expression::from(*lhs) + &Expression::from(*rhs)))
            }
            (AcirVarData::Const(lhs_const), AcirVarData::Const(rhs_const)) => {
                self.add_data(AcirVarData::Const(*lhs_const + *rhs_const))
            }
        }
    }

    fn add_data(&mut self, data: AcirVarData) -> AcirVar {
        assert_eq!(self.data.len(), self.data_reverse_map.len());

        let id = AcirVar(self.data.len());

        self.data.insert(id, data.clone());
        self.data_reverse_map.insert(data, id);

        id
    }
}

#[derive(Debug, PartialEq, Eq, Clone)]
enum AcirVarData {
    Witness(Witness),
    Expr(Expression),
    Const(FieldElement),
}

// TODO: check/test this hash impl
impl std::hash::Hash for AcirVarData {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        core::mem::discriminant(self).hash(state);
    }
}

impl AcirVarData {
    pub(crate) fn as_constant(&self) -> Option<FieldElement> {
        if let AcirVarData::Const(field) = self {
            return Some(*field);
        }
        None
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
struct AcirVar(usize);
