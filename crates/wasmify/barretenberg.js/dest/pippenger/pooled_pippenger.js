"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PooledPippenger = void 0;
const single_pippenger_1 = require("./single_pippenger");
const log_1 = require("../log");
const debug = (0, log_1.createDebugLogger)("bb:pippenger");
class PooledPippenger {
    constructor(workerPool) {
        this.workerPool = workerPool;
        this.pool = [];
    }
    async init(crsData) {
        const start = new Date().getTime();
        debug(`initializing: ${new Date().getTime() - start}ms`);
        this.pool = await Promise.all(this.workerPool.workers.map(async (w) => {
            const p = new single_pippenger_1.SinglePippenger(w);
            await p.init(crsData);
            return p;
        }));
        debug(`initialization took: ${new Date().getTime() - start}ms`);
    }
    async pippengerUnsafe(scalars, from, range) {
        const scalarsPerWorker = range / this.pool.length;
        const start = new Date().getTime();
        const results = await Promise.all(this.pool.map((p, i) => {
            const subset = scalars.slice(scalarsPerWorker * i * 32, scalarsPerWorker * (i + 1) * 32);
            return p.pippengerUnsafe(subset, scalarsPerWorker * i, scalarsPerWorker);
        }));
        debug(`pippenger run took: ${new Date().getTime() - start}ms`);
        return await this.sumElements(Buffer.concat(results));
    }
    async sumElements(buffer) {
        return await this.pool[0].sumElements(buffer);
    }
}
exports.PooledPippenger = PooledPippenger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbGVkX3BpcHBlbmdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9waXBwZW5nZXIvcG9vbGVkX3BpcHBlbmdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx5REFBcUQ7QUFDckQsZ0NBQTJDO0FBRzNDLE1BQU0sS0FBSyxHQUFHLElBQUEsdUJBQWlCLEVBQUMsY0FBYyxDQUFDLENBQUM7QUFFaEQsTUFBYSxlQUFlO0lBRzFCLFlBQW9CLFVBQXNCO1FBQXRCLGVBQVUsR0FBVixVQUFVLENBQVk7UUFGbkMsU0FBSSxHQUFzQixFQUFFLENBQUM7SUFFUyxDQUFDO0lBRXZDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBbUI7UUFDbkMsTUFBTSxLQUFLLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuQyxLQUFLLENBQUMsaUJBQWlCLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QyxNQUFNLENBQUMsR0FBRyxJQUFJLGtDQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RCLE9BQU8sQ0FBQyxDQUFDO1FBQ1gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUNGLEtBQUssQ0FBQyx3QkFBd0IsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxLQUFLLElBQUksQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFTSxLQUFLLENBQUMsZUFBZSxDQUMxQixPQUFtQixFQUNuQixJQUFZLEVBQ1osS0FBYTtRQUViLE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ2xELE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkMsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNyQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUMxQixnQkFBZ0IsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUN6QixnQkFBZ0IsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQ2hDLENBQUM7WUFDRixPQUFPLENBQUMsQ0FBQyxlQUFlLENBQ3RCLE1BQU0sRUFDTixnQkFBZ0IsR0FBRyxDQUFDLEVBQ3BCLGdCQUFnQixDQUNqQixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQ0gsQ0FBQztRQUNGLEtBQUssQ0FBQyx1QkFBdUIsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxLQUFLLElBQUksQ0FBQyxDQUFDO1FBQy9ELE9BQU8sTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRU0sS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFrQjtRQUN6QyxPQUFPLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEQsQ0FBQztDQUNGO0FBN0NELDBDQTZDQyJ9