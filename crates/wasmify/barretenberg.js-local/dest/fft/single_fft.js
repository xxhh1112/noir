"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingleFftFactory = exports.SingleFft = void 0;
const threads_1 = require("threads");
class SingleFft {
    constructor(wasm) {
        this.wasm = wasm;
    }
    async init(circuitSize) {
        this.domainPtr = await this.wasm.call("new_evaluation_domain", circuitSize);
    }
    async destroy() {
        await this.wasm.call("delete_evaluation_domain", this.domainPtr);
    }
    async fft(coefficients, constant) {
        const circuitSize = coefficients.length / 32;
        const newPtr = await this.wasm.call("bbmalloc", coefficients.length);
        await this.wasm.transferToHeap((0, threads_1.Transfer)(coefficients, [coefficients.buffer]), newPtr);
        await this.wasm.transferToHeap((0, threads_1.Transfer)(constant, [constant.buffer]), 0);
        await this.wasm.call("coset_fft_with_generator_shift", newPtr, 0, this.domainPtr);
        const result = await this.wasm.sliceMemory(newPtr, newPtr + circuitSize * 32);
        await this.wasm.call("bbfree", newPtr);
        return result;
    }
    async ifft(coefficients) {
        const circuitSize = coefficients.length / 32;
        const newPtr = await this.wasm.call("bbmalloc", coefficients.length);
        await this.wasm.transferToHeap((0, threads_1.Transfer)(coefficients, [coefficients.buffer]), newPtr);
        await this.wasm.call("ifft", newPtr, this.domainPtr);
        const result = await this.wasm.sliceMemory(newPtr, newPtr + circuitSize * 32);
        await this.wasm.call("bbfree", newPtr);
        return result;
    }
}
exports.SingleFft = SingleFft;
class SingleFftFactory {
    constructor(wasm) {
        this.wasm = wasm;
        this.ffts = {};
    }
    async createFft(circuitSize) {
        if (!this.ffts[circuitSize]) {
            const fft = new SingleFft(this.wasm);
            await fft.init(circuitSize);
            this.ffts[circuitSize] = fft;
        }
        return this.ffts[circuitSize];
    }
    async destroy() { }
}
exports.SingleFftFactory = SingleFftFactory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2luZ2xlX2ZmdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mZnQvc2luZ2xlX2ZmdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBbUM7QUFJbkMsTUFBYSxTQUFTO0lBR3BCLFlBQW9CLElBQXdCO1FBQXhCLFNBQUksR0FBSixJQUFJLENBQW9CO0lBQUcsQ0FBQztJQUV6QyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQW1CO1FBQ25DLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRU0sS0FBSyxDQUFDLE9BQU87UUFDbEIsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUVNLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBd0IsRUFBRSxRQUFvQjtRQUM3RCxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUM3QyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckUsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FDNUIsSUFBQSxrQkFBUSxFQUFDLFlBQVksRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBUSxFQUNwRCxNQUFNLENBQ1AsQ0FBQztRQUNGLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQzVCLElBQUEsa0JBQVEsRUFBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQVEsRUFDNUMsQ0FBQyxDQUNGLENBQUM7UUFDRixNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUNsQixnQ0FBZ0MsRUFDaEMsTUFBTSxFQUNOLENBQUMsRUFDRCxJQUFJLENBQUMsU0FBUyxDQUNmLENBQUM7UUFDRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUN4QyxNQUFNLEVBQ04sTUFBTSxHQUFHLFdBQVcsR0FBRyxFQUFFLENBQzFCLENBQUM7UUFDRixNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN2QyxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sS0FBSyxDQUFDLElBQUksQ0FBQyxZQUF3QjtRQUN4QyxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUM3QyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckUsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FDNUIsSUFBQSxrQkFBUSxFQUFDLFlBQVksRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBUSxFQUNwRCxNQUFNLENBQ1AsQ0FBQztRQUNGLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FDeEMsTUFBTSxFQUNOLE1BQU0sR0FBRyxXQUFXLEdBQUcsRUFBRSxDQUMxQixDQUFDO1FBQ0YsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkMsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztDQUNGO0FBckRELDhCQXFEQztBQUVELE1BQWEsZ0JBQWdCO0lBRzNCLFlBQW9CLElBQXdCO1FBQXhCLFNBQUksR0FBSixJQUFJLENBQW9CO1FBRnBDLFNBQUksR0FBbUMsRUFBRSxDQUFDO0lBRUgsQ0FBQztJQUV6QyxLQUFLLENBQUMsU0FBUyxDQUFDLFdBQW1CO1FBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzNCLE1BQU0sR0FBRyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDOUI7UUFDRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVNLEtBQUssQ0FBQyxPQUFPLEtBQUksQ0FBQztDQUMxQjtBQWZELDRDQWVDIn0=