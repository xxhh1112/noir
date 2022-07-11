"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchnorrSignature = void 0;
const random_1 = require("../random");
class SchnorrSignature {
    constructor(buffer) {
        this.buffer = buffer;
        if (buffer.length !== SchnorrSignature.SIZE) {
            throw new Error("Invalid signature buffer.");
        }
    }
    static isSignature(signature) {
        return /^(0x)?[0-9a-f]{128}$/i.test(signature);
    }
    static fromString(signature) {
        if (!SchnorrSignature.isSignature(signature)) {
            throw new Error(`Invalid signature string: ${signature}`);
        }
        return new SchnorrSignature(Buffer.from(signature.replace(/^0x/i, ""), "hex"));
    }
    static randomSignature() {
        return new SchnorrSignature((0, random_1.randomBytes)(64));
    }
    s() {
        return this.buffer.slice(0, 32);
    }
    e() {
        return this.buffer.slice(32);
    }
    toBuffer() {
        return this.buffer;
    }
    toString() {
        return `0x${this.buffer.toString("hex")}`;
    }
}
exports.SchnorrSignature = SchnorrSignature;
SchnorrSignature.SIZE = 64;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmF0dXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NyeXB0by9zY2hub3JyL3NpZ25hdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxzQ0FBd0M7QUFFeEMsTUFBYSxnQkFBZ0I7SUFHM0IsWUFBb0IsTUFBYztRQUFkLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDaEMsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLGdCQUFnQixDQUFDLElBQUksRUFBRTtZQUMzQyxNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7U0FDOUM7SUFDSCxDQUFDO0lBRU0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFpQjtRQUN6QyxPQUFPLHVCQUF1QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFpQjtRQUN4QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLFNBQVMsRUFBRSxDQUFDLENBQUM7U0FDM0Q7UUFDRCxPQUFPLElBQUksZ0JBQWdCLENBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQ2xELENBQUM7SUFDSixDQUFDO0lBRU0sTUFBTSxDQUFDLGVBQWU7UUFDM0IsT0FBTyxJQUFJLGdCQUFnQixDQUFDLElBQUEsb0JBQVcsRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxDQUFDO1FBQ0MsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELENBQUM7UUFDQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7SUFDNUMsQ0FBQzs7QUF4Q0gsNENBeUNDO0FBeENlLHFCQUFJLEdBQUcsRUFBRSxDQUFDIn0=