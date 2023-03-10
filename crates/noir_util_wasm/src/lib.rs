use wasm_bindgen::prelude::*;

use noirc_abi::{input_parser, Abi};

mod js_sys_util;

#[wasm_bindgen]
pub fn arrange_initial_witness(abi_json_str: String, inputs_json_str: String) -> js_sys::Map {
    console_error_panic_hook::set_once();

    let abi = match serde_json::from_str::<Abi>(&abi_json_str) {
        Ok(abi) => abi,
        Err(err) => panic!("Failed to read ABI: {}", err),
    };
    let parser = input_parser::Format::Json;
    let input_map = match parser.parse(&inputs_json_str, &abi) {
        Ok(input_map) => input_map,
        Err(err) => panic!("Failed to parse input: {}", err),
    };
    let initial_witness = match abi.encode(&input_map, None) {
        Ok(initial_witness) => initial_witness,
        Err(err) => panic!("Failed to arrange initial witness: {}", err),
    };
    js_sys_util::witness_map_to_js_map(initial_witness)
}
