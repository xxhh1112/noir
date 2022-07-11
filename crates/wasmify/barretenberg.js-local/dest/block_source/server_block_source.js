"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerBlockSource = void 0;
const _1 = require(".");
const events_1 = require("events");
const iso_fetch_1 = require("../iso_fetch");
const serialize_1 = require("../serialize");
// import { createDebugLogger } from '@aztec/barretenberg/log';
// const debug = createDebugLogger('bb:server_block_source');
class ServerBlockSource extends events_1.EventEmitter {
    constructor(baseUrl, pollInterval = 10000) {
        super();
        this.pollInterval = pollInterval;
        this.running = false;
        this.runningPromise = Promise.resolve();
        this.interruptPromise = Promise.resolve();
        this.interruptResolve = () => { };
        this.baseUrl = baseUrl.toString().replace(/\/$/, "");
    }
    async getLatestRollupId() {
        const url = new URL(`${this.baseUrl}/get-blocks`);
        const response = await this.awaitSucceed(() => (0, iso_fetch_1.fetch)(url.toString(), { headers: { "Accept-encoding": "gzip" } }));
        const result = Buffer.from(await response.arrayBuffer());
        const des = new serialize_1.Deserializer(result);
        return des.int32();
    }
    async start(from = 0) {
        this.running = true;
        this.interruptPromise = new Promise((resolve) => (this.interruptResolve = resolve));
        const emitBlocks = async () => {
            try {
                const blocks = await this.getBlocks(from);
                for (const block of blocks) {
                    this.emit("block", block);
                    from = block.rollupId + 1;
                }
            }
            catch (err) {
                // debug(err);
            }
        };
        await emitBlocks();
        const poll = async () => {
            while (this.running) {
                await emitBlocks();
                await this.sleepOrInterrupted(this.pollInterval);
            }
        };
        this.runningPromise = poll();
    }
    stop() {
        this.running = false;
        this.interruptResolve();
        return this.runningPromise;
    }
    async awaitSucceed(fn) {
        while (true) {
            try {
                const response = await fn();
                if (response.status !== 200) {
                    throw new Error(`Bad status code: ${response.status}`);
                }
                return response;
            }
            catch (err) {
                console.log(err.message);
                await new Promise((resolve) => setTimeout(resolve, 10000));
            }
        }
    }
    async getBlocks(from) {
        const url = new URL(`${this.baseUrl}/get-blocks`);
        if (from !== undefined) {
            url.searchParams.append("from", from.toString());
        }
        const response = await this.awaitSucceed(() => (0, iso_fetch_1.fetch)(url.toString(), { headers: { "Accept-encoding": "gzip" } }));
        const result = Buffer.from(await response.arrayBuffer());
        const des = new serialize_1.Deserializer(result);
        des.int32();
        return des.deserializeArray(_1.Block.deserialize);
    }
    async sleepOrInterrupted(ms) {
        let timeout;
        const promise = new Promise((resolve) => (timeout = setTimeout(resolve, ms)));
        await Promise.race([promise, this.interruptPromise]);
        clearTimeout(timeout);
    }
}
exports.ServerBlockSource = ServerBlockSource;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyX2Jsb2NrX3NvdXJjZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ibG9ja19zb3VyY2Uvc2VydmVyX2Jsb2NrX3NvdXJjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3QkFBdUM7QUFDdkMsbUNBQXNDO0FBQ3RDLDRDQUFxQztBQUNyQyw0Q0FBNEM7QUFDNUMsK0RBQStEO0FBQy9ELDZEQUE2RDtBQUU3RCxNQUFhLGlCQUFrQixTQUFRLHFCQUFZO0lBT2pELFlBQVksT0FBWSxFQUFVLGVBQWUsS0FBSztRQUNwRCxLQUFLLEVBQUUsQ0FBQztRQUR3QixpQkFBWSxHQUFaLFlBQVksQ0FBUTtRQU45QyxZQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ2hCLG1CQUFjLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25DLHFCQUFnQixHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQyxxQkFBZ0IsR0FBRyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUM7UUFLbEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRU0sS0FBSyxDQUFDLGlCQUFpQjtRQUM1QixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLGFBQWEsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsQ0FDNUMsSUFBQSxpQkFBSyxFQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FDbEUsQ0FBQztRQUNGLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxRQUFRLENBQUMsV0FB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