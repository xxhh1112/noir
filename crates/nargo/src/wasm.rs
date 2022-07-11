use std::path::Path;

use noirc_driver::CompiledProgram;

use crate::resolver::Resolver;

pub fn compile_project<P: AsRef<Path>>(program_dir: P) -> CompiledProgram {
    let driver = Resolver::resolve_root_config(program_dir.as_ref()).unwrap();
    // For now we default to plonk width = 3
    let language = acvm::Language::PLONKCSat { width: 3 };
    driver.into_compiled_program(language, false)
}

pub fn compile_file<P: AsRef<Path>>(src: P) -> CompiledProgram {
    // For now we default to plonk width = 3
    let language = acvm::Language::PLONKCSat { width: 3 };
    noirc_driver::Driver::compile_file(src.as_ref().to_path_buf(), language)
}
