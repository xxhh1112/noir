mod test1;
mod test2;


use dep::std;


// msg is the email and shipping address combined
fn main(y : Field, x : Field, answer1 : pub Field, answer2 :pub Field, _answer3 : pub [32]u8, msg : [200]u8){    

    // Question 1, is about operators and number types see the docs
    priv k = test1::run(x,y);
    constrain k == answer1;

    constrain x != y;
    constrain x != 0;


    // Question 2, is about loops

    test2::run(x, y, answer2);

    // Question 3, is about private inputs and hashing. Enter a msg which is the concatenation of you email and shipping address padded with 0's to 200 bytes. The first character of the array should be 8.
    constrain msg[0] == 8; 
    constrain _answer3 == std::hash::sha256(msg);
}


