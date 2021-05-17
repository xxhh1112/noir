// turn off linting related to operator usage (this
// file contains /implementations/)
#![allow(clippy::op_ref)]

use crate::native_types::{Arithmetic, Witness};
use noir_field::{FieldElement, FieldOp};

use std::ops::{Add, Mul, Neg, Sub};

#[derive(Clone, Copy, Debug)]
pub struct Linear {
    pub mul_scale: FieldElement,
    pub witness: Witness,
    pub add_scale: FieldElement,
}

impl Linear {
    pub fn is_unit(&self, op: &dyn FieldOp) -> bool {
        self.mul_scale.is_one(op) && self.add_scale.is_zero(op)
    }
    pub fn from_witness(witness: Witness) -> Linear {
        Linear {
            mul_scale: FieldElement::one(),
            witness,
            add_scale: FieldElement::zero(),
        }
    }
    // XXX: This is true for the NPC languages that we use, are there any where this is not true?
    pub const fn can_defer_constraint(&self) -> bool {
        true
    }

    pub fn add(&self, rhs: &Linear, field_op: &dyn FieldOp) -> Arithmetic {
        // (Ax+B) + ( Cx + D) = (Ax + Cx) + ( B+D)
        // (Ax + B) + (Cy + D) = Ax + Cy + (B+D)
        Arithmetic {
            mul_terms: Vec::new(),
            linear_combinations: vec![(self.mul_scale, self.witness), (rhs.mul_scale, rhs.witness)],
            q_c: field_op.add(&self.add_scale, &rhs.add_scale),
        }
    }
    pub fn sub(&self, rhs: &Linear, field_op: &dyn FieldOp) -> Arithmetic {
        let neg_rhs = rhs.neg(field_op);
        self.add(&neg_rhs, field_op)
    }
    pub fn mul_field(&self, rhs: &FieldElement, field_op: &dyn FieldOp) -> Linear {
        Linear {
            mul_scale: field_op.mul(&self.mul_scale, &rhs),
            witness: self.witness,
            add_scale: field_op.mul(&self.add_scale, &rhs),
        }
    }
    pub fn add_field(&self, rhs: &FieldElement, field_op: &dyn FieldOp) -> Linear {
        Linear {
            mul_scale: self.mul_scale,
            witness: self.witness,
            add_scale: field_op.add(&self.add_scale, &rhs),
        }
    }
    pub fn sub_field(&self, rhs: &FieldElement, field_op: &dyn FieldOp) -> Linear {
        let neg_rhs = field_op.neg(rhs);
        self.add_field(&neg_rhs, field_op)
    }
    pub fn mul(&self, rhs: &Linear, field_op: &dyn FieldOp) -> Arithmetic {
        // (Ax+B)(Cy+D) = ACxy + ADx + BCy + BD
        let a = self.mul_scale;
        let b = self.add_scale;
        let x = self.witness;

        let c = rhs.mul_scale;
        let d = rhs.add_scale;
        let y = rhs.witness;

        let ac = field_op.mul(&a, &c);
        let ad = field_op.mul(&a, &d);
        let bc = field_op.mul(&b, &c);
        let bd = field_op.mul(&b, &d);

        let mul_terms = {
            let mut mt = Vec::with_capacity(1);
            if ac != FieldElement::zero() {
                mt.push((ac, x, y))
            }
            mt
        };

        let linear_combinations = {
            let mut lc = Vec::with_capacity(2);

            if ad != FieldElement::zero() {
                lc.push((ad, x));
            }
            if bc != FieldElement::zero() {
                lc.push((bc, y));
            }
            lc
        };

        Arithmetic {
            mul_terms,
            linear_combinations,
            q_c: bd,
        }
    }
    pub fn neg(&self, field_op: &dyn FieldOp) -> Linear {
        // -(Ax + B) = -Ax - B
        Linear {
            add_scale: field_op.neg(&self.add_scale),
            witness: self.witness,
            mul_scale: field_op.neg(&self.mul_scale),
        }
    }
}

impl From<Witness> for Linear {
    fn from(w: Witness) -> Linear {
        Linear::from_witness(w)
    }
}
impl From<FieldElement> for Linear {
    fn from(element: FieldElement) -> Linear {
        Linear {
            add_scale: element,
            witness: Witness::default(),
            mul_scale: FieldElement::zero(),
        }
    }
}
