"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PooledNoteDecryptor = void 0;
const viewing_key_1 = require("../../viewing_key");
const single_note_decryptor_1 = require("./single_note_decryptor");
class PooledNoteDecryptor {
    constructor(workerPool) {
        this.pool = [];
        this.pool = workerPool.workers.map((w) => new single_note_decryptor_1.SingleNoteDecryptor(w));
    }
    async batchDecryptNotes(keysBuf, privateKey) {
        const numKeys = keysBuf.length / viewing_key_1.ViewingKey.SIZE;
        const numKeysPerBatch = Math.max(1, Math.floor(numKeys / this.pool.length));
        const numBatches = Math.min(Math.ceil(numKeys / numKeysPerBatch), this.pool.length);
        const remainingKeys = numKeys - numKeysPerBatch * numBatches;
        let dataStart = 0;
        const batches = [...Array(numBatches)].map((_, i) => {
            const dataEnd = dataStart + (numKeysPerBatch + +(i < remainingKeys)) * viewing_key_1.ViewingKey.SIZE;
            const keys = keysBuf.slice(dataStart, dataEnd);
            dataStart = dataEnd;
            return keys;
        });
        const results = await Promise.all(batches.map((batch, i) => this.pool[i].batchDecryptNotes(batch, privateKey)));
        return Buffer.concat(results);
    }
}
exports.PooledNoteDecryptor = PooledNoteDecryptor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbGVkX25vdGVfZGVjcnlwdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL25vdGVfYWxnb3JpdGhtcy9ub3RlX2RlY3J5cHRvci9wb29sZWRfbm90ZV9kZWNyeXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQStDO0FBRy9DLG1FQUE4RDtBQUU5RCxNQUFhLG1CQUFtQjtJQUc5QixZQUFZLFVBQXNCO1FBRjFCLFNBQUksR0FBMEIsRUFBRSxDQUFDO1FBR3ZDLElBQUksQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksMkNBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRU0sS0FBSyxDQUFDLGlCQUFpQixDQUFDLE9BQWUsRUFBRSxVQUFrQjtRQUNoRSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLHdCQUFVLENBQUMsSUFBSSxDQUFDO1FBQ2pELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM1RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMsRUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQ2pCLENBQUM7UUFDRixNQUFNLGFBQWEsR0FBRyxPQUFPLEdBQUcsZUFBZSxHQUFHLFVBQVUsQ0FBQztRQUM3RCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbEIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNsRCxNQUFNLE9BQU8sR0FDWCxTQUFTLEdBQUcsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxHQUFHLHdCQUFVLENBQUMsSUFBSSxDQUFDO1lBQ3pFLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQy9DLFNBQVMsR0FBRyxPQUFPLENBQUM7WUFDcEIsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FDbEQsQ0FDRixDQUFDO1FBQ0YsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hDLENBQUM7Q0FDRjtBQTlCRCxrREE4QkMifQ==