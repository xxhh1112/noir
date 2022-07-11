"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packInteractionNotes = exports.computeInteractionHashes = exports.DefiInteractionNote = void 0;
const crypto_1 = require("crypto");
const bigint_buffer_1 = require("../bigint_buffer");
const bridge_id_1 = require("../bridge_id");
const crypto_2 = require("../crypto");
const serialize_1 = require("../serialize");
class DefiInteractionNote {
    constructor(bridgeId, nonce, totalInputValue, totalOutputValueA, totalOutputValueB, result) {
        this.bridgeId = bridgeId;
        this.nonce = nonce;
        this.totalInputValue = totalInputValue;
        this.totalOutputValueA = totalOutputValueA;
        this.totalOutputValueB = totalOutputValueB;
        this.result = result;
    }
    static deserialize(buffer, offset) {
        const des = new serialize_1.Deserializer(buffer, offset);
        const bridgeIdBuffer = des.buffer(32);
        const bridgeId = bridge_id_1.BridgeId.fromBuffer(bridgeIdBuffer);
        const totalInputValue = des.bigInt();
        const totalOutputValueA = des.bigInt();
        const totalOutputValueB = des.bigInt();
        const nonce = des.uInt32();
        const result = des.bool();
        return {
            elem: new DefiInteractionNote(bridgeId, nonce, totalInputValue, totalOutputValueA, totalOutputValueB, result),
            adv: des.getOffset() - offset,
        };
    }
    static random() {
        return new DefiInteractionNote(bridge_id_1.BridgeId.random(), (0, crypto_2.randomBytes)(4).readUInt32BE(0), (0, bigint_buffer_1.toBigIntBE)((0, crypto_2.randomBytes)(32)), (0, bigint_buffer_1.toBigIntBE)((0, crypto_2.randomBytes)(32)), (0, bigint_buffer_1.toBigIntBE)((0, crypto_2.randomBytes)(32)), !!Math.round(Math.random()));
    }
    static fromBuffer(buf) {
        return DefiInteractionNote.deserialize(buf, 0).elem;
    }
    toBuffer() {
        const serializer = new serialize_1.Serializer();
        serializer.buffer(this.bridgeId.toBuffer());
        serializer.bigInt(this.totalInputValue);
        serializer.bigInt(this.totalOutputValueA);
        serializer.bigInt(this.totalOutputValueB);
        serializer.uInt32(this.nonce);
        serializer.bool(this.result);
        return serializer.getBuffer();
    }
    equals(note) {
        return this.toBuffer().equals(note.toBuffer());
    }
}
exports.DefiInteractionNote = DefiInteractionNote;
DefiInteractionNote.EMPTY = new DefiInteractionNote(bridge_id_1.BridgeId.ZERO, 0, BigInt(0), BigInt(0), BigInt(0), false);
DefiInteractionNote.groupModulus = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const computeInteractionHashes = (notes, padTo = notes.length) => {
    notes = [
        ...notes,
        ...Array(padTo - notes.length).fill(DefiInteractionNote.EMPTY),
    ];
    const hash = notes.map((note) => (0, crypto_1.createHash)("sha256")
        .update(Buffer.concat([
        note.bridgeId.toBuffer(),
        (0, serialize_1.numToUInt32BE)(note.nonce, 32),
        (0, bigint_buffer_1.toBufferBE)(note.totalInputValue, 32),
        (0, bigint_buffer_1.toBufferBE)(note.totalOutputValueA, 32),
        (0, bigint_buffer_1.toBufferBE)(note.totalOutputValueB, 32),
        Buffer.alloc(31),
        Buffer.from([+note.result]),
    ]))
        .digest());
    return hash.map((h) => (0, bigint_buffer_1.toBufferBE)(BigInt("0x" + h.toString("hex")) % DefiInteractionNote.groupModulus, 32));
};
exports.computeInteractionHashes = computeInteractionHashes;
const packInteractionNotes = (notes, padTo = notes.length) => {
    const hash = (0, crypto_1.createHash)("sha256")
        .update(Buffer.concat((0, exports.computeInteractionHashes)(notes, padTo)))
        .digest();
    return (0, bigint_buffer_1.toBufferBE)(BigInt("0x" + hash.toString("hex")) % DefiInteractionNote.groupModulus, 32);
};
exports.packInteractionNotes = packInteractionNotes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaV9pbnRlcmFjdGlvbl9ub3RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL25vdGVfYWxnb3JpdGhtcy9kZWZpX2ludGVyYWN0aW9uX25vdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW9DO0FBQ3BDLG9EQUEwRDtBQUMxRCw0Q0FBd0M7QUFDeEMsc0NBQXdDO0FBQ3hDLDRDQUF1RTtBQUV2RSxNQUFhLG1CQUFtQjtJQWE5QixZQUNrQixRQUFrQixFQUNsQixLQUFhLEVBQ2IsZUFBdUIsRUFDdkIsaUJBQXlCLEVBQ3pCLGlCQUF5QixFQUN6QixNQUFlO1FBTGYsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUNsQixVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2Isb0JBQWUsR0FBZixlQUFlLENBQVE7UUFDdkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFRO1FBQ3pCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtRQUN6QixXQUFNLEdBQU4sTUFBTSxDQUFTO0lBQzlCLENBQUM7SUFFSixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQWMsRUFBRSxNQUFjO1FBQy9DLE1BQU0sR0FBRyxHQUFHLElBQUksd0JBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDN0MsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0QyxNQUFNLFFBQVEsR0FBRyxvQkFBUSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNyRCxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckMsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkMsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkMsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzNCLE1B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