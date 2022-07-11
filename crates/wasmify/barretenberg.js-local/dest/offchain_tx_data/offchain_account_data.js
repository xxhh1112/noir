"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffchainAccountData = void 0;
const account_id_1 = require("../account_id");
const address_1 = require("../address");
const serialize_1 = require("../serialize");
class OffchainAccountData {
    constructor(accountPublicKey, aliasHash, spendingPublicKey1 = Buffer.alloc(32), spendingPublicKey2 = Buffer.alloc(32), txRefNo = 0) {
        this.accountPublicKey = accountPublicKey;
        this.aliasHash = aliasHash;
        this.spendingPublicKey1 = spendingPublicKey1;
        this.spendingPublicKey2 = spendingPublicKey2;
        this.txRefNo = txRefNo;
        if (spendingPublicKey1.length !== 32) {
            throw new Error("Expect spendingPublicKey1 to be 32 bytes.");
        }
        if (spendingPublicKey2.length !== 32) {
            throw new Error("Expect spendingPublicKey2 to be 32 bytes.");
        }
    }
    static fromBuffer(buf) {
        if (buf.length !== OffchainAccountData.SIZE) {
            throw new Error(`Invalid buffer size: ${buf.length} != ${OffchainAccountData.SIZE}`);
        }
        let dataStart = 0;
        const accountPublicKey = new address_1.GrumpkinAddress(buf.slice(dataStart, dataStart + 64));
        dataStart += 64;
        const aliasHash = new account_id_1.AliasHash(buf.slice(dataStart, dataStart + account_id_1.AliasHash.SIZE));
        dataStart += account_id_1.AliasHash.SIZE;
        const spendingPublicKey1 = buf.slice(dataStart, dataStart + 32);
        dataStart += 32;
        const spendingPublicKey2 = buf.slice(dataStart, dataStart + 32);
        dataStart += 32;
        const txRefNo = buf.readUInt32BE(dataStart);
        return new OffchainAccountData(accountPublicKey, aliasHash, spendingPublicKey1, spendingPublicKey2, txRefNo);
    }
    toBuffer() {
        return Buffer.concat([
            this.accountPublicKey.toBuffer(),
            this.aliasHash.toBuffer(),
            this.spendingPublicKey1,
            this.spendingPublicKey2,
            (0, serialize_1.numToUInt32BE)(this.txRefNo),
        ]);
    }
}
exports.OffchainAccountData = OffchainAccountData;
OffchainAccountData.EMPTY = new OffchainAccountData(address_1.GrumpkinAddress.ZERO, account_id_1.AliasHash.ZERO);
OffchainAccountData.SIZE = OffchainAccountData.EMPTY.toBuffer().length;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2ZmY2hhaW5fYWNjb3VudF9kYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29mZmNoYWluX3R4X2RhdGEvb2ZmY2hhaW5fYWNjb3VudF9kYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDhDQUEwQztBQUMxQyx3Q0FBNkM7QUFDN0MsNENBQTZDO0FBRTdDLE1BQWEsbUJBQW1CO0lBSTlCLFlBQ2tCLGdCQUFpQyxFQUNqQyxTQUFvQixFQUNwQixxQkFBcUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFDckMscUJBQXFCLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQ3JDLFVBQVUsQ0FBQztRQUpYLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBaUI7UUFDakMsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUNwQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW1CO1FBQ3JDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBbUI7UUFDckMsWUFBTyxHQUFQLE9BQU8sQ0FBSTtRQUUzQixJQUFJLGtCQUFrQixDQUFDLE1BQU0sS0FBSyxFQUFFLEVBQUU7WUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO1NBQzlEO1FBQ0QsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEtBQUssRUFBRSxFQUFFO1lBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztTQUM5RDtJQUNILENBQUM7SUFFRCxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQVc7UUFDM0IsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLG1CQUFtQixDQUFDLElBQUksRUFBRTtZQUMzQyxNQUFNLElBQUksS0FBSyxDQUNiLHdCQUF3QixHQUFHLENBQUMsTUFBTSxPQUFPLG1CQUFtQixDQUFDLElBQUksRUFBRSxDQUNwRSxDQUFDO1NBQ0g7UUFFRCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbEIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLHlCQUFlLENBQzFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FDckMsQ0FBQztRQUNGLFNBQVMsSUFBSSxFQUFFLENBQUM7UUFDaEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxzQkFBUyxDQUM3QixHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyxJQUFJLENBQUMsQ0FDakQsQ0FBQztRQUNGLFNBQVMsSUFBSSxzQkFBUyxDQUFDLElBQUksQ0FBQztRQUM1QixNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNoRSxTQUFTLElBQUksRUFBRSxDQUFDO1FBQ2hCLE1BQU0sa0JBQWtCLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLFNBQVMsSUFBSSxFQUFFLENBQUM7UUFDaEIsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM1QyxPQUFPLElBQUksbUJBQW1CLENBQzVCLGdCQUFnQixFQUNoQixTQUFTLEVBQ1Qsa0JBQWtCLEVBQ2xCLGtCQUFrQixFQUNsQixPQUFPLENBQ1IsQ0FBQztJQUNKLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ25CLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUU7WUFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUU7WUFDekIsSUFBSSxDQUFDLGtCQUFrQjtZQUN2QixJQUFJLENBQUMsa0JBQWtCO1lBQ3ZCLElBQUEseUJBQWEsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQzVCLENBQUMsQ0FBQztJQUNMLENBQUM7O0FBekRILGtEQTBEQztBQXpEUSx5QkFBSyxHQUFHLElBQUksbUJBQW1CLENBQUMseUJBQWUsQ0FBQyxJQUFJLEVBQUUsc0JBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0RSx3QkFBSSxHQUFHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMifQ==