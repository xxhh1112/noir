"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarretenbergWasm = exports.fetchCode = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const detect_node_1 = (0, tslib_1.__importDefault)(require("detect-node"));
const util_1 = require("util");
const events_1 = require("events");
const log_1 = require("../log");
const crypto_1 = require("../crypto");
const fifo_1 = require("../fifo");
events_1.EventEmitter.defaultMaxListeners = 30;
async function fetchCode() {
    if (detect_node_1.default) {
        return await (0, util_1.promisify)(fs_1.readFile)(__dirname + "/barretenberg.wasm");
    }
    else {
        const res = await fetch("/barretenberg.wasm");
        return Buffer.from(await res.arrayBuffer());
    }
}
exports.fetchCode = fetchCode;
class BarretenbergWasm extends events_1.EventEmitter {
    constructor() {
        super();
        this.mutexQ = new fifo_1.MemoryFifo();
        this.mutexQ.put(true);
    }
    static async new(name = "wasm", initial) {
        const barretenberg = new BarretenbergWasm();
        barretenberg.on("log", (0, log_1.createDebugLogger)(`bb:${name}`));
        await barretenberg.init(undefined, initial);
        return barretenberg;
    }
    async init(module, initial = 256) {
        this.emit("log", `intial mem: ${initial}`);
        this.memory = new WebAssembly.Memory({ initial, maximum: 65536 });
        this.heap = new Uint8Array(this.memory.buffer);
        const importObj = {
            /* eslint-disable camelcase */
            wasi_snapshot_preview1: {
                environ_get: () => { },
                environ_sizes_get: () => { },
                fd_close: () => { },
                fd_read: () => { },
                fd_write: () => { },
                fd_seek: () => { },
                fd_fdstat_get: () => { },
                fd_fdstat_set_flags: () => { },
                path_open: () => { },
                path_filestat_get: () => { },
                proc_exit: () => { },
                random_get: (arr, length) => {
                    arr = arr >>> 0;
                    const heap = new Uint8Array(this.memory.buffer);
                    const randomData = (0, crypto_1.randomBytes)(length);
                    for (let i = arr; i < arr + length; ++i) {
                        heap[i] = randomData[i - arr];
                    }
                },
            },
            /* eslint-enable camelcase */
            module: {},
            env: {
                logstr: (addr) => {
                    addr = addr >>> 0;
                    const m = this.getMemory();
                    let i = addr;
                    for (; m[i] !== 0; ++i)
                        ;
                    // eslint-disable-next-line
                    const decoder = detect_node_1.default
                        ? new (require("util").TextDecoder)()
                        : new TextDecoder();
                    const str = decoder.decode(m.slice(addr, i));
                    const str2 = `${str} (mem:${m.length})`;
                    this.emit("log", str2);
                },
                memory: this.memory,
            },
        };
        if (module) {
            this.instance = await WebAssembly.instantiate(module, importObj);
            this.module = module;
        }
        else {
            const { instance, module } = await WebAssembly.instantiate(await fetchCode(), importObj);
            this.instance = instance;
            this.module = module;
        }
    }
    exports() {
        return this.instance.exports;
    }
    /**
     * When returning values from the WASM, use >>> operator to convert signed representation to unsigned representation.
     */
    call(name, ...args) {
        if (!this.exports()[name]) {
            throw new Error(`WASM function ${name} not found.`);
        }
        try {
            return this.exports()[name](...args) >>> 0;
        }
        catch (err) {
            const message = `WASM function ${name} aborted, error: ${err}`;
            this.emit("log", message);
            throw new Error(message);
        }
    }
    getMemory() {
        if (this.heap.length === 0) {
            return new Uint8Array(this.memory.buffer);
        }
        return this.heap;
    }
    memSize() {
        return this.getMemory().length;
    }
    sliceMemory(start, end) {
        return this.getMemory().slice(start, end);
    }
    transferToHeap(arr, offset) {
        const mem = this.getMemory();
        for (let i = 0; i < arr.length; i++) {
            mem[i + offset] = arr[i];
        }
    }
    /**
     * When calling the wasm, sometimes a caller will require exclusive access over a series of calls.
     * e.g. When a result is written to address 0, one cannot have another caller writing to the same address via
     * transferToHeap before the result is read via sliceMemory.
     * acquire() gets a single token from a fifo. The caller must call release() to add the token back.
     */
    async acquire() {
        await this.mutexQ.get();
    }
    release() {
        if (this.mutexQ.length() !== 0) {
            throw new Error("Release called but not acquired.");
        }
        this.mutexQ.put(true);
    }
}
exports.BarretenbergWasm = BarretenbergWasm;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFycmV0ZW5iZXJnX3dhc20uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvd2FzbS9iYXJyZXRlbmJlcmdfd2FzbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsMkJBQThCO0FBQzlCLDJFQUFpQztBQUNqQywrQkFBaUM7QUFDakMsbUNBQXNDO0FBQ3RDLGdDQUEyQztBQUMzQyxzQ0FBd0M7QUFDeEMsa0NBQXFDO0FBRXJDLHFCQUFZLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBRS9CLEtBQUssVUFBVSxTQUFTO0lBQzdCLElBQUkscUJBQU0sRUFBRTtRQUNWLE9BQU8sTUFBTSxJQUFBLGdCQUFTLEVBQUMsYUFBUSxDQUFDLENBQUMsU0FBUyxHQUFHLG9CQUFvQixDQUFDLENBQUM7S0FDcEU7U0FBTTtRQUNMLE1BQU0sR0FBRyxHQUFHLE1BQU0sS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDOUMsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7S0FDN0M7QUFDSCxDQUFDO0FBUEQsOEJBT0M7QUFFRCxNQUFhLGdCQUFpQixTQUFRLHFCQUFZO0lBY2hEO1FBQ0UsS0FBSyxFQUFFLENBQUM7UUFYRixXQUFNLEdBQUcsSUFBSSxpQkFBVSxFQUFXLENBQUM7UUFZekMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQVZNLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxNQUFNLEVBQUUsT0FBZ0I7UUFDckQsTUFBTSxZQUFZLEdBQUcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1FBQzVDLFlBQVksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUEsdUJBQWlCLEVBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEQsTUFBTSxZQUFZLENBQUMsSUFB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