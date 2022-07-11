"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthereumRpc = void 0;
const address_1 = require("../address");
class EthereumRpc {
    constructor(provider) {
        this.provider = provider;
    }
    async getChainId() {
        const result = await this.provider.request({ method: "eth_chainId" });
        return Number(result);
    }
    async getAccounts() {
        const result = await this.provider.request({
            method: "eth_accounts",
        });
        return result.map(address_1.EthAddress.fromString);
    }
    async getTransactionCount(addr) {
        const result = await this.provider.request({
            method: "eth_getTransactionCount",
            params: [addr.toString(), "latest"],
        });
        return Number(result);
    }
    async getBalance(addr) {
        const result = await this.provider.request({
            method: "eth_getBalance",
            params: [addr.toString(), "latest"],
        });
        return BigInt(result);
    }
    /**
     * TODO: Return proper type with converted properties.
     */
    async getTransactionByHash(txHash) {
        const result = await this.provider.request({
            method: "eth_getTransactionByHash",
            params: [txHash.toString()],
        });
        return result;
    }
    /**
     * TODO: Return proper type with converted properties.
     * For now just baseFeePerGas.
     */
    async getBlockByNumber(numberOrTag, fullTxs = false) {
        const result = await this.provider.request({
            method: "eth_getBlockByNumber",
            params: [numberOrTag, fullTxs],
        });
        return {
            ...result,
            baseFeePerGas: BigInt(result.baseFeePerGas),
        };
    }
}
exports.EthereumRpc = EthereumRpc;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXRoZXJldW1fcnBjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Jsb2NrY2hhaW4vZXRoZXJldW1fcnBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHdDQUF3QztBQVF4QyxNQUFhLFdBQVc7SUFDdEIsWUFBb0IsUUFBMEI7UUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFBRyxDQUFDO0lBRTNDLEtBQUssQ0FBQyxVQUFVO1FBQ3JCLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztRQUN0RSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRU0sS0FBSyxDQUFDLFdBQVc7UUFDdEIsTUFBTSxNQUFNLEdBQWEsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUNuRCxNQUFNLEVBQUUsY0FBYztTQUN2QixDQUFDLENBQUM7UUFDSCxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsb0JBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRU0sS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQWdCO1FBQy9DLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7WUFDekMsTUFBTSxFQUFFLHlCQUF5QjtZQUNqQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBUSxDQUFDO1NBQ3BDLENBQUMsQ0FBQztRQUNILE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFTSxLQUFLLENBQUMsVUFBVSxDQUFDLElBQWdCO1FBQ3RDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7WUFDekMsTUFBTSxFQUFFLGdCQUFnQjtZQUN4QixNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBUSxDQUFDO1NBQ3BDLENBQUMsQ0FBQztRQUNILE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7T0FFRztJQUNJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxNQUFjO1FBQzlDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7WUFDekMsTUFBTSxFQUFFLDBCQUEwQjtZQUNsQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDNUIsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVEOzs7T0FHRztJQUNJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FDM0IsV0FBdUQsRUFDdkQsT0FBTyxHQUFHLEtBQUs7UUFFZixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO1lBQ3pDLE1BQU0sRUFBRSxzQkFBc0I7WUFDOUIsTUFBTSxFQUFFLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQztTQUMvQixDQUFDLENBQUM7UUFDSCxPQUFPO1lBQ0wsR0FBRyxNQUFNO1lBQ1QsYUFBYSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDO1NBQ25DLENBQUM7SUFDYixDQUFDO0NBQ0Y7QUEzREQsa0NBMkRDIn0=