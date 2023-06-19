use dep::std;
 // Tests a very simple program.
 // 
 // The features being tested is basic call on brillig
 fn main(_x: Field)  {
    // assert(33 == );
    bar();
 }


unconstrained fn bar() -> Field {
    foo(123)
}

unconstrained fn foo(_x : Field) -> Field {
    // assert(y==4);
    // _y
    //  2*foo2(4)
    2
}

//  unconstrained fn foo2(y: Field) -> Field {
//      y*y
//  }