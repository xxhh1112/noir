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
exports.DSLVerifier = void 0;
var DSLVerifier = /** @class */ (function () {
    function DSLVerifier() {
    }
    DSLVerifier.prototype.computeKey = function (pippenger, g2Data) {
        return __awaiter(this, void 0, void 0, function () {
            var g2Ptr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.worker = pippenger.getWorker();
                        return [4 /*yield*/, this.worker.call('bbmalloc', g2Data.length)];
                    case 1:
                        g2Ptr = _a.sent();
                        // await this.worker.transferToHeap(g2Data, 0);
                        return [4 /*yield*/, this.worker.call('standard_example__init_verification_key', pippenger.getPointer(), g2Ptr)];
                    case 2:
                        // await this.worker.transferToHeap(g2Data, 0);
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // public async getKey() {
    //     const keySize = await this.worker.call('composer__get_new_verification_key_data', 0);
    //     const keyPtr = Buffer.from(await this.worker.sliceMemory(0, 4)).readUInt32LE(0);
    //     const buf = Buffer.from(await this.worker.sliceMemory(keyPtr, keyPtr + keySize));
    //     await this.worker.call('bbfree', keyPtr);
    //     return buf;
    // }
    // public async loadKey(worker: BarretenbergWorker, keyBuf: Buffer, g2Data: Uint8Array) {
    //     this.worker = worker;
    //     const keyPtr = await this.worker.call('bbmalloc', keyBuf.length);
    //     await this.worker.transferToHeap(g2Data, 0);
    //     await this.worker.transferToHeap(keyBuf, keyPtr);
    //     await this.worker.call('composer__init_verification_key_from_buffer', keyPtr, 0);
    //     await this.worker.call('bbfree', keyPtr);
    // }
    DSLVerifier.prototype.verifyProof = function (proof) {
        return __awaiter(this, void 0, void 0, function () {
            var proofPtr, verified;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.worker.call('bbmalloc', proof.length)];
                    case 1:
                        proofPtr = _a.sent();
                        return [4 /*yield*/, this.worker.transferToHeap(proof, proofPtr)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.worker.call('standard_example__verify_proof', proofPtr, proof.length)];
                    case 3:
                        verified = (_a.sent()) ? true : false;
                        return [4 /*yield*/, this.worker.call('bbfree', proofPtr)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, verified];
                }
            });
        });
    };
    return DSLVerifier;
}());
exports.DSLVerifier = DSLVerifier;
