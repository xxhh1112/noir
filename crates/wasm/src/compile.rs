use gloo_utils::format::JsValueSerdeExt;
use log::debug;
use noirc_driver::{CompileOptions, Driver};
use noirc_frontend::graph::{CrateName, CrateType};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use wasm_bindgen::prelude::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct WASMCompileOptions {
    #[serde(default = "default_entry_point")]
    entry_point: String,

    #[serde(default = "default_circuit_name")]
    circuit_name: String,

    // Compile each contract function used within the program
    #[serde(default = "bool::default")]
    contracts: bool,

    #[serde(default)]
    compile_options: CompileOptions,

    #[serde(default)]
    optional_dependencies_set: Vec<String>,

    #[serde(default = "default_log_level")]
    log_level: String,
}

fn default_log_level() -> String {
    String::from("info")
}

fn default_circuit_name() -> String {
    String::from("contract")
}

fn default_entry_point() -> String {
    String::from("main.nr")
}

impl Default for WASMCompileOptions {
    fn default() -> Self {
        Self {
            entry_point: default_entry_point(),
            circuit_name: default_circuit_name(),
            log_level: default_log_level(),
            contracts: false,
            compile_options: CompileOptions::default(),
            optional_dependencies_set: vec![],
        }
    }
}

fn add_noir_lib(driver: &mut Driver, crate_name: &str) {
    let path_to_lib = PathBuf::from(&crate_name).join("lib.nr");
    let library_crate = driver.create_non_local_crate(path_to_lib, CrateType::Library);

    driver.propagate_dep(library_crate, &CrateName::new(crate_name).unwrap());
}

fn setup_driver(entry_point: PathBuf, dependency_set: &[String]) -> Driver {
    // For now we default to plonk width = 3, though we can add it as a parameter
    let language = acvm::Language::PLONKCSat { width: 3 };
    let mut driver = Driver::new(&language);

    driver.create_local_crate(entry_point, CrateType::Binary);

    // We are always adding std lib implicitly. It comes bundled with binary.
    add_noir_lib(&mut driver, "std");

    for dependency in dependency_set {
        add_noir_lib(&mut driver, dependency.as_str());
    }

    driver
}

#[wasm_bindgen]
pub fn compile(args: JsValue) -> JsValue {
    console_error_panic_hook::set_once();

    let options: WASMCompileOptions = if args.is_undefined() || args.is_null() {
        debug!("Initializing compiler with default values.");
        WASMCompileOptions::default()
    } else {
        JsValueSerdeExt::into_serde(&args)
            .unwrap_or_else(|_| panic!("Could not deserialize compile arguments"))
    };

    debug!("Compiler configuration {:?}", &options);

    let mut driver =
        setup_driver(PathBuf::from(options.entry_point), &options.optional_dependencies_set);

    if options.contracts {
        let compiled_contracts = driver
            .compile_contracts(&options.compile_options)
            .unwrap_or_else(|_| panic!("Contract compilation failed"));

        // Flatten each contract into a list of its functions, each being assigned a unique name.
        let collected_compiled_programs: Vec<_> = compiled_contracts
            .into_iter()
            .flat_map(|contract| {
                let contract_id = format!("{}-{}", options.circuit_name, &contract.name);
                contract.functions.into_iter().map(move |(function, program)| {
                    let program_name = format!("{}-{}", contract_id, function);
                    (program_name, program)
                })
            })
            .collect();

        <JsValue as JsValueSerdeExt>::from_serde(&collected_compiled_programs).unwrap()
    } else {
        let compiled_program = driver
            .compile_main(&options.compile_options)
            .unwrap_or_else(|_| panic!("Compilation failed"));

        <JsValue as JsValueSerdeExt>::from_serde(&compiled_program).unwrap()
    }
}
