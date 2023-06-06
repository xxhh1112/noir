// Tests a very simple program.
// 
// The features being tested is simple addition in Brillig
fn main(x : Field)  {
    assert(x + 1 == add_field(x));
}

unconstrained fn add_field(x : Field) -> Field {
  x + 1
}