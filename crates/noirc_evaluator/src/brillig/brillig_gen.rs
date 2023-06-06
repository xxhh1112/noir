use std::collections::HashMap;

use crate::ssa_refactor::ir::{
    dfg::DataFlowGraph,
    function::Function,
    instruction::{Binary, BinaryOp, Instruction, InstructionId, TerminatorInstruction},
    value::{Value, ValueId},
};

use super::artifact::BrilligArtifact;

use acvm::acir::brillig_vm::{
    BinaryFieldOp, Opcode as BrilligOpcode, RegisterIndex, Value as BrilligValue,
};
#[derive(Default)]
/// Generate the compilation artifacts for compiling a function into brillig bytecode.
pub(crate) struct BrilligGen {
    latest_register: usize,
    obj: BrilligArtifact,

    /// Maps the SSA values to their register indices
    ssa_value_to_registers: HashMap<ValueId, RegisterIndex>,
}

impl BrilligGen {
    /// Adds a brillig instruction to the brillig code base
    fn push_code(&mut self, code: BrilligOpcode) {
        self.obj.byte_code.push(code);
    }

    pub(crate) fn compile(func: &Function) -> BrilligArtifact {
        let mut brillig = BrilligGen::default();

        let entry_block_id = func.entry_block();

        let dfg = &func.dfg;

        let entry_block = &dfg[entry_block_id];

        // Create a register for each parameter encountered
        let parameters = entry_block.parameters();
        for parameter in parameters {
            brillig.get_or_create_register_for_value(*parameter);
        }
        let instruction_ids = entry_block.instructions();
        for instruction_id in instruction_ids {
            brillig.compile_instruction(*instruction_id, dfg);
        }

        // Compile return values
        brillig.convert_ssa_return(entry_block.terminator().unwrap(), dfg);

        brillig.push_code(BrilligOpcode::Stop);
        brillig.obj
    }

    fn convert_ssa_return(&mut self, terminator: &TerminatorInstruction, dfg: &DataFlowGraph) {
        let return_values = match terminator {
            TerminatorInstruction::Return { return_values } => return_values,
            _ => unreachable!("ICE: Program must have a singular return"),
        };

        // Return values are taken from register 0 to N-1
        // Where `N` is the number of return values
        let starting_index = 0usize;

        self.copy_values_into_register(RegisterIndex::from(starting_index), &return_values)
    }

    /// Copies an array of values into a contiguous region of registers
    /// starting from offset `starting_register_index`
    fn copy_values_into_register(
        &mut self,
        starting_register_index: RegisterIndex,
        values: &[ValueId],
    ) {
        // Move return values into the starting registers
        // starting from
        let mut start = starting_register_index;
        for value in values {
            let register_index = self.ssa_value_to_registers[value];
            let opcode = BrilligOpcode::Mov {
                destination: RegisterIndex::from(start),
                source: register_index,
            };
            self.push_code(opcode);
            start = RegisterIndex::from(start.to_usize() + 1);
        }
    }

    fn compile_instruction(&mut self, instruction_id: InstructionId, dfg: &DataFlowGraph) {
        let instruction = &dfg[instruction_id];
        match instruction {
            Instruction::Binary(binary) => {
                let instruction_results = dfg.instruction_results(instruction_id);
                self.compile_binary_instruction(binary, instruction_results, dfg)
            }
            _ => todo!("instruction {instruction:?} has not been implemented "),
        }
    }

    fn compile_binary_instruction(
        &mut self,
        binary: &Binary,
        instruction_results: &[ValueId],
        dfg: &DataFlowGraph,
    ) {
        let lhs = self.compile_ssa_value(binary.lhs, dfg);
        let rhs = self.compile_ssa_value(binary.rhs, dfg);

        match binary.operator {
            BinaryOp::Add => {
                assert_eq!(
                    instruction_results.len(),
                    1,
                    "result of a binary addition should be one value"
                );
                // Create register for output
                let output_register_index =
                    self.get_or_create_register_for_value(instruction_results[0]);

                // Create addition opcode
                let add_opcode = BrilligOpcode::BinaryFieldOp {
                    destination: output_register_index,
                    op: BinaryFieldOp::Add,
                    lhs,
                    rhs,
                };
                self.push_code(add_opcode);
            }
            _ => {
                todo!("binary operator {:?} has not been implemented. {binary:?}", binary.operator)
            }
        }
    }

    fn get_or_create_register_for_value(&mut self, value_id: ValueId) -> RegisterIndex {
        if let Some(register_index) = self.ssa_value_to_registers.get(&value_id) {
            return *register_index;
        }

        let register_index = RegisterIndex::from(self.latest_register);
        self.ssa_value_to_registers.insert(value_id, register_index);

        self.latest_register += 1;

        register_index
    }

    fn compile_ssa_value(&mut self, value_id: ValueId, dfg: &DataFlowGraph) -> RegisterIndex {
        let value = &dfg[value_id];

        match value {
            Value::Param { .. } => {
                // All block parameters should have already been converted to registers
                // so we fetch from the cache.
                self.ssa_value_to_registers[&value_id]
            }
            Value::NumericConstant { constant, .. } => {
                // Create a new register to store the constant
                //
                let register_index = self.get_or_create_register_for_value(value_id);

                // Store the constant at that register and push the opcode
                // into the bytecode
                let const_opcode = BrilligOpcode::Const {
                    destination: register_index,
                    value: BrilligValue::from(*constant),
                };
                self.push_code(const_opcode);

                register_index
            }
            _ => todo!("value:?"),
        }
    }
}
