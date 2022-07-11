"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeNote = void 0;
const address_1 = require("../address");
const bigint_buffer_1 = require("../bigint_buffer");
const serialize_1 = require("../serialize");
const viewing_key_1 = require("../viewing_key");
const derive_note_secret_1 = require("./derive_note_secret");
class TreeNote {
    constructor(ownerPubKey, value, assetId, accountRequired, noteSecret, creatorPubKey, inputNullifier) {
        this.ownerPubKey = ownerPubKey;
        this.value = value;
        this.assetId = assetId;
        this.accountRequired = accountRequired;
        this.noteSecret = noteSecret;
        this.creatorPubKey = creatorPubKey;
        this.inputNullifier = inputNullifier;
    }
    toBuffer() {
        return Buffer.concat([
            (0, bigint_buffer_1.toBufferBE)(this.value, 32),
            (0, serialize_1.numToUInt32BE)(this.assetId),
            Buffer.from([this.accountRequired ? 1 : 0]),
            this.ownerPubKey.toBuffer(),
            this.noteSecret,
            this.creatorPubKey,
            this.inputNullifier,
        ]);
    }
    createViewingKey(ephPrivKey, grumpkin) {
        const noteBuf = Buffer.concat([
            (0, bigint_buffer_1.toBufferBE)(this.value, 32),
            (0, serialize_1.numToUInt32BE)(this.assetId),
            (0, serialize_1.numToUInt32BE)(+this.accountRequired),
            this.creatorPubKey,
        ]);
        return viewing_key_1.ViewingKey.createFromEphPriv(noteBuf, this.ownerPubKey, ephPrivKey, grumpkin);
    }
    static fromBuffer(buf) {
        let dataStart = 0;
        const value = (0, bigint_buffer_1.toBigIntBE)(buf.slice(dataStart, dataStart + 32));
        dataStart += 32;
        const assetId = buf.readUInt32BE(dataStart);
        dataStart += 4;
        const accountRequired = !!buf[dataStart];
        dataStart += 1;
        const ownerPubKey = new address_1.GrumpkinAddress(buf.slice(dataStart, dataStart + 64));
        dataStart += 64;
        const noteSecret = buf.slice(dataStart, dataStart + 32);
        dataStart += 32;
        const creatorPubKey = buf.slice(dataStart, dataStart + 32);
        dataStart += 32;
        const inputNullifier = buf.slice(dataStart, dataStart + 32);
        return new TreeNote(ownerPubKey, value, assetId, accountRequired, noteSecret, creatorPubKey, inputNullifier);
    }
    /**
     * Note on how the noteSecret can be derived in two different ways (from ephPubKey or ephPrivKey):
     *
     * ownerPubKey := [ownerPrivKey] * G  (where G is a generator of the grumpkin curve, and `[scalar] * Point` is scalar multiplication).
     *                      ↑
     *         a.k.a. account private key
     *
     * ephPubKey := [ephPrivKey] * G    (where ephPrivKey is a random field element).
     *
     * sharedSecret := [ephPrivKey] * ownerPubKey = [ephPrivKey] * ([ownerPrivKey] * G) = [ownerPrivKey] * ([ephPrivKey] * G) = [ownerPrivKey] * ephPubKey
     *                  ^^^^^^^^^^                                                                                                               ^^^^^^^^^
     * noteSecret is then derivable from the sharedSecret.
     */
    static createFromEphPriv(ownerPubKey, value, assetId, accountRequired, inputNullifier, ephPrivKey, grumpkin, creatorPubKey = Buffer.alloc(32)) {
        const noteSecret = (0, derive_note_secret_1.deriveNoteSecret)(ownerPubKey, ephPrivKey, grumpkin);
        return new TreeNote(ownerPubKey, value, assetId, accountRequired, noteSecret, creatorPubKey, inputNullifier);
    }
    static createFromEphPub(ownerPubKey, value, assetId, accountRequired, inputNullifier, ephPubKey, ownerPrivKey, grumpkin, creatorPubKey = Buffer.alloc(32)) {
        const noteSecret = (0, derive_note_secret_1.deriveNoteSecret)(ephPubKey, ownerPrivKey, grumpkin);
        return new TreeNote(ownerPubKey, value, assetId, accountRequired, noteSecret, creatorPubKey, inputNullifier);
    }
    static recover({ noteBuf, noteSecret }, inputNullifier, ownerPubKey) {
        const value = (0, bigint_buffer_1.toBigIntBE)(noteBuf.slice(0, 32));
        const assetId = noteBuf.readUInt32BE(32);
        const accountRequired = !!noteBuf.readUInt32BE(36);
        const creatorPubKey = noteBuf.slice(40, 72);
        return new TreeNote(ownerPubKey, value, assetId, accountRequired, noteSecret, creatorPubKey, inputNullifier);
    }
}
exports.TreeNote = TreeNote;
TreeNote.EMPTY = new TreeNote(address_1.GrumpkinAddress.one(), BigInt(0), 0, false, Buffer.alloc(32), Buffer.alloc(32), Buffer.alloc(32));
TreeNote.SIZE = TreeNote.EMPTY.toBuffer().length;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZV9ub3RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL25vdGVfYWxnb3JpdGhtcy90cmVlX25vdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsd0NBQTZDO0FBQzdDLG9EQUEwRDtBQUUxRCw0Q0FBNkM7QUFDN0MsZ0RBQTRDO0FBRTVDLDZEQUF3RDtBQUV4RCxNQUFhLFFBQVE7SUFZbkIsWUFDUyxXQUE0QixFQUM1QixLQUFhLEVBQ2IsT0FBZSxFQUNmLGVBQXdCLEVBQ3hCLFVBQWtCLEVBQ2xCLGFBQXFCLEVBQ3JCLGNBQXNCO1FBTnRCLGdCQUFXLEdBQVgsV0FBVyxDQUFpQjtRQUM1QixVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2IsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLG9CQUFlLEdBQWYsZUFBZSxDQUFTO1FBQ3hCLGVBQVUsR0FBVixVQUFVLENBQVE7UUFDbEIsa0JBQWEsR0FBYixhQUFhLENBQVE7UUFDckIsbUJBQWMsR0FBZCxjQUFjLENBQVE7SUFDNUIsQ0FBQztJQUVKLFFBQVE7UUFDTixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbkIsSUFBQSwwQkFBVSxFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQzFCLElBQUEseUJBQWEsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFO1lBQzNCLElBQUksQ0FBQyxVQUFVO1lBQ2YsSUFBSSxDQUFDLGFBQWE7WUFDbEIsSUFBSSxDQUFDLGNBQWM7U0FDcEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGdCQUFnQixDQUFDLFVBQWtCLEVBQUUsUUFBa0I7UUFDckQsTUFBTSxPQUFPLEdBQUcs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