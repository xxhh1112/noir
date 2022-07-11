"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerRollupProvider = void 0;
const asset_1 = require("../asset");
const block_source_1 = require("../block_source");
const iso_fetch_1 = require("../iso_fetch");
const tx_id_1 = require("../tx_id");
const rollup_provider_1 = require("./rollup_provider");
const rollup_provider_status_1 = require("./rollup_provider_status");
class ServerRollupProvider extends block_source_1.ServerBlockSource {
    constructor(baseUrl, pollInterval = 10000) {
        super(baseUrl, pollInterval);
    }
    async sendTxs(txs) {
        const data = txs.map(rollup_provider_1.txToJson);
        const response = await this.fetch("/txs", data);
        const body = await response.json();
        return body.txIds.map((txId) => tx_id_1.TxId.fromString(txId));
    }
    async getTxFees(assetId) {
        const response = await this.fetch("/tx-fees", { assetId });
        const txFees = (await response.json());
        return txFees.map((fees) => fees.map(asset_1.assetValueFromJson));
    }
    async getDefiFees(bridgeId) {
        const response = await this.fetch("/defi-fees", {
            bridgeId: bridgeId.toString(),
        });
        const defiFees = (await response.json());
        return defiFees.map(asset_1.assetValueFromJson);
    }
    async getStatus() {
        const response = await this.fetch("/status");
        try {
            return (0, rollup_provider_status_1.rollupProviderStatusFromJson)(await response.json());
        }
        catch (err) {
            throw new Error("Bad response: getStatus()");
        }
    }
    async getPendingTxs() {
        const response = await this.fetch("/get-pending-txs");
        const txs = await response.json();
        return txs.map(rollup_provider_1.pendingTxFromJson);
    }
    async getPendingNoteNullifiers() {
        const response = await this.fetch("/get-pending-note-nullifiers");
        const nullifiers = (await response.json());
        return nullifiers.map((n) => Buffer.from(n, "hex"));
    }
    async getPendingDepositTxs() {
        const response = await this.fetch("/get-pending-deposit-txs");
        const txs = await response.json();
        return txs.map(rollup_provider_1.depositTxFromJson);
    }
    async clientLog(log) {
        await this.fetch("/client-log", log);
    }
    async getInitialWorldState() {
        const response = await this.fetch("/get-initial-world-state");
        const arrBuffer = await response.arrayBuffer();
        return (0, rollup_provider_1.initialWorldStateFromBuffer)(Buffer.from(arrBuffer));
    }
    async isAccountRegistered(accountPublicKey) {
        const response = await this.fetch("/is-account-registered", {
            accountPublicKey: accountPublicKey.toString(),
        });
        return +(await response.text()) === 1;
    }
    async isAliasRegistered(alias) {
        const response = await this.fetch("/is-alias-registered", { alias });
        return +(await response.text()) === 1;
    }
    async isAliasRegisteredToAccount(accountPublicKey, alias) {
        const response = await this.fetch("/is-alias-registered-to-account", {
            accountPublicKey: accountPublicKey.toString(),
            alias,
        });
        return +(await response.text()) === 1;
    }
    async fetch(path, data) {
        const url = new URL(`${this.baseUrl}${path}`);
        const init = data
            ? { method: "POST", body: JSON.stringify(data) }
            : undefined;
        const response = await (0, iso_fetch_1.fetch)(url.toString(), init).catch(() => undefined);
        if (!response) {
            throw new Error("Failed to contact rollup provider.");
        }
        if (response.status === 400) {
            const body = await response.json();
            throw new Error(body.error);
        }
        if (response.status !== 200) {
            throw new Error(`Bad response code ${response.status}.`);
        }
        return response;
    }
}
exports.ServerRollupProvider = ServerRollupProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyX3JvbGx1cF9wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xsdXBfcHJvdmlkZXIvc2VydmVyX3JvbGx1cF9wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxvQ0FBOEQ7QUFDOUQsa0RBQW9EO0FBRXBELDRDQUFxQztBQUVyQyxvQ0FBZ0M7QUFDaEMsdURBTTJCO0FBQzNCLHFFQUF3RTtBQUV4RSxNQUFhLG9CQUNYLFNBQVEsZ0NBQWlCO0lBR3pCLFlBQVksT0FBWSxFQUFFLFlBQVksR0FBRyxLQUFLO1FBQzVDLEtBQUssQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBUztRQUNyQixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLDBCQUFRLENBQUMsQ0FBQztRQUMvQixNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hELE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ25DLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFlBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFlO1FBQzdCLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQXVCLENBQUM7UUFDN0QsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUs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