"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchDecryptNotes = void 0;
const address_1 = require("../address");
const viewing_key_1 = require("../viewing_key");
const derive_note_secret_1 = require("./derive_note_secret");
const batchDecryptNotes = async (viewingKeys, privateKey, noteDecryptor, grumpkin) => {
    const decryptedNoteLength = 73;
    const dataBuf = await noteDecryptor.batchDecryptNotes(viewingKeys, privateKey);
    const notes = [];
    // For each note in the buffer of decrypted notes.
    for (let i = 0, startIndex = 0; startIndex < dataBuf.length; ++i, startIndex += decryptedNoteLength) {
        // Slice the individual note out the buffer.
        const noteBuf = dataBuf.slice(startIndex, startIndex + decryptedNoteLength);
        // If we sliced some data, and the "successfully decrypted" byte is set...
        if (noteBuf.length > 0 && noteBuf[0]) {
            // Extract the ephemeral public key from the end of viewing key data.
            const ephPubKey = new address_1.GrumpkinAddress(viewingKeys.slice((i + 1) * viewing_key_1.ViewingKey.SIZE - 64, (i + 1) * viewing_key_1.ViewingKey.SIZE));
            const noteSecret = (0, derive_note_secret_1.deriveNoteSecret)(ephPubKey, privateKey, grumpkin);
            notes[i] = { noteBuf: noteBuf.slice(1), ephPubKey, noteSecret };
        }
    }
    return notes;
};
exports.batchDecryptNotes = batchDecryptNotes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmF0Y2hfZGVjcnlwdF9ub3Rlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ub3RlX2FsZ29yaXRobXMvYmF0Y2hfZGVjcnlwdF9ub3Rlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBNkM7QUFFN0MsZ0RBQTRDO0FBRTVDLDZEQUF3RDtBQUdqRCxNQUFNLGlCQUFpQixHQUFHLEtBQUssRUFDcEMsV0FBbUIsRUFDbkIsVUFBa0IsRUFDbEIsYUFBNEIsRUFDNUIsUUFBa0IsRUFDbEIsRUFBRTtJQUNGLE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0lBQy9CLE1BQU0sT0FBTyxHQUFHLE1BQU0sYUFBYSxDQUFDLGlCQUFpQixDQUNuRCxXQUFXLEVBQ1gsVUFBVSxDQUNYLENBQUM7SUFDRixNQUFNLEtBQUssR0FBa0MsRUFBRSxDQUFDO0lBRWhELGtEQUFrRDtJQUNsRCxLQUNFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxVQUFVLEdBQUcsQ0FBQyxFQUN6QixVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFDM0IsRUFBRSxDQUFDLEVBQUUsVUFBVSxJQUFJLG1CQUFtQixFQUN0QztRQUNBLDRDQUE0QztRQUM1QyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxVQUFVLEdBQUcsbUJBQW1CLENBQUMsQ0FBQztRQUU1RSwwRUFBMEU7UUFDMUUsSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDcEMscUVBQXFFO1lBQ3JFLE1BQU0sU0FBUyxHQUFHLElBQUkseUJBQWUsQ0FDbkMsV0FBVyxDQUFDLEtBQUssQ0FDZixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyx3QkFBVSxDQUFDLElBQUksR0FBRyxFQUFFLEVBQzlCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLHdCQUFVLENBQUMsSUFBSSxDQUMxQixDQUNGLENBQUM7WUFDRixNQUFNLFVBQVUsR0FBRyxJQUFBLHFDQUFnQixFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDckUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxDQUFDO1NBQ2pFO0tBQ0Y7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMsQ0FBQztBQXBDVyxRQUFBLGlCQUFpQixxQkFvQzVCIn0=