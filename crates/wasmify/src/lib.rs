use acvm::acir::circuit::Circuit;
use acvm::{acir::native_types::Witness, FieldElement};
// use noirc_driver::CompiledProgram;
use noirc_driver::CompiledProgram;
use std::{
    collections::BTreeMap,
    io::Error,
    path::{Path, PathBuf},
};
use wasm_bindgen::prelude::*;

// mod file_reader;

#[wasm_bindgen(module = "/file_reader.js")]
extern "C" {
    #[wasm_bindgen(catch)]
    fn read_file(path: &str) -> Result<String, JsValue>;
}

pub(crate) fn read_file_to_string(path_to_file: &str) -> Result<String, Error> {
    use std::io::ErrorKind;
    // let path_str = path_to_file.as_os_str().to_str().unwrap();
    let path_str = path_to_file;
    unsafe {
        match read_file(path_str) {
            Ok(buffer) => Ok(buffer),
            Err(_) => Err(Error::new(ErrorKind::Other, "could not read file using wasm")),
        }
    }
}

#[wasm_bindgen]
pub fn read_file_js(src: String) -> String {
    // String::new()
    // std::fs::read_to_string(&src).unwrap()
    read_file_to_string(&src).unwrap()
}
// Returns a compiled program
#[wasm_bindgen]
pub fn compile_single_file(src: String) -> JsValue {
    console_error_panic_hook::set_once();
    // For now we default to plonk width = 3
    let language = acvm::Language::PLONKCSat { width: 3 };
    let compiled_program = noirc_driver::Driver::compile_file(src, language);
    JsValue::from_serde(&compiled_program).unwrap()
}
// This is the circuit being returned in the format that the c++ code can understand
#[wasm_bindgen]
pub fn compile_single_file_serialised_circuit(src: String) -> Vec<u8> {
    console_error_panic_hook::set_once();
    // For now we default to plonk width = 3
    let language = acvm::Language::PLONKCSat { width: 3 };
    let compiled_program = noirc_driver::Driver::compile_file(src, language);
    wasm_pwg::serialiser::serialise_circuit(&compiled_program.circuit)
}
#[wasm_bindgen]
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}

// Flattened
pub type ComputedWitness = Vec<u8>;
use acvm::PartialWitnessGenerator;
// use wasm_pwg::Plonk;

#[wasm_bindgen]
pub fn compute_witnesses(circuit: JsValue, initial_witness: Vec<u32>) -> ComputedWitness {
    let circuit: Circuit = circuit.into_serde().unwrap();

    // Convert initial witness vector to a BTreeMap and add the zero witness as the first one
    let mut witness_map: BTreeMap<Witness, FieldElement> = BTreeMap::new();
    // witness_map.insert(Witness(0), FieldElement::zero());
    let num_wits = circuit.current_witness_index;
    for (index, element) in initial_witness.into_iter().enumerate() {
        witness_map.insert(Witness((index + 1) as u32), FieldElement::from(element as u128));
    }
    debug_assert_eq!((num_wits + 1) as usize, witness_map.len());

    // Now use the partial witness generator to fill in the rest of the witnesses
    // which are possible

    let plonk = ::wasm_pwg::Plonk;
    match plonk.solve(&mut witness_map, circuit.gates) {
        Ok(_) => {}
        Err(opcode) => panic!("solver came across an error with opcode {}", opcode),
    };

    // let field_values_as_bytes: Vec<_> =
    //     witness_map.into_iter().map(|(_, field_val)| field_val.to_bytes()).flatten().collect();
    // field_values_as_bytes

    // Serialise the witness in a way that the C++ codebase can deserialise
    let assignments = wasm_pwg::structures::Assignments::from_vec(
        witness_map.into_iter().map(|(_, field_val)| field_val).collect(),
    );

    assignments.to_bytes()
}
