// Tests a very simple Brillig function.
// 
// The features being tested are cast operations on brillig

// A one is passed as param so the compiler cannot simplify the assertions done here
fn main(one: Field)  {
    bool_casts(one);
    field_casts(one);
    uint_casts(one);
    int_casts(one);
    mixed_casts(one);
}

unconstrained fn bool_casts(one: Field) {
    assert(false == (one - 1) as bool);
    assert(true == one as bool);
    assert(true == (one * 3) as bool);
}

unconstrained fn field_casts(one: Field) {
    assert((one * 5) as u8 as Field == 5);
    assert((one * 16) as u4 as Field == 0);
}

unconstrained fn uint_casts(one: Field) {
    let x = (one * 100) as u32;
    assert(x as u2 == 0);
    assert(x as u4 == 4);
    assert(x as u6 == 36);
    assert(x as u8 == 100);
    assert(x as u64 == 100);
    assert(x as u126 == 100);
}

unconstrained fn int_casts(one: Field) {
    let x = (one * 100) as i32;
    assert(x as i2 == 0);
    assert(x as i4 == 4);
    assert(x as i6 == -28 as i6);
    assert(x as i8 == 100);
    assert(x as i8 == 100);
    assert(x as i8 == 100);
}


unconstrained fn mixed_casts(one: Field) {
    assert((one * 100) as u32 as i32 as u32 == 100);
    assert((one * 13) as u4 as i2 as u32 == 1);
    assert((one * 15) as u4 as i2 as u32 == 3);
    assert(one as u8 as bool == true);
    assert(one as bool as i8 == 1);
}
