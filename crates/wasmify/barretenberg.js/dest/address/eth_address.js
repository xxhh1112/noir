"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthAddress = void 0;
const sha3_1 = require("sha3");
const crypto_1 = require("../crypto");
const hash = new sha3_1.Keccak(256);
/**
 * Takes a string hex input e.g. `deadbeef` and returns the same.
 */
function sha3(input) {
    hash.reset();
    hash.update(input);
    return hash.digest("hex");
}
class EthAddress {
    constructor(buffer) {
        this.buffer = buffer;
        if (buffer.length === 32) {
            if (!buffer.slice(0, 12).equals(Buffer.alloc(12))) {
                throw new Error("Invalid address buffer.");
            }
            else {
                this.buffer = buffer.slice(12);
            }
        }
        else if (buffer.length !== 20) {
            throw new Error("Invalid address buffer.");
        }
    }
    static fromString(address) {
        if (!EthAddress.isAddress(address)) {
            throw new Error(`Invalid address string: ${address}`);
        }
        return new EthAddress(Buffer.from(address.replace(/^0x/i, ""), "hex"));
    }
    static random() {
        return new EthAddress((0, crypto_1.randomBytes)(20));
    }
    static isAddress(address) {
        if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
            // Does not have the basic requirements of an address.
            return false;
        }
        else if (/^(0x|0X)?[0-9a-f]{40}$/.test(address) ||
            /^(0x|0X)?[0-9A-F]{40}$/.test(address)) {
            // It's ALL lowercase or ALL upppercase.
            return true;
        }
        else {
            return EthAddress.checkAddressChecksum(address);
        }
    }
    isZero() {
        return this.equals(EthAddress.ZERO);
    }
    static checkAddressChecksum(address) {
        address = address.replace(/^0x/i, "");
        const addressHash = sha3(address.toLowerCase());
        for (let i = 0; i < 40; i++) {
            // The nth letter should be uppercase if the nth digit of casemap is 1.
            if ((parseInt(addressHash[i], 16) > 7 &&
                address[i].toUpperCase() !== address[i]) ||
                (parseInt(addressHash[i], 16) <= 7 &&
                    address[i].toLowerCase() !== address[i])) {
                return false;
            }
        }
        return true;
    }
    static toChecksumAddress(address) {
        if (!EthAddress.isAddress(address)) {
            throw new Error("Invalid address string.");
        }
        address = address.toLowerCase().replace(/^0x/i, "");
        const addressHash = sha3(address);
        let checksumAddress = "0x";
        for (let i = 0; i < address.length; i++) {
            // If ith character is 9 to f then make it uppercase.
            if (parseInt(addressHash[i], 16) > 7) {
                checksumAddress += address[i].toUpperCase();
            }
            else {
                checksumAddress += address[i];
            }
        }
        return checksumAddress;
    }
    equals(rhs) {
        return this.buffer.equals(rhs.toBuffer());
    }
    toString() {
        return EthAddress.toChecksumAddress(this.buffer.toString("hex"));
    }
    toBuffer() {
        return this.buffer;
    }
    toBuffer32() {
        const buffer = Buffer.alloc(32);
        this.buffer.copy(buffer, 12);
        return buffer;
    }
}
exports.EthAddress = EthAddress;
EthAddress.ZERO = new EthAddress(Buffer.alloc(20));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXRoX2FkZHJlc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYWRkcmVzcy9ldGhfYWRkcmVzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBOEI7QUFDOUIsc0NBQXdDO0FBRXhDLE1BQU0sSUFBSSxHQUFHLElBQUksYUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBRTdCOztHQUVHO0FBQ0gsU0FBUyxJQUFJLENBQUMsS0FBYTtJQUN6QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDYixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBVUQsTUFBYSxVQUFVO0lBR3JCLFlBQW9CLE1BQWM7UUFBZCxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBQ2hDLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxFQUFFLEVBQUU7WUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2pELE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQzthQUM1QztpQkFBTTtnQkFDTCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDaEM7U0FDRjthQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxFQUFFLEVBQUU7WUFDL0IsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1NBQzVDO0lBQ0gsQ0FBQztJQUVNLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBZTtRQUN0QyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNsQyxNQUFNLElBQUks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