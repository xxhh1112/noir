"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.depositTxFromJson = exports.depositTxToJson = exports.initialWorldStateFromBuffer = exports.initialWorldStateToBuffer = exports.pendingTxFromJson = exports.pendingTxToJson = exports.txFromJson = exports.txToJson = exports.DefiSettlementTime = exports.TxSettlementTime = void 0;
const address_1 = require("../address");
const tx_id_1 = require("../tx_id");
var TxSettlementTime;
(function (TxSettlementTime) {
    TxSettlementTime[TxSettlementTime["NEXT_ROLLUP"] = 0] = "NEXT_ROLLUP";
    TxSettlementTime[TxSettlementTime["INSTANT"] = 1] = "INSTANT";
})(TxSettlementTime = exports.TxSettlementTime || (exports.TxSettlementTime = {}));
var DefiSettlementTime;
(function (DefiSettlementTime) {
    DefiSettlementTime[DefiSettlementTime["DEADLINE"] = 0] = "DEADLINE";
    DefiSettlementTime[DefiSettlementTime["NEXT_ROLLUP"] = 1] = "NEXT_ROLLUP";
    DefiSettlementTime[DefiSettlementTime["INSTANT"] = 2] = "INSTANT";
})(DefiSettlementTime = exports.DefiSettlementTime || (exports.DefiSettlementTime = {}));
const txToJson = ({ proofData, offchainTxData, depositSignature, }) => ({
    proofData: proofData.toString("hex"),
    offchainTxData: offchainTxData.toString("hex"),
    depositSignature: depositSignature
        ? depositSignature.toString("hex")
        : undefined,
});
exports.txToJson = txToJson;
const txFromJson = ({ proofData, offchainTxData, depositSignature, }) => ({
    proofData: Buffer.from(proofData, "hex"),
    offchainTxData: Buffer.from(offchainTxData, "hex"),
    depositSignature: depositSignature
        ? Buffer.from(depositSignature, "hex")
        : undefined,
});
exports.txFromJson = txFromJson;
const pendingTxToJson = ({ txId, noteCommitment1, noteCommitment2, }) => ({
    txId: txId.toString(),
    noteCommitment1: noteCommitment1.toString("hex"),
    noteCommitment2: noteCommitment2.toString("hex"),
});
exports.pendingTxToJson = pendingTxToJson;
const pendingTxFromJson = ({ txId, noteCommitment1, noteCommitment2, }) => ({
    txId: tx_id_1.TxId.fromString(txId),
    noteCommitment1: Buffer.from(noteCommitment1, "hex"),
    noteCommitment2: Buffer.from(noteCommitment2, "hex"),
});
exports.pendingTxFromJson = pendingTxFromJson;
const initialWorldStateToBuffer = (initialWorldState) => {
    const accountsSizeBuf = Buffer.alloc(4);
    accountsSizeBuf.writeUInt32BE(initialWorldState.initialAccounts.length);
    return Buffer.concat([
        accountsSizeBuf,
        initialWorldState.initialAccounts,
        ...initialWorldState.initialSubtreeRoots,
    ]);
};
exports.initialWorldStateToBuffer = initialWorldStateToBuffer;
const initialWorldStateFromBuffer = (data) => {
    const accountsSize = data.readUInt32BE(0);
    const subTreeStart = 4 + accountsSize;
    const initialWorldState = {
        initialAccounts: data.slice(4, subTreeStart),
        initialSubtreeRoots: [],
    };
    // each sub tree root is 32 bytes
    for (let i = subTreeStart; i < data.length; i += 32) {
        initialWorldState.initialSubtreeRoots.push(data.slice(i, i + 32));
    }
    return initialWorldState;
};
exports.initialWorldStateFromBuffer = initialWorldStateFromBuffer;
const depositTxToJson = ({ assetId, value, publicOwner, }) => ({
    assetId,
    value: value.toString(),
    publicOwner: publicOwner.toString(),
});
exports.depositTxToJson = depositTxToJson;
const depositTxFromJson = ({ assetId, value, publicOwner, }) => ({
    assetId,
    value: BigInt(value),
    publicOwner: address_1.EthAddress.fromString(publicOwner),
});
exports.depositTxFromJson = depositTxFromJson;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sbHVwX3Byb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JvbGx1cF9wcm92aWRlci9yb2xsdXBfcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsd0NBQXlEO0FBSXpELG9DQUFnQztBQUdoQyxJQUFZLGdCQUdYO0FBSEQsV0FBWSxnQkFBZ0I7SUFDMUIscUVBQVcsQ0FBQTtJQUNYLDZEQUFPLENBQUE7QUFDVCxDQUFDLEVBSFcsZ0JBQWdCLEdBQWhCLHdCQUFnQixLQUFoQix3QkFBZ0IsUUFHM0I7QUFFRCxJQUFZLGtCQUlYO0FBSkQsV0FBWSxrQkFBa0I7SUFDNUIsbUVBQVEsQ0FBQTtJQUNSLHlFQUFXLENBQUE7SUFDWCxpRUFBTyxDQUFBO0FBQ1QsQ0FBQyxFQUpXLGtCQUFrQixHQUFsQiwwQkFBa0IsS0FBbEIsMEJBQWtCLFFBSTdCO0FBY00sTUFBTSxRQUFRLEdBQUcsQ0FBQyxFQUN2QixTQUFTLEVBQ1QsY0FBYyxFQUNkLGdCQUFnQixHQUNiLEVBQVUsRUFBRSxDQUFDLENBQUM7SUFDakIsU0FBUyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO0lBQ3BDLGNBQWMsRUFBRSxjQUFjLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztJQUM5QyxnQkFBZ0IsRUFBRSxnQkFBZ0I7UUFDaEMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFDbEMsQ0FBQyxDQUFDLFNBQVM7Q0FDZCxDQUFDLENBQUM7QUFWVSxRQUFBLFFBQVEsWUFVbEI7QUFFSSxNQUFNLFVBQVUsR0FBRyxDQUFDLEVBQ3pCLFNBQVMsRUFDVCxjQUFjLEVBQ2QsZ0JBQWdCLEdBQ1QsRUFBTSxFQUFFLENBQUMsQ0FBQztJQUNqQixTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDO0lBQ3hDLGNBQWMsRUFBRSxNQUFNLENBQUMsSUFBSSxD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