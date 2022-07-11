"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountId = void 0;
const address_1 = require("../address");
class AccountId {
    constructor(publicKey, accountNonce) {
        this.publicKey = publicKey;
        this.accountNonce = accountNonce;
    }
    static fromBuffer(id) {
        if (id.length !== 68) {
            throw new Error("Invalid id buffer.");
        }
        const publicKey = new address_1.GrumpkinAddress(id.slice(0, 64));
        const accountNonce = id.readUInt32BE(64);
        return new AccountId(publicKey, accountNonce);
    }
    static fromString(idStr) {
        const [match, publicKeyStr, accountNonceStr] = idStr.match(/^0x([0-9a-f]{128}) \(([0-9]+)\)$/i) || [];
        if (!match) {
            throw new Error("Invalid id string.");
        }
        const publicKey = address_1.GrumpkinAddress.fromString(publicKeyStr);
        return new AccountId(publicKey, +accountNonceStr);
    }
    static random() {
        const randomNonce = Math.floor(Math.random() * 2 ** 32);
        return new AccountId(address_1.GrumpkinAddress.random(), randomNonce);
    }
    equals(rhs) {
        return this.toBuffer().equals(rhs.toBuffer());
    }
    toBuffer() {
        const accountNonceBuf = Buffer.alloc(4);
        accountNonceBuf.writeUInt32BE(this.accountNonce);
        return Buffer.concat([this.publicKey.toBuffer(), accountNonceBuf]);
    }
    toString() {
        return `${this.publicKey.toString()} (${this.accountNonce})`;
    }
    toShortString() {
        return `${this.publicKey.toString().slice(0, 10)}/${this.accountNonce}`;
    }
}
exports.AccountId = AccountId;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudF9pZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hY2NvdW50X2lkL2FjY291bnRfaWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsd0NBQTZDO0FBRTdDLE1BQWEsU0FBUztJQUNwQixZQUFtQixTQUEwQixFQUFTLFlBQW9CO1FBQXZELGNBQVMsR0FBVCxTQUFTLENBQWlCO1FBQVMsaUJBQVksR0FBWixZQUFZLENBQVE7SUFBRyxDQUFDO0lBRXZFLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBVTtRQUNqQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssRUFBRSxFQUFFO1lBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztTQUN2QztRQUVELE1BQU0sU0FBUyxHQUFHLElBQUkseUJBQWUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDekMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVNLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBYTtRQUNwQyxNQUFNLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsR0FDMUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6RCxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1NBQ3ZDO1FBRUQsTUFBTSxTQUFTLEdBQUcseUJBQWUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDM0QsT0FBTyxJQUFJLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0sTUFBTSxDQUFDLE1BQU07UUFDbEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELE9BQU8sSUFBSSxTQUFTLENBQUMseUJBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQWM7UUFDbkIsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRCxRQUFRO1FBQ04sTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QyxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNqRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELFFBQVE7UUFDTixPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUM7SUFDL0QsQ0FBQztJQUVELGFBQWE7UUFDWCxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUMxRSxDQUFDO0NBQ0Y7QUE5Q0QsOEJBOENDIn0=