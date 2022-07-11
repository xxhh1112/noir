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
exports.getCircuitSize = exports.DSLProver = void 0;
var DSLProver = /** @class */ (function () {
    function DSLProver(wasm, prover, constraint_system) {
        this.wasm = wasm;
        this.prover = prover;
        this.constraint_system = constraint_system;
    }
    // We do not pass in a constraint_system to this method
    // so that users cannot call it twice and possibly be
    // in a state where they have a different circuit definition to
    // the proving key
    // 
    //Ideally, we want this to be called in the constructor and not be manually called by users. Possibly create a .new method
    DSLProver.prototype.initCircuitDefinition = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DSLProver.prototype.computeKey = function () {
        return __awaiter(this, void 0, void 0, function () {
            var worker;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        worker = this.prover.getWorker();
                        // await worker.call('composer__compute_proving_key');
                        return [4 /*yield*/, worker.call('standard_example__init_proving_key')];
                    case 1:
                        // await worker.call('composer__compute_proving_key');
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DSLProver.prototype.createProof = function (partial_witness) {
        return __awaiter(this, void 0, void 0, function () {
            var worker, proverPtr, proof;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        worker = this.prover.getWorker();
                        return [4 /*yield*/, worker.call('standard_example__new_prover')];
                    case 1:
                        proverPtr = _a.sent();
                        return [4 /*yield*/, this.prover.createProof(proverPtr)];
                    case 2:
                        proof = _a.sent();
                        return [2 /*return*/, proof];
                }
            });
        });
    };
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
    DSLProver.prototype.getCircuitSize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getCircuitSize(this.wasm, this.constraint_system)];
            });
        });
    };
    DSLProver.prototype.getProver = function () {
        return this.prover;
    };
    return DSLProver;
}());
exports.DSLProver = DSLProver;
// If we initialise the FFT module with a number that is too big, we get a bus error
// So we use this method to first get the circuit size, and then use that number to init the fft module
function getCircuitSize(wasm, constraint_system) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, 256];
        });
    });
}
exports.getCircuitSize = getCircuitSize;
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
