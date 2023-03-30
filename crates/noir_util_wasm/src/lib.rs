use std::collections::BTreeMap;

use acvm::{
    acir::{circuit::Circuit, native_types::Witness},
    FieldElement,
};
use wasm_bindgen::prelude::*;

use noirc_abi::{input_parser, Abi, MAIN_RETURN_NAME};

mod js_sys_util;

fn js_map_to_witness_map(js_map: js_sys::Map) -> BTreeMap<Witness, FieldElement> {
    let mut witness_skeleton: BTreeMap<Witness, FieldElement> = BTreeMap::new();
    for key_result in js_map.keys() {
        let key = key_result.expect("bad key");
        let idx;
        unsafe {
            idx = key.as_f64().expect("not a number").to_int_unchecked::<u32>();
        }
        let hex_str = js_map.get(&key).as_string().expect("not a string");
        let field_element = FieldElement::from_hex(&hex_str).expect("bad hex str");
        witness_skeleton.insert(Witness(idx), field_element);
    }
    witness_skeleton
}

fn witness_map_to_js_map(witness_map: BTreeMap<Witness, FieldElement>) -> js_sys::Map {
    let js_map = js_sys::Map::new();
    for (witness, field_value) in witness_map.iter() {
        let js_idx = js_sys::Number::from(witness.0);
        let mut hex_str = "0x".to_owned();
        hex_str.push_str(&field_value.to_hex());
        let js_hex_str = js_sys::JsString::from(hex_str);
        js_map.set(&js_idx, &js_hex_str);
    }
    js_map
}

fn read_circuit(circuit: js_sys::Uint8Array) -> Circuit {
    let circuit: Vec<u8> = circuit.to_vec();
    match Circuit::read(&*circuit) {
        Ok(circuit) => circuit,
        Err(err) => panic!("Circuit read err: {}", err),
    }
}

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

#[wasm_bindgen]
pub fn arrange_public_witness(abi_json_str: String, inputs_json_str: String) -> js_sys::Map {
    console_error_panic_hook::set_once();

    let abi = match serde_json::from_str::<Abi>(&abi_json_str) {
        Ok(abi) => abi,
        Err(err) => panic!("Failed to read ABI: {}", err),
    };
    let public_abi = abi.public_abi();
    let parser = input_parser::Format::Json;
    let mut input_map = match parser.parse(&inputs_json_str, &public_abi) {
        Ok(input_map) => input_map,
        Err(err) => panic!("Failed to parse input: {}", err),
    };
    let return_value = input_map.remove(MAIN_RETURN_NAME);
    let public_witness = match public_abi.encode(&input_map, return_value) {
        Ok(public_witness) => public_witness,
        Err(err) => panic!("Failed to arrange initial witness: {}", err),
    };
    js_sys_util::witness_map_to_js_map(public_witness)
}

#[wasm_bindgen]
pub fn select_return_value(abi_json_str: String, intermediate_witness: js_sys::Map) -> String {
    console_error_panic_hook::set_once();

    let intermediate_witness = js_map_to_witness_map(intermediate_witness);
    let abi = match serde_json::from_str::<Abi>(&abi_json_str) {
        Ok(abi) => abi,
        Err(err) => panic!("Failed to read ABI: {}", err),
    };
    let parser = input_parser::Format::Json;
    let return_value = match abi.decode(&intermediate_witness) {
        // `None` indicates that the circuit has no return value -> return a serialised "null"
        Ok((_inputs_map, None)) => return "null".to_owned(),
        Ok((_inputs_map, Some(return_value))) => return_value,
        Err(err) => panic!("Failed to decode intermediate witness: {}", err),
    };
    let input_map = BTreeMap::from([(MAIN_RETURN_NAME.to_owned(), return_value)]);
    match parser.serialize(&input_map) {
        Ok(json_str) => json_str,
        Err(err) => panic!("Failed to serialise return value: {}", err),
    }
}

#[wasm_bindgen]
pub fn select_public_witness(
    circuit: js_sys::Uint8Array,
    intermediate_witness: js_sys::Map,
) -> js_sys::Map {
    console_error_panic_hook::set_once();

    let circuit = read_circuit(circuit);
    let intermediate_witness = js_map_to_witness_map(intermediate_witness);
    let public_witness = circuit
        .public_inputs()
        .indices()
        .iter()
        .map(|idx| {
            let witness = Witness(*idx);
            let field_element =
                *intermediate_witness.get(&witness).expect("witness element not found");
            (witness, field_element)
        })
        .collect::<BTreeMap<_, _>>();
    witness_map_to_js_map(public_witness)
}

#[wasm_bindgen]
pub fn select_public_witness_flattened(
    circuit: js_sys::Uint8Array,
    intermediate_witness: js_sys::Map,
) -> js_sys::Array {
    console_error_panic_hook::set_once();

    let circuit = read_circuit(circuit);
    let intermediate_witness = js_map_to_witness_map(intermediate_witness);
    let out = js_sys::Array::default();
    for witness in circuit.public_inputs().indices() {
        let field_element =
            *intermediate_witness.get(&Witness(witness)).expect("witness element not found");
        let hex: String = format!("0x{}", field_element.to_hex()).into();
        out.push(&js_sys::JsString::from(hex));
    }
    out
}
