use acvm::{PartialWitnessGenerator, SmartContract};

cfg_if::cfg_if! {
    if #[cfg(feature = "plonk_bn254")] {

        pub use aztec_backend::Plonk as ConcreteBackend;

    } else if #[cfg(feature = "marlin")] {
        // R1CS_MARLIN_ARKWORKS
        compile_error!("marlin backend has not been configured yet");

    } else if #[cfg(feature = "dummy_backend")] {
        // Dummy backend so we can compile WASM
        // TODO: is there a better way to do this? maybe we can conditionally compile the functions that need the ConcreteBackend
        pub use DummyBackend as ConcreteBackend;

    } else {
        compile_error!("please specify a backend to compile with");
    }
}
// XXX: This works  because there are only two features, we want to say only one of these can be enabled. (feature xor)
// #[cfg(all(feature = "plonk", feature = "marlin"))]
// compile_error!("feature \"plonk\"  and feature \"marlin\" cannot be enabled at the same time");

pub struct DummyBackend;

impl acvm::Backend for DummyBackend {}

impl acvm::PartialWitnessGenerator for DummyBackend {
    fn solve(
        &self,
        initial_witness: &mut std::collections::BTreeMap<
            acvm::acir::native_types::Witness,
            acvm::FieldElement,
        >,
        gates: Vec<acvm::acir::circuit::Gate>,
    ) -> Result<(), acvm::acir::OPCODE> {
        todo!()
    }
}

impl acvm::ProofSystemCompiler for DummyBackend {
    fn np_language(&self) -> acvm::Language {
        acvm::Language::PLONKCSat { width: 3 }
    }

    fn prove_with_meta(
        &self,
        circuit: acvm::acir::circuit::Circuit,
        witness_values: std::collections::BTreeMap<
            acvm::acir::native_types::Witness,
            acvm::FieldElement,
        >,
    ) -> Vec<u8> {
        todo!()
    }

    fn verify_from_cs(
        &self,
        proof: &[u8],
        public_input: Vec<acvm::FieldElement>,
        circuit: acvm::acir::circuit::Circuit,
    ) -> bool {
        todo!()
    }
}

impl acvm::SmartContract for DummyBackend {
    fn eth_contract_from_cs(&self, circuit: acvm::acir::circuit::Circuit) -> String {
        todo!()
    }
}
