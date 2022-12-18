use clap::Args;
use std::path::{Path, PathBuf};

use crate::{
    constants::{PKG_FILE, SRC_DIR},
    errors::CliError,
    toml::Config,
};

use super::fs::{create_named_dir, write_to_file};
use super::NargoConfig;

/// Create a new binary project
#[derive(Debug, Clone, Args)]
pub(crate) struct NewCommand {
    /// Name of the package
    package_name: String,
    /// The path to save the new project
    path: Option<PathBuf>,
}

pub(crate) fn run(args: NewCommand, config: NargoConfig) -> Result<(), CliError> {
    let mut package_dir = config.program_dir;

    package_dir.push(Path::new(&args.package_name));
    if package_dir.exists() {
        return Err(CliError::DestinationAlreadyExists(package_dir));
    }

    let src_dir = package_dir.join(Path::new(SRC_DIR));
    create_named_dir(&src_dir, "src");

    const EXAMPLE: &str =
        concat!("fn main(x : Field, y : pub Field) {\n", "    constrain x != y;\n", "}");

    let settings = toml::to_string(&Config::default()).unwrap();

    write_to_file(settings.as_bytes(), &package_dir.join(Path::new(PKG_FILE)));
    write_to_file(EXAMPLE.as_bytes(), &src_dir.join(Path::new("main.nr")));
    println!("Project successfully created! Binary located at {}", package_dir.display());
    Ok(())
}
