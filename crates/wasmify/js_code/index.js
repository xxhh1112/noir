"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var wasmify_1 = require("../pkg/wasmify");
var dsl_prover_1 = require("./dsl_prover");
var wasm_1 = require("../barretenberg.js/dest/wasm");
var pippenger_1 = require("../barretenberg.js/dest/pippenger");
var fs = require('fs');
var wasm_2 = require("../barretenberg.js/dest/wasm");
var crs_1 = require("../barretenberg.js/dest/crs");
var fft_1 = require("../barretenberg.js/dest/fft");
var prover_1 = require("../barretenberg.js/dest/client_proofs/prover");
var dsl_verifier_1 = require("./dsl_verifier");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var barretenberg, compiled_program, serialised_circuit, circuit_size, crs, pool, pippenger, fft, plonk_prover, prover, verifier, initial_witness, witnesses, proof, is_ok;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, wasm_2.BarretenbergWasm["new"]()];
                case 1:
                    barretenberg = _a.sent();
                    compiled_program = (0, wasmify_1.compile_single_file)("../1/src/main.nr");
                    serialised_circuit = (0, wasmify_1.compile_single_file_serialised_circuit)("../1/src/main.nr");
                    return [4 /*yield*/, (0, dsl_prover_1.getCircuitSize)(barretenberg, serialised_circuit)];
                case 2:
                    circuit_size = _a.sent();
                    console.log(circuit_size);
                    crs = new crs_1.Crs(circuit_size);
                    return [4 /*yield*/, crs.download()];
                case 3:
                    _a.sent();
                    pool = new wasm_1.WorkerPool();
                    return [4 /*yield*/, pool.init(barretenberg.module, 1)];
                case 4:
                    _a.sent();
                    pippenger = new pippenger_1.PooledPippenger(pool);
                    return [4 /*yield*/, pippenger.init(crs.getData())];
                case 5:
                    _a.sent();
                    fft = new fft_1.SingleFft(pool.workers[0]);
                    return [4 /*yield*/, fft.init(circuit_size)];
                case 6:
                    _a.sent();
                    plonk_prover = new prover_1.Prover(pool.workers[0], pippenger, fft);
                    prover = new dsl_prover_1.DSLProver(barretenberg, plonk_prover, serialised_circuit);
                    prover.initCircuitDefinition();
                    verifier = new dsl_verifier_1.DSLVerifier();
                    // Compute the prover and verifier keys
                    return [4 /*yield*/, prover.computeKey()];
                case 7:
                    // Compute the prover and verifier keys
                    _a.sent();
                    return [4 /*yield*/, verifier.computeKey(pippenger.pool[0], crs.getG2Data())];
                case 8:
                    _a.sent();
                    initial_witness = new Uint32Array([1]);
                    witnesses = (0, wasmify_1.compute_witnesses)(compiled_program.circuit, initial_witness);
                    console.log(witnesses);
                    return [4 /*yield*/, prover.createProof(witnesses)];
                case 9:
                    proof = _a.sent();
                    console.log(proof.toString('hex'));
                    return [4 /*yield*/, verifier.verifyProof(proof)];
                case 10:
                    is_ok = _a.sent();
                    // Compute the hash of verifier key
                    // console.log(`vk hash: ${hash_func.hash(await verifier.getKey()).toString('hex')}`)
                    console.log("proof verified: ", is_ok);
                    return [2 /*return*/];
            }
        });
    });
}
main()["catch"](console.log);
