"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountTx = void 0;
const account_id_1 = require("../../account_id");
const address_1 = require("../../address");
const merkle_tree_1 = require("../../merkle_tree");
const serialize_1 = require("../../serialize");
class AccountTx {
    constructor(merkleRoot, accountPublicKey, newAccountPublicKey, newSpendingPublicKey1, newSpendingPublicKey2, aliasHash, create, migrate, accountIndex, accountPath, spendingPublicKey) {
        this.merkleRoot = merkleRoot;
        this.accountPublicKey = accountPublicKey;
        this.newAccountPublicKey = newAccountPublicKey;
        this.newSpendingPublicKey1 = newSpendingPublicKey1;
        this.newSpendingPublicKey2 = newSpendingPublicKey2;
        this.aliasHash = aliasHash;
        this.create = create;
        this.migrate = migrate;
        this.accountIndex = accountIndex;
        this.accountPath = accountPath;
        this.spendingPublicKey = spendingPublicKey;
    }
    toBuffer() {
        return Buffer.concat([
            this.merkleRoot,
            this.accountPublicKey.toBuffer(),
            this.newAccountPublicKey.toBuffer(),
            this.newSpendingPublicKey1.toBuffer(),
            this.newSpendingPublicKey2.toBuffer(),
            this.aliasHash.toBuffer32(),
            Buffer.from([this.create ? 1 : 0]),
            Buffer.from([this.migrate ? 1 : 0]),
            (0, serialize_1.numToUInt32BE)(this.accountIndex),
            this.accountPath.toBuffer(),
            this.spendingPublicKey.toBuffer(),
        ]);
    }
    static fromBuffer(buf) {
        let dataStart = 0;
        const merkleRoot = buf.slice(dataStart, dataStart + 32);
        dataStart += 32;
        const accountPublicKey = new address_1.GrumpkinAddress(buf.slice(dataStart, dataStart + 64));
        dataStart += 64;
        const newAccountPublicKey = new address_1.GrumpkinAddress(buf.slice(dataStart, dataStart + 64));
        dataStart += 64;
        const newSpendingPublicKey1 = new address_1.GrumpkinAddress(buf.slice(dataStart, dataStart + 64));
        dataStart += 64;
        const newSpendingPublicKey2 = new address_1.GrumpkinAddress(buf.slice(dataStart, dataStart + 64));
        dataStart += 64;
        const aliasHash = new account_id_1.AliasHash(buf.slice(dataStart + 4, dataStart + 32));
        dataStart += 32;
        const create = !!buf[dataStart];
        dataStart += 1;
        const migrate = !!buf[dataStart];
        dataStart += 1;
        const accountIndex = buf.readUInt32BE(dataStart);
        dataStart += 4;
        const { elem: accountPath, adv } = merkle_tree_1.HashPath.deserialize(buf, dataStart);
        dataStart += adv;
        const spendingPublicKey = new address_1.GrumpkinAddress(buf.slice(dataStart, dataStart + 64));
        return new AccountTx(merkleRoot, accountPublicKey, newAccountPublicKey, newSpendingPublicKey1, newSpendingPublicKey2, aliasHash, create, migrate, accountIndex, accountPath, spendingPublicKey);
    }
}
exports.AccountTx = AccountTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudF90eC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnRfcHJvb2ZzL2FjY291bnRfcHJvb2YvYWNjb3VudF90eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpREFBNkM7QUFDN0MsMkNBQWdEO0FBQ2hELG1EQUE2QztBQUM3QywrQ0FBZ0Q7QUFFaEQsTUFBYSxTQUFTO0lBQ3BCLFlBQ1MsVUFBa0IsRUFDbEIsZ0JBQWlDLEVBQ2pDLG1CQUFvQyxFQUNwQyxxQkFBc0MsRUFDdEMscUJBQXNDLEVBQ3RDLFNBQW9CLEVBQ3BCLE1BQWUsRUFDZixPQUFnQixFQUNoQixZQUFvQixFQUNwQixXQUFxQixFQUNyQixpQkFBa0M7UUFWbEMsZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUNsQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWlCO1FBQ2pDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBaUI7UUFDcEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUFpQjtRQUN0QywwQkFBcUIsR0FBckIscUJBQXFCLENBQWlCO1FBQ3RDLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDcEIsV0FBTSxHQUFOLE1BQU0sQ0FBUztRQUNmLFlBQU8sR0FBUCxPQUFPLENBQVM7UUFDaEIsaUJBQVksR0FBWixZQUFZLENBQVE7UUFDcEIsZ0JBQVcsR0FBWCxXQUFXLENBQVU7UUFDckIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFpQjtJQUN4QyxDQUFDO0lBRUosUUFBUTtRQUNOLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNuQixJQUFJLENBQUMsVUFBVTtZQUNmLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUU7WUFDaEMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRTtZQUNuQyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxFQUFFO1lBQ3JDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUU7WUFDckMs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