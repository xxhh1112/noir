use crate::{
    errors::RuntimeErrorKind,
    ssa::{acir_gen::expression_to_witness, builtin::Endian},
    Evaluator,
};
use acvm::{
    acir::{
        circuit::{
            directives::Directive,
            opcodes::{BlackBoxFuncCall, FunctionInput, Opcode as AcirOpcode},
        },
        native_types::{Expression, Witness},
    },
    FieldElement,
};
use num_bigint::BigUint;
use num_traits::One;
use std::ops::Mul;

// Code in this file, will generate constraints without
// using only the Evaluator and ACIR Expression types

pub(crate) fn mul_with_witness(
    evaluator: &mut Evaluator,
    a: &Expression,
    b: &Expression,
) -> Expression {
    let a_arith;
    let a_arith = if !a.mul_terms.is_empty() && !b.is_const() {
        let a_witness = evaluator.create_intermediate_variable(a.clone());
        a_arith = Expression::from(a_witness);
        &a_arith
    } else {
        a
    };
    let b_arith;
    let b_arith = if !b.mul_terms.is_empty() && !a.is_const() {
        if a == b {
            a_arith
        } else {
            let b_witness = evaluator.create_intermediate_variable(b.clone());
            b_arith = Expression::from(b_witness);
            &b_arith
        }
    } else {
        b
    };
    a_arith * b_arith
}

pub(crate) fn boolean(witness: Witness) -> Expression {
    Expression {
        mul_terms: vec![(FieldElement::one(), witness, witness)],
        linear_combinations: vec![(-FieldElement::one(), witness)],
        q_c: FieldElement::zero(),
    }
}

pub(crate) fn boolean_expr(expr: &Expression, evaluator: &mut Evaluator) -> Expression {
    &mul_with_witness(evaluator, expr, expr) - expr
}

//constrain witness a to be num_bits-size integer, i.e between 0 and 2^num_bits-1
pub(crate) fn range_constraint(
    witness: Witness,
    num_bits: u32,
    evaluator: &mut Evaluator,
) -> Result<(), RuntimeErrorKind> {
    if num_bits == 1 {
        // Add a bool gate
        let bool_constraint = boolean(witness);
        evaluator.push_opcode(AcirOpcode::Arithmetic(bool_constraint));
    } else if num_bits == FieldElement::max_num_bits() {
        // Don't apply any constraints if the range is for the maximum number of bits
        let message = format!(
            "All Witnesses are by default u{}. Applying this type does not apply any constraints.",
            FieldElement::max_num_bits()
        );
        return Err(RuntimeErrorKind::UnstructuredError { message });
    } else if num_bits % 2 == 1 {
        // Note if the number of bits is odd, then Barretenberg will panic
        // new witnesses; r is constrained to num_bits-1 and b is 1 bit
        let r_witness = evaluator.add_witness_to_cs();
        let b_witness = evaluator.add_witness_to_cs();
        let exp_big = BigUint::from(2_u128).pow(num_bits - 1);
        let exp = FieldElement::from_be_bytes_reduce(&exp_big.to_bytes_be());
        evaluator.push_opcode(AcirOpcode::Directive(Directive::Quotient {
            a: Expression::from(witness),
            b: Expression::from_field(exp),
            q: b_witness,
            r: r_witness,
            predicate: None,
        }));

        try_range_constraint(r_witness, num_bits - 1, evaluator);
        try_range_constraint(b_witness, 1, evaluator);

        //Add the constraint a = r + 2^N*b
        let mut f = FieldElement::from(2_i128);
        f = f.pow(&FieldElement::from((num_bits - 1) as i128));
        let res = Expression::from(r_witness).add_mul(f, &b_witness.into());
        evaluator.push_opcode(AcirOpcode::Arithmetic(&res - witness));
    } else {
        let gate = AcirOpcode::BlackBoxFuncCall(BlackBoxFuncCall {
            name: acvm::acir::BlackBoxFunc::RANGE,
            inputs: vec![FunctionInput { witness, num_bits }],
            outputs: vec![],
        });
        evaluator.push_opcode(gate);
    }

    Ok(())
}

// returns a witness of a>=b
pub(crate) fn bound_check(
    a: &Expression,
    b: &Expression,
    max_bits: u32,
    evaluator: &mut Evaluator,
) -> Witness {
    assert!(max_bits + 1 < FieldElement::max_num_bits()); //n.b what we really need is 2^{max_bits+1}<p
    let mut sub = a - b;
    let two = FieldElement::from(2_i128);
    let two_s = two.pow(&FieldElement::from(max_bits as i128));
    sub.q_c += two_s;
    let q_witness = evaluator.add_witness_to_cs();
    let r_witness = evaluator.add_witness_to_cs();
    //2^s+a-b=q*2^s +r
    let expr = Expression::from(r_witness).add_mul(two_s, &q_witness.into());
    evaluator.push_opcode(AcirOpcode::Arithmetic(&sub - &expr));
    evaluator.push_opcode(AcirOpcode::Directive(Directive::Quotient {
        a: sub,
        b: Expression::from_field(two_s),
        q: q_witness,
        r: r_witness,
        predicate: None,
    }));
    try_range_constraint(r_witness, max_bits, evaluator);
    evaluator.push_opcode(AcirOpcode::Arithmetic(boolean(q_witness)));
    q_witness
}

// Generate constraints that are satisfied iff
// a < b , when offset is 1, or
// a <= b, when offset is 0
// bits is the bit size of a and b (or an upper bound of the bit size)
///////////////
// a<=b is done by constraining b-a to a bit size of 'bits':
// if a<=b, 0 <= b-a <= b < 2^bits
// if a>b, b-a = p+b-a > p-2^bits >= 2^bits  (if log(p) >= bits + 1)
// n.b: we do NOT check here that a and b are indeed 'bits' size
// a < b <=> a+1<=b
pub(crate) fn bound_constraint_with_offset(
    a: &Expression,
    b: &Expression,
    offset: &Expression,
    bits: u32,
    evaluator: &mut Evaluator,
) {
    assert!(
        bits < FieldElement::max_num_bits(),
        "range check with bit size of the prime field is not implemented yet"
    );

    let mut aof = a + offset;

    if b.is_const() && b.q_c.fits_in_u128() {
        let f = if *offset == Expression::one() {
            aof = a.clone();
            assert!(b.q_c.to_u128() >= 1);
            b.q_c.to_u128() - 1
        } else {
            b.q_c.to_u128()
        };

        if f < 3 {
            match f {
                0 => evaluator.push_opcode(AcirOpcode::Arithmetic(aof)),
                1 => {
                    let expr = boolean_expr(&aof, evaluator);
                    evaluator.push_opcode(AcirOpcode::Arithmetic(expr));
                }
                2 => {
                    let y = expression_to_witness(boolean_expr(&aof, evaluator), evaluator);
                    let two = FieldElement::from(2_i128);
                    let y_expr = y.into();
                    let eee = mul_with_witness(evaluator, &aof, &y_expr).add_mul(-two, &y_expr);
                    evaluator.push_opcode(AcirOpcode::Arithmetic(eee));
                }
                _ => unreachable!(),
            }
            return;
        }
        let bit_size = bit_size_u128(f);
        if bit_size < 128 {
            let r = (1_u128 << bit_size) - f - 1;
            assert!(bits + bit_size < FieldElement::max_num_bits()); //we need to ensure a+r does not overflow
            let aor = &aof * FieldElement::from(r);
            let witness = expression_to_witness(aor, evaluator);
            try_range_constraint(witness, bit_size, evaluator);
            return;
        }
    }

    let sub_expression = b - &aof; //b-(a+offset)
    let w = expression_to_witness(sub_expression, evaluator);
    try_range_constraint(w, bits, evaluator);
}

pub(crate) fn try_range_constraint(w: Witness, bits: u32, evaluator: &mut Evaluator) {
    if let Err(err) = range_constraint(w, bits, evaluator) {
        eprintln!("{err}");
    }
}

//decompose lhs onto radix-base with limb_size limbs
pub(crate) fn to_radix_base(
    lhs: &Expression,
    radix: u32,
    limb_size: u32,
    endianness: Endian,
    evaluator: &mut Evaluator,
) -> Vec<Witness> {
    // ensure there is no overflow
    let mut max = BigUint::from(radix);
    max = max.pow(limb_size) - BigUint::one();
    assert!(max < FieldElement::modulus());

    let (mut result, bytes) = to_radix_little(radix, limb_size, evaluator);

    evaluator.push_opcode(AcirOpcode::Directive(Directive::ToLeRadix {
        a: lhs.clone(),
        b: result.clone(),
        radix,
    }));

    if endianness == Endian::Big {
        result.reverse();
    }

    evaluator.push_opcode(AcirOpcode::Arithmetic(lhs - &bytes));

    result
}

//Decomposition into b-base: \sum ai b^i, where 0<=ai<b
// radix: the base, (it is a constant, not a witness)
// num_limbs: the number of elements in the decomposition
// output: (the elements of the decomposition as witness, the sum expression)
pub(crate) fn to_radix_little(
    radix: u32,
    num_limbs: u32,
    evaluator: &mut Evaluator,
) -> (Vec<Witness>, Expression) {
    let mut digits = Expression::default();
    let mut radix_pow = FieldElement::one();

    let shift = FieldElement::from(radix as i128);
    let mut result = Vec::new();
    let bit_size = bit_size_u32(radix);
    for _ in 0..num_limbs {
        let limb_witness = evaluator.add_witness_to_cs();
        result.push(limb_witness);
        let limb_expr = limb_witness.into();
        digits = digits.add_mul(radix_pow, &limb_expr);
        radix_pow = radix_pow.mul(shift);

        if 1_u128 << (bit_size - 1) != radix as u128 {
            try_range_constraint(limb_witness, bit_size, evaluator);
        }
        bound_constraint_with_offset(
            &limb_witness.into(),
            &Expression::from_field(shift),
            &Expression::one(),
            bit_size,
            evaluator,
        );
    }
    (result, digits)
}

//Returns 1 if lhs < rhs
pub(crate) fn evaluate_cmp(
    lhs: &Expression,
    rhs: &Expression,
    bit_size: u32,
    signed: bool,
    evaluator: &mut Evaluator,
) -> Expression {
    if signed {
        //TODO use range_constraints instead of bit decomposition, like in the unsigned case
        let mut sub_expr = lhs - rhs;
        let two_pow = BigUint::one() << (bit_size + 1);
        sub_expr.q_c += FieldElement::from_be_bytes_reduce(&two_pow.to_bytes_be());
        let bits = to_radix_base(&sub_expr, 2, bit_size + 2, Endian::Little, evaluator);
        bits[(bit_size - 1) as usize].into()
    } else {
        let is_greater = bound_check(lhs, rhs, bit_size, evaluator);
        FieldElement::one() - Expression::from(is_greater)
    }
}

//truncate lhs (a number whose value requires max_bits) into a rhs-bits number: i.e it returns b such that lhs mod 2^rhs is b
pub(crate) fn evaluate_truncate(
    lhs: &Expression,
    rhs: u32,
    max_bits: u32,
    evaluator: &mut Evaluator,
) -> Expression {
    assert!(max_bits > rhs, "max_bits = {max_bits}, rhs = {rhs}");
    let exp_big = BigUint::from(2_u32).pow(rhs);

    //0. Check for constant expression. This can happen through arithmetic simplifications
    if let Some(a_c) = lhs.to_const() {
        let mut a_big = BigUint::from_bytes_be(&a_c.to_be_bytes());
        a_big %= exp_big;
        return Expression::from(FieldElement::from_be_bytes_reduce(&a_big.to_bytes_be()));
    }
    let exp = FieldElement::from_be_bytes_reduce(&exp_big.to_bytes_be());

    //1. Generate witnesses a,b,c
    let b_witness = evaluator.add_witness_to_cs();
    let c_witness = evaluator.add_witness_to_cs();
    evaluator.push_opcode(AcirOpcode::Directive(Directive::Quotient {
        a: lhs.clone(),
        b: Expression::from_field(exp),
        q: c_witness,
        r: b_witness,
        predicate: None,
    }));

    try_range_constraint(b_witness, rhs, evaluator); //TODO propagate the error using ?
    try_range_constraint(c_witness, max_bits - rhs, evaluator);

    //2. Add the constraint a = b+2^Nc
    let mut f = FieldElement::from(2_i128);
    f = f.pow(&FieldElement::from(rhs as i128));
    let res = Expression::from(b_witness).add_mul(f, &c_witness.into()); //b+2^Nc
    evaluator.push_opcode(AcirOpcode::Arithmetic(&res - lhs));

    Expression::from(b_witness)
}

pub(crate) fn evaluate_udiv(
    lhs: &Expression,
    rhs: &Expression,
    bit_size: u32,
    predicate: &Expression,
    evaluator: &mut Evaluator,
) -> (Witness, Witness) {
    let q_witness = evaluator.add_witness_to_cs();
    let r_witness = evaluator.add_witness_to_cs();
    let pa = mul_with_witness(evaluator, lhs, predicate);
    evaluator.push_opcode(AcirOpcode::Directive(Directive::Quotient {
        a: lhs.clone(),
        b: rhs.clone(),
        q: q_witness,
        r: r_witness,
        predicate: Some(predicate.clone()),
    }));

    //r<b
    let r_expr = Expression::from(r_witness);
    try_range_constraint(r_witness, bit_size, evaluator);
    bound_constraint_with_offset(&r_expr, rhs, predicate, bit_size, evaluator);
    //range check q<=a
    try_range_constraint(q_witness, bit_size, evaluator);
    // a-b*q-r = 0
    let mut d = mul_with_witness(evaluator, rhs, &q_witness.into());
    d = &d + r_witness;
    d = mul_with_witness(evaluator, &d, predicate);
    let div_euclidean = &pa - &d;

    evaluator.push_opcode(AcirOpcode::Arithmetic(div_euclidean));
    (q_witness, r_witness)
}

/// Creates a new witness and constrains it to be the inverse of x
pub(crate) fn evaluate_inverse(
    x_witness: Witness,
    predicate: &Expression,
    evaluator: &mut Evaluator,
) -> Witness {
    // Create a fresh witness - n.b we could check if x is constant or not
    let inverse_witness = evaluator.add_witness_to_cs();
    evaluator.push_opcode(AcirOpcode::Directive(Directive::Invert {
        x: x_witness,
        result: inverse_witness,
    }));

    //x*inverse = 1
    let one = &Expression::from(x_witness) * &Expression::from(inverse_witness);
    let lhs = mul_with_witness(evaluator, &one, predicate);
    evaluator.push_opcode(AcirOpcode::Arithmetic(&lhs - predicate));
    inverse_witness
}

//Zero Equality gate: returns 1 if x is not null and 0 else
pub(crate) fn evaluate_zero_equality(x_witness: Witness, evaluator: &mut Evaluator) -> Witness {
    let m = evaluator.add_witness_to_cs(); //'inverse' of x
    evaluator.push_opcode(AcirOpcode::Directive(Directive::Invert { x: x_witness, result: m }));

    //y=x*m         y is 1 if x is not null, and 0 else
    let y_witness = evaluator.add_witness_to_cs();
    evaluator.push_opcode(AcirOpcode::Arithmetic(Expression {
        mul_terms: vec![(FieldElement::one(), x_witness, m)],
        linear_combinations: vec![(-FieldElement::one(), y_witness)],
        q_c: FieldElement::zero(),
    }));

    //x=y*x
    let xy = &Expression::from(x_witness) * &Expression::from(y_witness);
    evaluator.push_opcode(AcirOpcode::Arithmetic(&xy - x_witness));
    y_witness
}

// Given two lists, `A` and `B` of `Expression`s
// We generate constraints that A and B are equal
// An `Expression` is returned that indicates whether this
// was true.
//
// This method does not check the arrays length.
// We assume this has been checked by the caller.
pub(crate) fn arrays_eq_predicate(
    a_values: &[Expression],
    b_values: &[Expression],
    evaluator: &mut Evaluator,
) -> Expression {
    let mut sum = Expression::default();

    for (a_iter, b_iter) in a_values.iter().zip(b_values) {
        let diff_expr = a_iter - b_iter;

        let diff_witness = evaluator.add_witness_to_cs();

        evaluator.push_opcode(AcirOpcode::Arithmetic(&diff_expr - &diff_witness.into()));
        //TODO: avoid creating witnesses for diff
        sum = &sum + evaluate_zero_equality(diff_witness, evaluator);
    }
    sum
}

// TODO: An issue should be created for this
pub(crate) fn evaluate_sdiv(
    _lhs: &Expression,
    _rhs: &Expression,
    _evaluator: &mut Evaluator,
) -> (Expression, Expression) {
    todo!();
}

const fn num_bits<T>() -> usize {
    std::mem::size_of::<T>() * 8
}

fn bit_size_u128(a: u128) -> u32 where {
    num_bits::<u128>() as u32 - a.leading_zeros()
}

fn bit_size_u32(a: u32) -> u32 where {
    num_bits::<u32>() as u32 - a.leading_zeros()
}
