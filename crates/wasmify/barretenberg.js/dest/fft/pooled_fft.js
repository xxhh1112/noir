"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PooledFftFactory = exports.PooledFft = void 0;
const log_1 = require("../log");
const fifo_1 = require("../fifo");
const single_fft_1 = require("./single_fft");
const debug = (0, log_1.createDebugLogger)("bb:fft");
class PooledFft {
    constructor(pool) {
        this.queue = new fifo_1.MemoryFifo();
        this.ffts = pool.workers.map((w) => new single_fft_1.SingleFft(w));
    }
    async init(circuitSize) {
        const start = new Date().getTime();
        debug(`initializing fft of size: ${circuitSize}`);
        await Promise.all(this.ffts.map((f) => f.init(circuitSize)));
        this.ffts.forEach((w) => this.processJobs(w));
        debug(`initialization took: ${new Date().getTime() - start}ms`);
    }
    async destroy() {
        this.queue.cancel();
        await Promise.all(this.ffts.map((f) => f.destroy()));
    }
    async processJobs(worker) {
        while (true) {
            const job = await this.queue.get();
            if (!job) {
                break;
            }
            const result = await (job.inverse
                ? worker.ifft(job.coefficients)
                : worker.fft(job.coefficients, job.constant));
            job.resolve(result);
        }
    }
    async fft(coefficients, constant) {
        return await new Promise((resolve) => this.queue.put({ coefficients, constant, inverse: false, resolve }));
    }
    async ifft(coefficients) {
        return await new Promise((resolve) => this.queue.put({ coefficients, inverse: true, resolve }));
    }
}
exports.PooledFft = PooledFft;
class PooledFftFactory {
    constructor(workerPool) {
        this.workerPool = workerPool;
        this.ffts = {};
    }
    async createFft(circuitSize) {
        if (!this.ffts[circuitSize]) {
            const fft = new PooledFft(this.workerPool);
            await fft.init(circuitSize);
            this.ffts[circuitSize] = fft;
        }
        return this.ffts[circuitSize];
    }
    async destroy() {
        await Promise.all(Object.values(this.ffts).map((fft) => fft.destroy()));
    }
}
exports.PooledFftFactory = PooledFftFactory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbGVkX2ZmdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mZnQvcG9vbGVkX2ZmdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxnQ0FBMkM7QUFDM0Msa0NBQXFDO0FBR3JDLDZDQUF5QztBQUV6QyxNQUFNLEtBQUssR0FBRyxJQUFBLHVCQUFpQixFQUFDLFFBQVEsQ0FBQyxDQUFDO0FBUzFDLE1BQWEsU0FBUztJQUlwQixZQUFZLElBQWdCO1FBSHBCLFVBQUssR0FBRyxJQUFJLGlCQUFVLEVBQU8sQ0FBQztRQUlwQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLHNCQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRU0sS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFtQjtRQUNuQyxNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25DLEtBQUssQ0FBQyw2QkFBNkIsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNsRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUMsS0FBSyxDQUFDLHdCQUF3QixJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVNLEtBQUssQ0FBQyxPQUFPO1FBQ2xCLElBQUksQ0FBQyxLQUFL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