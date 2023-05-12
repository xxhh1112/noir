use dep::std;

fn main(x: Field, y: Field, salt: Field, out_x: Field, out_y: Field, out_x_1: Field, out_y_1: Field) {
    let res = std::hash::pedersen([x, y], 0);
    assert(res[0] == out_x);
    assert(res[1] == out_y);

    let res_1 = std::hash::pedersen([x, y], 1);
    assert(res_1[0] == out_x_1);
    assert(res_1[1] == out_y_1);

    let raw_data = [x,y];
    let mut state = 0;
    for i in 0..2 {
        state = state * 8 + raw_data[i];
    }
    state += salt;
    let hash = std::hash::pedersen([state], 0);
    assert(std::hash::pedersen([43], 0)[0] == hash[0]);
    assert(std::hash::pedersen([43], 1)[0] != hash[0]);
}
    
