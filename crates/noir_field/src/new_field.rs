// Field element is simply a vector of u8s
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub struct FieldElement([u8; 32]);

impl FieldElement {
    pub fn is_zero(&self, op: &dyn FieldOp) -> bool {
        op.cmp(self, &Self::zero())
    }
    pub fn is_one(&self, op: &dyn FieldOp) -> bool {
        op.cmp(self, &Self::one())
    }

    pub fn one() -> FieldElement {
        FieldElement([
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 1,
        ])
    }
    pub fn zero() -> FieldElement {
        FieldElement([
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0,
        ])
    }
}

pub trait FieldOp {
    fn reduce(&self, field: &FieldElement) -> FieldElement;
    fn neg(&self, field: &FieldElement) -> FieldElement;
    fn cmp(&self, lhs: &FieldElement, rhs: &FieldElement) -> bool;
    fn add(&self, lhs: &FieldElement, rhs: &FieldElement) -> FieldElement;
    fn sub(&self, lhs: &FieldElement, rhs: &FieldElement) -> FieldElement;
    fn mul(&self, lhs: &FieldElement, rhs: &FieldElement) -> FieldElement;
    fn div(&self, lhs: &FieldElement, rhs: &FieldElement) -> FieldElement;
}
