// Test unsafe integer multiplication with overflow: 12^8 = 429 981 696
// The circuit should handle properly the growth of the bit size

fn main(x : Field, y : Field) {
    constrain x == 2;
    constrain y == 2;
}