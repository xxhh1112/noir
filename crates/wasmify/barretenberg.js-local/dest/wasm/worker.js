"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable require-await */
const observable_1 = require("threads/observable");
const worker_1 = require("threads/worker");
const _1 = require(".");
let wasm;
const subject = new observable_1.Subject();
const worker = {
    async init(module, initial) {
        wasm = new _1.BarretenbergWasm();
        wasm.on("log", (str) => subject.next(str));
        await wasm.init(module, initial);
    },
    async transferToHeap(buffer, offset) {
        wasm.transferToHeap(buffer, offset);
    },
    async sliceMemory(start, end) {
        const mem = wasm.sliceMemory(start, end);
        return (0, worker_1.Transfer)(mem, [mem.buffer]);
    },
    async call(name, ...args) {
        return wasm.call(name, ...args);
    },
    async memSize() {
        return wasm.memSize();
    },
    logs() {
        return observable_1.Observable.from(subject);
    },
    /**
     * When calling the wasm, sometimes a caller will require exclusive access over a series of calls.
     * e.g. When a result is written to address 0, one cannot have another caller writing to the same address via
     * transferToHeap before the result is read via sliceMemory.
     * acquire() gets a single token from a fifo. The caller must call release() to add the token back.
     */
    async acquire() {
        await wasm.acquire();
    },
    async release() {
        wasm.release();
    },
};
(0, worker_1.expose)(worker);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3dhc20vd29ya2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsa0NBQWtDO0FBQ2xDLG1EQUF5RDtBQUN6RCwyQ0FBa0Q7QUFDbEQsd0JBQXFDO0FBRXJDLElBQUksSUFBc0IsQ0FBQztBQUMzQixNQUFNLE9BQU8sR0FBRyxJQUFJLG9CQUFPLEVBQUUsQ0FBQztBQUU5QixNQUFNLE1BQU0sR0FBRztJQUNiLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBMkIsRUFBRSxPQUFnQjtRQUN0RCxJQUFJLEdBQUcsSUFBSSxtQkFBZ0IsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDM0MsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFrQixFQUFFLE1BQWM7UUFDckQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBYSxFQUFFLEdBQVc7UUFDMUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsT0FBTyxJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFzQixDQUFDO0lBQzFELENBQUM7SUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQVksRUFBRSxHQUFHLElBQVM7UUFDbkMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTztRQUNYLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFRCxJQUFJO1FBQ0YsT0FBTyx1QkFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTztRQUNYLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNqQixDQUFDO0NBQ0YsQ0FBQztBQUlGLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDIn0=