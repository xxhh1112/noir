use std::io::Error;
use std::path::Path;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

// #[wasm_bindgen(module = "/file_reader.js")]
// extern "C" {
//     #[wasm_bindgen(catch)]
//     fn read_file(path: &str) -> Result<String, JsValue>;
// }

#[wasm_bindgen]
extern "C" {
    type Buffer;
}

#[wasm_bindgen(module = "fs")]
extern "C" {
    #[wasm_bindgen(js_name = readFileSync, catch)]
    fn read_file(path: &str) -> Result<Buffer, JsValue>;
}

pub(crate) fn read_file_to_string(path_to_file: &str) -> Result<String, Error> {
    use std::io::ErrorKind;
    // let path_str = path_to_file.as_os_str().to_str().unwrap();
    let path_str = path_to_file;
    match read_file(path_str) {
        Ok(buffer) => Ok(buffer),
        Err(_) => Err(Error::new(ErrorKind::Other, "could not read file using wasm")),
    }
}
