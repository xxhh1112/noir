mod import;
use dep::std;

use crate::import::hello;

fn main(x : Field, y : Field) {
    let _k = std::hash::pedersen([x], 0);
    let _l = hello(x);

    assert(x != import::hello(y));
}
