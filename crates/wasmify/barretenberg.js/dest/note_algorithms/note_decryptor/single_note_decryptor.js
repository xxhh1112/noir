"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingleNoteDecryptor = void 0;
const viewing_key_1 = require("../../viewing_key");
class SingleNoteDecryptor {
    constructor(worker) {
        this.worker = worker;
    }
    async batchDecryptNotes(keysBuf, privateKey) {
        const decryptedNoteLength = 73;
        const numKeys = keysBuf.length / viewing_key_1.ViewingKey.SIZE;
        const mem = await this.worker.call("bbmalloc", keysBuf.length + privateKey.length);
        await this.worker.transferToHeap(keysBuf, mem);
        await this.worker.transferToHeap(privateKey, mem + keysBuf.length);
        await this.worker.call("notes__batch_decrypt_notes", mem, mem + keysBuf.length, numKeys, mem);
        const dataBuf = Buffer.from(await this.worker.sliceMemory(mem, mem + numKeys * decryptedNoteLength));
        await this.worker.call("bbfree", mem);
        return dataBuf;
    }
}
exports.SingleNoteDecryptor = SingleNoteDecryptor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2luZ2xlX25vdGVfZGVjcnlwdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL25vdGVfYWxnb3JpdGhtcy9ub3RlX2RlY3J5cHRvci9zaW5nbGVfbm90ZV9kZWNyeXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQStDO0FBSS9DLE1BQWEsbUJBQW1CO0lBQzlCLFlBQW9CLE1BQTZDO1FBQTdDLFdBQU0sR0FBTixNQUFNLENBQXVDO0lBQUcsQ0FBQztJQUU5RCxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBZSxFQUFFLFVBQWtCO1FBQ2hFLE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1FBQy9CLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsd0JBQVUsQ0FBQyxJQUFJLENBQUM7UUFFakQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDaEMsVUFBVSxFQUNWLE9BQU8sQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FDbkMsQ0FBQztRQUNGLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9DLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLEdBQUcsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbkUsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDcEIsNEJBQTRCLEVBQzVCLEdBQUcsRUFDSCxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFDcEIsT0FBTyxFQUNQLEdBQUcsQ0FDSixDQUFDO1FBQ0YsTUFBTSxPQUFPLEdBQVcsTUFBTSxDQUFDLElBQUksQ0FDakMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQyxDQUN4RSxDQUFDO1FBQ0YsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdEMsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBM0JELGtEQTJCQyJ9