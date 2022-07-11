"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PooledPedersen = void 0;
const single_pedersen_1 = require("./single_pedersen");
// import createDebug from 'debug';
// const debug = createDebug('bb:pooled_pedersen');
/**
 * Multi-threaded implementation of pedersen.
 */
class PooledPedersen extends single_pedersen_1.SinglePedersen {
    /**
     * @param wasm Synchronous functions will use use this wasm directly on the calling thread.
     * @param pool Asynchronous functions use this pool of workers to multi-thread processing.
     */
    constructor(wasm, pool) {
        super(wasm);
        this.pool = [];
        this.pool = pool.workers.map((w) => new single_pedersen_1.SinglePedersen(wasm, w));
    }
    async init() {
        await Promise.all(this.pool.map((p) => p.init()));
    }
    async hashToTree(values) {
        const isPowerOf2 = (v) => v && !(v & (v - 1));
        if (!isPowerOf2(values.length)) {
            throw new Error("PooledPedersen::hashValuesToTree can only handle powers of 2.");
        }
        const numWorkers = Math.min(values.length / 2, this.pool.length);
        const workers = this.pool.slice(0, Math.max(numWorkers, 1));
        const numPerThread = values.length / workers.length;
        const results = await Promise.all(workers.map((pedersen, i) => pedersen.hashToTree(values.slice(i * numPerThread, (i + 1) * numPerThread))));
        const sliced = results.map((hashes) => {
            const treeHashes = [];
            for (let i = numPerThread, j = 0; i >= 1; j += i, i /= 2) {
                treeHashes.push(hashes.slice(j, j + i));
            }
            return treeHashes;
        });
        const flattened = sliced[0];
        for (let i = 1; i < sliced.length; ++i) {
            for (let j = 0; j < sliced[i].length; ++j) {
                flattened[j] = [...flattened[j], ...sliced[i][j]];
            }
        }
        while (flattened[flattened.length - 1].length > 1) {
            const lastRow = flattened[flattened.length - 1];
            const newRow = [];
            for (let i = 0; i < lastRow.length; i += 2) {
                newRow[i / 2] = this.pool[0].compress(lastRow[i], lastRow[i + 1]);
            }
            flattened.push(newRow);
        }
        return flattened.flat();
    }
}
exports.PooledPedersen = PooledPedersen;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbGVkX3BlZGVyc2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NyeXB0by9wZWRlcnNlbi9wb29sZWRfcGVkZXJzZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsdURBQW1EO0FBQ25ELG1DQUFtQztBQUVuQyxtREFBbUQ7QUFFbkQ7O0dBRUc7QUFDSCxNQUFhLGNBQWUsU0FBUSxnQ0FBYztJQUdoRDs7O09BR0c7SUFDSCxZQUFZLElBQXNCLEVBQUUsSUFBZ0I7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBUFAsU0FBSSxHQUFxQixFQUFFLENBQUM7UUFRakMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxnQ0FBYyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFTSxLQUFLLENBQUMsSUFBSTtRQUNmLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0sS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFnQjtRQUN0QyxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUM5QixNQUFNLElBQUksS0FBSyxDQUNiLCtEQUErRCxDQUNoRSxDQUFDO1NBQ0g7UUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxN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