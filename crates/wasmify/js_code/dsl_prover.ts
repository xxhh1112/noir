import { Prover } from '../barretenberg.js/dest/client_proofs'
import { Crs } from '../barretenberg.js/dest/crs';
import { SinglePippenger } from '../barretenberg.js/dest/pippenger';
import { BarretenbergWasm, BarretenbergWorker, WorkerPool } from '../barretenberg.js/dest/wasm';

export class DSLProver {

    constructor(private wasm: BarretenbergWasm, private prover: Prover, private constraint_system: Uint8Array) { }

    // We do not pass in a constraint_system to this method
    // so that users cannot call it twice and possibly be
    // in a state where they have a different circuit definition to
    // the proving key
    // 
    //Ideally, we want this to be called in the constructor and not be manually called by users. Possibly create a .new method
    public async initCircuitDefinition() {
        // let worker = this.prover.getWorker();
        // const constraint_system_ptr = await worker.call('bbmalloc', this.constraint_system.length);
        // await worker.transferToHeap(this.constraint_system, constraint_system_ptr);

        // await worker.call('composer__init_circuit_def', constraint_system_ptr);
    }

    public async computeKey() {
        const worker = this.prover.getWorker();
        // await worker.call('composer__compute_proving_key');
        await worker.call('standard_example__init_proving_key');
    }

    public async createProof(partial_witness: Uint8Array) {

        const worker = this.prover.getWorker();

        // allocate partial witness
        // const witness_ptr = await worker.call('bbmalloc', partial_witness.length);

        // await worker.transferToHeap(partial_witness, witness_ptr);

        // Create a new prover based on the constraint system, that also has the witnesses computed
        // const proverPtr = await worker.call('standard_example__new_prover', witness_ptr);
        const proverPtr = await worker.call('standard_example__new_prover');
        // await worker.call('bbfree', witness_ptr);
        const proof = await this.prover.createProof(proverPtr);

        return proof;
    }
    // public async createProof2(pippenger: SinglePippenger, crs: Crs, constraint_system: Uint8Array, partial_witness: Uint8Array) {

    //     const worker = this.prover.getWorker();

    //     // allocate partial witness
    //     const witness_ptr = await worker.call('bbmalloc', partial_witness.length);
    //     await worker.transferToHeap(partial_witness, witness_ptr);
    //     const g2_ptr = await worker.call('bbmalloc', crs.getG2Data().length);
    //     await worker.transferToHeap(crs.getG2Data(), g2_ptr);
    //     const constraint_system_ptr = await worker.call('bbmalloc', constraint_system.length);
    //     await worker.transferToHeap(constraint_system, constraint_system_ptr);


    //     // Create a new prover based on the constraint system, that also has the witnesses computed
    //     const proofSize = await worker.call('composer__new_proof_js', pippenger.getPointer(), g2_ptr, constraint_system_ptr, witness_ptr, 0);
    //     const proofPtr = Buffer.from(await this.wasm.sliceMemory(0, 4)).readUInt32LE(0);
    //     return Buffer.from(await this.wasm.sliceMemory(proofPtr, proofPtr + proofSize));

    // }

    // public async getKey() {
    //     const worker = this.prover.getWorker();
    //     await worker.acquire();
    //     try {
    //         const keySize = await worker.call('composer__get_new_proving_key_data', 0);
    //         const keyPtr = Buffer.from(await worker.sliceMemory(0, 4)).readUInt32LE(0);
    //         const buf = Buffer.from(await worker.sliceMemory(keyPtr, keyPtr + keySize));
    //         await worker.call('bbfree', keyPtr);
    //         return buf;
    //     } finally {
    //         await worker.release();
    //     }
    // }

    public async getCircuitSize() {
        return getCircuitSize(this.wasm, this.constraint_system)
    }

    public getProver() {
        return this.prover;
    }
}

// If we initialise the FFT module with a number that is too big, we get a bus error
// So we use this method to first get the circuit size, and then use that number to init the fft module
export async function getCircuitSize(wasm: BarretenbergWasm, constraint_system: Uint8Array) {
    return 256
}
// export async function getCircuitSize(wasm: BarretenbergWasm, constraint_system: Uint8Array) {
//     let pool = new WorkerPool();
//     await pool.init(wasm.module, 8);
//     let worker = pool.workers[0];

//     const buf = Buffer.from(constraint_system);
//     const mem = await worker.call('bbmalloc', buf.length);
//     await worker.transferToHeap(buf, mem);

//     const circSize = await worker.call('composer__get_circuit_size', mem);

//     return circSize
// }