"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountAliasId = void 0;
const alias_hash_1 = require("./alias_hash");
class AccountAliasId {
    constructor(aliasHash, accountNonce) {
        this.aliasHash = aliasHash;
        this.accountNonce = accountNonce;
    }
    static fromAlias(alias, accountNonce, blake2s) {
        return new AccountAliasId(alias_hash_1.AliasHash.fromAlias(alias, blake2s), accountNonce);
    }
    static random() {
        return new AccountAliasId(alias_hash_1.AliasHash.random(), 0);
    }
    static fromBuffer(id) {
        if (id.length !== 32) {
            throw new Error("Invalid id buffer.");
        }
        const aliasHash = new alias_hash_1.AliasHash(id.slice(4, 32));
        const accountNonce = id.readUInt32BE(0);
        return new AccountAliasId(aliasHash, accountNonce);
    }
    toBuffer() {
        const accountNonceBuf = Buffer.alloc(4);
        accountNonceBuf.writeUInt32BE(this.accountNonce);
        return Buffer.concat([accountNonceBuf, this.aliasHash.toBuffer()]);
    }
    toString() {
        return `0x${this.toBuffer().toString("hex")}`;
    }
    equals(rhs) {
        return (this.aliasHash.equals(rhs.aliasHash) &&
            this.accountNonce === rhs.accountNonce);
    }
}
exports.AccountAliasId = AccountAliasId;
AccountAliasId.ZERO = AccountAliasId.fromBuffer(Buffer.alloc(32));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudF9hbGlhc19pZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hY2NvdW50X2lkL2FjY291bnRfYWxpYXNfaWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNkNBQXlDO0FBRXpDLE1BQWEsY0FBYztJQUd6QixZQUFtQixTQUFvQixFQUFTLFlBQW9CO1FBQWpELGNBQVMsR0FBVCxTQUFTLENBQVc7UUFBUyxpQkFBWSxHQUFaLFlBQVksQ0FBUTtJQUFHLENBQUM7SUFFeEUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFhLEVBQUUsWUFBb0IsRUFBRSxPQUFnQjtRQUNwRSxPQUFPLElBQUksY0FBYyxDQUN2QixzQkFBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEVBQ25DLFlBQVksQ0FDYixDQUFDO0lBQ0osQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNO1FBQ1gsT0FBTyxJQUFJLGNBQWMsQ0FBQyxzQkFBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFTSxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQVU7UUFDakMsSUFBSSxFQUFFLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRTtZQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDdkM7UUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqRCxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sSUFBSSxjQUFjLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRCxRQUFRO1FBQ04sTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QyxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNqRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELFFBQVE7UUFDTixPQUFPLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0lBQ2hELENBQUM7SUFFRCxNQUFNLENBQUMsR0FBbUI7UUFDeEIsT0FBTyxDQUNMLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7WUFDcEMsSUFBSSxDQUFDLFlBQVksS0FBSyxHQUFHLENBQUMsWUFBWSxDQUN2QyxDQUFDO0lBQ0osQ0FBQzs7QUF6Q0gsd0NBMENDO0FBekNRLG1CQUFJLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMifQ==