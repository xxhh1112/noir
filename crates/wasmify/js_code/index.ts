import { read_file_js, add, compile_single_file, compute_witnesses, compile_single_file_serialised_circuit } from '../pkg/wasmify'
import { DSLProver, getCircuitSize } from './dsl_prover';
import { WorkerPool } from '../barretenberg.js/dest/wasm';
import { PooledPippenger } from '../barretenberg.js/dest/pippenger';
const fs = require('fs');

import { BarretenbergWasm } from '../barretenberg.js/dest/wasm'
import { Crs } from '../barretenberg.js/dest/crs';
import { SingleFft } from '../barretenberg.js/dest/fft';
import { Prover } from '../barretenberg.js/dest/client_proofs/prover'
import { DSLVerifier } from './dsl_verifier';
// import { Sha256 } from '../barretenberg.js/dest/crypto/sha256'
import { enableLogs } from '../barretenberg.js/dest/log';

async function main() {
    const barretenberg = await BarretenbergWasm.new();

    // Compile Noir program
    let compiled_program = compile_single_file("../1/src/main.nr");
    let serialised_circuit = compile_single_file_serialised_circuit("../1/src/main.nr");

    // Get circuit size
    let circuit_size = await getCircuitSize(barretenberg, serialised_circuit);
    console.log(circuit_size);

    // Download CRS
    let crs = new Crs(circuit_size);
    await crs.download();

    // let hash_func = new Sha256(barretenberg);

    // Setup code for plonk prover
    let pool = new WorkerPool();
    await pool.init(barretenberg.module, 1);

    let pippenger = new PooledPippenger(pool);
    await pippenger.init(crs.getData());

    let fft = new SingleFft(pool.workers[0]);
    await fft.init(circuit_size);

    const plonk_prover = new Prover(pool.workers[0], pippenger, fft);

    let prover = new DSLProver(barretenberg, plonk_prover, serialised_circuit);
    prover.initCircuitDefinition();
    let verifier = new DSLVerifier();

    // Compute the prover and verifier keys
    await prover.computeKey();
    await verifier.computeKey(pippenger.pool[0], crs.getG2Data());

    // Fill in the initial witnesses according to the ABI
    var initial_witness = new Uint32Array([1]);

    // We now need to instantiate the partial witness generator which will return
    // computed witnesses
    let witnesses = compute_witnesses(compiled_program.circuit, initial_witness);
    console.log(witnesses);

    // let proof = await prover.createProof2(pippenger.pool[0], crs, serialised_circuit, witnesses);

    // Compute the proof
    let proof = await prover.createProof(witnesses);
    console.log(proof.toString('hex'));

    // Verify the proof
    // let hex_str = "0d197f01eae88863cbfdb74eaac5fe9a0082ed98b6a1e9dbd0c16eea171227cc19c92dd2571c84b0da80cb673fc4a962e2eb78980757fdfbac7900ed17d84f3e1f664636d1e2637ca195b4cdfbbdb1be522a43c54134a15660d33b37fee327a41b8711a27352829ee14269e8aec45d5b2cbb57d18623397312ec7381c64ff5fa246536d81d3ed3fac4f22da5a3cce2d09c3a8e8a06aa13bb8ec74c3d7763fa050ecd92fb1cc93b0d68f0a7412e83abc0d065da0a69568e1335b6fa1e2f4190f02461f128ac55dcdc414e82517f1f4d88d80b6163f71b2167aabb52711b4035c611872d90bf9d8534d044f3d4b3b7a1130e83ab52c5c343d1b56d5c5ec4c082ae16a3c8b1dfe6fe73014ec81c9d910410cd9fa0dc703097b5484b31ac181f4160107126b716bf04c9da4b22976d1460af3d0900502ff8bfba202ae74d91d23f291b886320305915756a6db830f0fd8aac43712169cd7f5dd6b1817b743729bf132301791cd39702623021e9826ca42d68045469db523266e6a00775709ac94a280eef5a7af5514b4a1180e92b5fbcba5469069cee456a6619c111d7caa676403612626c10d18eb7b8e3ed27e3884e3f571e5e2cc99a5b32333f5e2063c57a7cb21f2d13492eeaf6294da89545217eb247827f424e0f511d3f1aeb4cd13bb707d72f44348e9b846e811f856adf26a4e17ff3687af41020f1d98a71de705271197d11f7b0e18e2d0c2395ead18e790fc546525a54fb2daa8228f574edfdbef1ef0519ef240c66c6d9d9a915c0f556c0940f485dbd9086e93fed769bd207024faffd149a676bd049b81201a29333e34a5ffcb809149b0f5403544e7d3f826253b5fe2d0b5ce46885f94493a26fb68ae9af662e03f986ea7e113e4ded379c29fec0bb056ad4b68c4c95066ec910c794e815e243a29fd53f0460d6b0ffca25baba8a0909accc10514651ace5169efc557d71aed717d3a7503115e62fa5b6f1cc3e17e815676d51d04eb7082a81c3a5e7c7e00414f62a03dddd077968685b1b69ad52d407c58640fe9c995d3f6286ad967eb2d0988c9638a46fd4819d07289963e46639166ec26aed15b020ac1e714add348eb8f333c9d181b1f90598a85f8ed17fadfa1d98a78c1c876f9596cf6fcf798dc2f5e52978e8c1641ae5c5deaa28eea75be21382d17f34f17a0e3640f27b4e9fc341168504dfba67672b465e2f32e47e51e501036c89f312eeefa945964f3e6bb7b6711a73b8d79934587d77c078156edce71f7d9113e0cc8cf66ff01ce8d28f4d65c9df788535cbea140975db5cb5da0aa12338a252022bab31e92c54eaff9a20d19070e5177ea1dda93b6a7b774025265f15c2253beeaad93652ee6da3ce79899bf73d6191163ebf638dda9b62e8d473d8132778333b85a350c5b8fe7ad218d4e5002ee367ee5f93e43d4f7dd07a1fb04c1d9ed3c90f0bd6c790d75e0c19c5bce4a2b00dc06ac2e40de88f763e94c4828418c56184c763bb3af610546de86e6f93175247a03068c7df2bc5fccb23a8bb8a03f17822f8a86361424c19ac72aa05a244a4be1caf670976a6d2b7c9bc7837652a39246a7c9cc2967617c2f425869dbfd8bf92e23aeb2963413014a564b3aa0f0f763d19c073978fff18485ff193a01f83eb3b9a07dadf08b2c175dad56bacc10eb2eefe152cafaffb368c49cca6f4117cdca76bc357c0d043a76dfea8efb6e1";
    // let proof2 = Buffer.from(hex_str, "hex");
    let is_ok = await verifier.verifyProof(proof);

    // Compute the hash of verifier key
    // console.log(`vk hash: ${hash_func.hash(await verifier.getKey()).toString('hex')}`)

    console.log("proof verified: ", is_ok);

}

main().catch(console.log);
