"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainStatusFromJson = exports.blockchainStatusToJson = exports.blockchainBridgeFromJson = exports.blockchainBridgeToJson = exports.blockchainAssetFromJson = exports.blockchainAssetToJson = exports.isAccountTx = exports.isDefiDepositTx = exports.numTxTypes = exports.TxType = void 0;
const address_1 = require("../address");
// TODO: Move to TxType module.
var TxType;
(function (TxType) {
    TxType[TxType["DEPOSIT"] = 0] = "DEPOSIT";
    TxType[TxType["TRANSFER"] = 1] = "TRANSFER";
    TxType[TxType["WITHDRAW_TO_WALLET"] = 2] = "WITHDRAW_TO_WALLET";
    TxType[TxType["WITHDRAW_TO_CONTRACT"] = 3] = "WITHDRAW_TO_CONTRACT";
    TxType[TxType["ACCOUNT"] = 4] = "ACCOUNT";
    TxType[TxType["DEFI_DEPOSIT"] = 5] = "DEFI_DEPOSIT";
    TxType[TxType["DEFI_CLAIM"] = 6] = "DEFI_CLAIM";
})(TxType = exports.TxType || (exports.TxType = {}));
exports.numTxTypes = 7;
function isDefiDepositTx(txType) {
    return txType === TxType.DEFI_DEPOSIT;
}
exports.isDefiDepositTx = isDefiDepositTx;
function isAccountTx(txType) {
    return txType === TxType.ACCOUNT;
}
exports.isAccountTx = isAccountTx;
const blockchainAssetToJson = ({ address, ...asset }) => ({
    ...asset,
    address: address.toString(),
});
exports.blockchainAssetToJson = blockchainAssetToJson;
const blockchainAssetFromJson = ({ address, ...asset }) => ({
    ...asset,
    address: address_1.EthAddress.fromString(address),
});
exports.blockchainAssetFromJson = blockchainAssetFromJson;
const blockchainBridgeToJson = ({ address, ...bridge }) => ({
    ...bridge,
    address: address.toString(),
});
exports.blockchainBridgeToJson = blockchainBridgeToJson;
const blockchainBridgeFromJson = ({ address, ...bridge }) => ({
    ...bridge,
    address: address_1.EthAddress.fromString(address),
});
exports.blockchainBridgeFromJson = blockchainBridgeFromJson;
function blockchainStatusToJson(status) {
    return {
        ...status,
        rollupContractAddress: status.rollupContractAddress.toString(),
        verifierContractAddress: status.verifierContractAddress.toString(),
        dataRoot: status.dataRoot.toString("hex"),
        nullRoot: status.nullRoot.toString("hex"),
        rootRoot: status.rootRoot.toString("hex"),
        defiRoot: status.defiRoot.toString("hex"),
        defiInteractionHashes: status.defiInteractionHashes.map((v) => v.toString("hex")),
        assets: status.assets.map(exports.blockchainAssetToJson),
        bridges: status.bridges.map(exports.blockchainBridgeToJson),
    };
}
exports.blockchainStatusToJson = blockchainStatusToJson;
function blockchainStatusFromJson(json) {
    return {
        ...json,
        rollupContractAddress: address_1.EthAddress.fromString(json.rollupContractAddress),
        verifierContractAddress: address_1.EthAddress.fromString(json.verifierContractAddress),
        dataRoot: Buffer.from(json.dataRoot, "hex"),
        nullRoot: Buffer.from(json.nullRoot, "hex"),
        rootRoot: Buffer.from(json.rootRoot, "hex"),
        defiRoot: Buffer.from(json.defiRoot, "hex"),
        defiInteractionHashes: json.defiInteractionHashes.map((f) => Buffer.from(f, "hex")),
        assets: json.assets.map(exports.blockchainAssetFromJson),
        bridges: json.bridges.map(exports.blockchainBridgeFromJson),
    };
}
exports.blockchainStatusFromJson = blockchainStatusFromJson;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvY2tjaGFpbl9zdGF0dXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYmxvY2tjaGFpbi9ibG9ja2NoYWluX3N0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBd0M7QUFXeEMsK0JBQStCO0FBQy9CLElBQVksTUFRWDtBQVJELFdBQVksTUFBTTtJQUNoQix5Q0FBTyxDQUFBO0lBQ1AsMkNBQVEsQ0FBQTtJQUNSLCtEQUFrQixDQUFBO0lBQ2xCLG1FQUFvQixDQUFBO0lBQ3BCLHlDQUFPLENBQUE7SUFDUCxtREFBWSxDQUFBO0lBQ1osK0NBQVUsQ0FBQTtBQUNaLENBQUMsRUFSVyxNQUFNLEdBQU4sY0FBTSxLQUFOLGNBQU0sUUFRakI7QUFDWSxRQUFBLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFFNUIsU0FBZ0IsZUFBZSxDQUFDLE1BQWM7SUFDNUMsT0FBTyxNQUFNLEtBQUssTUFBTSxDQUFDLFlBQVksQ0FBQztBQUN4QyxDQUFDO0FBRkQsMENBRUM7QUFFRCxTQUFnQixXQUFXLENBQUMsTUFBYztJQUN4QyxPQUFPLE1BQU0sS0FBSyxNQUFNLENBQUMsT0FBTyxDQUFDO0FBQ25DLENBQUM7QUFGRCxrQ0FFQztBQVlNLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxFQUNwQyxPQUFPLEVBQ1AsR0FBRyxLQUFLLEVBQ1EsRUFBdUIsRUFBRSxDQUFDLENBQUM7SUFDM0MsR0FBRyxLQUFLO0lBQ1IsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUU7Q0FDNUIsQ0FBQyxDQUFDO0FBTlUsUUFBQSxxQkFBcUIseUJBTS9CO0FBRUksTUFBTSx1QkFBdUIsR0FBRyxDQUFDLEVBQ3RDLE9BQU8sRUFDUCxHQUFHLEtBQUssRUFDWSxFQUFtQixFQUFFLENBQUMsQ0FBQztJQUMzQyxHQUFHLEtBQUs7SUFDUixPQUFPLEVBQUUsb0JBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO0NBQ3hDLENBQUMsQ0FBQztBQU5V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