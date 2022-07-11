"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountProver = void 0;
const threads_1 = require("threads");
class AccountProver {
    constructor(prover, mock = false) {
        this.prover = prover;
        this.mock = mock;
    }
    static getCircuitSize(proverless = false) {
        return proverless ? 512 : 32 * 1024;
    }
    async computeKey() {
        const worker = this.prover.getWorker();
        await worker.call("account__init_proving_key", this.mock);
    }
    async loadKey(keyBuf) {
        const worker = this.prover.getWorker();
        const keyPtr = await worker.call("bbmalloc", keyBuf.length);
        await worker.transferToHeap((0, threads_1.Transfer)(keyBuf, [keyBuf.buffer]), keyPtr);
        await worker.call("account__init_proving_key_from_buffer", keyPtr);
        await worker.call("bbfree", keyPtr);
    }
    async getKey() {
        const worker = this.prover.getWorker();
        await worker.acquire();
        try {
            const keySize = await worker.call("account__get_new_proving_key_data", 0);
            const keyPtr = Buffer.from(await worker.sliceMemory(0, 4)).readUInt32LE(0);
            const buf = Buffer.from(await worker.sliceMemory(keyPtr, keyPtr + keySize));
            await worker.call("bbfree", keyPtr);
            return buf;
        }
        finally {
            await worker.release();
        }
    }
    async computeSigningData(tx) {
        const worker = this.prover.getWorker();
        await worker.transferToHeap(tx.toBuffer(), 0);
        await worker.call("account__compute_signing_data", 0, 0);
        return Buffer.from(await worker.sliceMemory(0, 32));
    }
    async createAccountProof(tx, signature) {
        const worker = this.prover.getWorker();
        const buf = Buffer.concat([tx.toBuffer(), signature.toBuffer()]);
        const mem = await worker.call("bbmalloc", buf.length);
        await worker.transferToHeap(buf, mem);
        const proverPtr = await worker.call("account__new_prover", mem, this.mock);
        await worker.call("bbfree", mem);
        const proof = await this.prover.createProof(proverPtr);
        await worker.call("account__delete_prover", proverPtr);
        return proof;
    }
    getProver() {
        return this.prover;
    }
}
exports.AccountProver = AccountProver;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudF9wcm92ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50X3Byb29mcy9hY2NvdW50X3Byb29mL2FjY291bnRfcHJvdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFtQztBQUtuQyxNQUFhLGFBQWE7SUFDeEIsWUFBb0IsTUFBc0IsRUFBa0IsT0FBTyxLQUFLO1FBQXBELFdBQU0sR0FBTixNQUFNLENBQWdCO1FBQWtCLFNBQUksR0FBSixJQUFJLENBQVE7SUFBRyxDQUFDO0lBRTVFLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxHQUFHLEtBQUs7UUFDdEMsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztJQUN0QyxDQUFDO0lBRU0sS0FBSyxDQUFDLFVBQVU7UUFDckIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN2QyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFTSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQWM7UUFDakMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN2QyxNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1RCxNQUFNLE1BQU0sQ0FBQyxjQUFjLENBQ3pCLElBQUEsa0JBQVEsRUFBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQVEsRUFDeEMsTUFBTSxDQUNQLENBQUM7UUFDRixNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsdUNBQXVDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbkUsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU0sS0FBSyxDQUFDLE1BQU07UUFDakIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN2QyxNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixJQUFJO1lBQ0YsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FDckUsQ0FBQyxDQUNGLENBQUM7WUFDRixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUNyQixNQUFNLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxPQUFPLENBQUMsQ0FDbkQsQ0FBQztZQUNGLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDcEMsT0FBTyxHQUFHLENBQUM7U0FDWjtnQkFBUztZQUNSLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3hCO0lBQ0gsQ0FBQztJQUVNLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFhO1FBQzNDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDdkMsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5QyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pELE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVNLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFhLEVBQUUsU0FBMkI7UUFDeEUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakUsTUFBTSxHQUFHLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEQsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN0QyxNQUFNLFNBQVMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzRSxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdkQsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVNLFNBQVM7UUFDZCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDckIsQ0FBQztDQUNGO0FBL0RELHNDQStEQyJ9