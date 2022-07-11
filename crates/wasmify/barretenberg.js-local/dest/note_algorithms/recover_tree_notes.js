"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverTreeNotes = void 0;
const address_1 = require("../address");
const log_1 = require("../log");
const grumpkin_1 = require("../ecc/grumpkin");
const tree_note_1 = require("./tree_note");
const debug = (0, log_1.createDebugLogger)("recover_tree_notes");
const recoverTreeNotes = (decryptedNotes, inputNullifiers, noteCommitments, privateKey, grumpkin, noteAlgorithms) => {
    const ownerPubKey = new address_1.GrumpkinAddress(grumpkin.mul(grumpkin_1.Grumpkin.one, privateKey));
    return decryptedNotes.map((decrypted, i) => {
        if (!decrypted) {
            debug(`index ${i}: no decrypted tree note.`);
            return;
        }
        const noteCommitment = noteCommitments[i];
        const inputNullifier = inputNullifiers[i];
        const note = tree_note_1.TreeNote.recover(decrypted, inputNullifier, ownerPubKey);
        debug({ note });
        const commitment = noteAlgorithms.valueNoteCommitment(note);
        if (commitment.equals(noteCommitment)) {
            debug(`index ${i}: tree commitment ${noteCommitment.toString("hex")} matches note version 1.`);
            return note;
        }
        debug(`index ${i}: tree commitment ${noteCommitment.toString("hex")} != encrypted note commitment ${commitment.toString("hex")}.`);
    });
};
exports.recoverTreeNotes = recoverTreeNotes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3Zlcl90cmVlX25vdGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL25vdGVfYWxnb3JpdGhtcy9yZWNvdmVyX3RyZWVfbm90ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsd0NBQTZDO0FBQzdDLGdDQUEyQztBQUMzQyw4Q0FBMkM7QUFHM0MsMkNBQXVDO0FBRXZDLE1BQU0sS0FBSyxHQUFHLElBQUEsdUJBQWlCLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUUvQyxNQUFNLGdCQUFnQixHQUFHLENBQzlCLGNBQTZDLEVBQzdDLGVBQXlCLEVBQ3pCLGVBQXlCLEVBQ3pCLFVBQWtCLEVBQ2xCLFFBQWtCLEVBQ2xCLGNBQThCLEVBQzlCLEVBQUU7SUFDRixNQUFNLFdBQVcsR0FBRyxJQUFJLHlCQUFlLENBQ3JDLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUJBQVEsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQ3ZDLENBQUM7SUFDRixPQUFPLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDekMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLEtBQUssQ0FBQyxTQUFTLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUM3QyxPQUFPO1NBQ1I7UUFFRCxNQUFNLGNBQWMsR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUMsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTFDLE1BQU0sSUFBSSxHQUFHLG9CQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDdEUsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNoQixNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUQsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQ3JDLEtBQUssQ0FDSCxTQUFTLENBQUMscUJBQXFCLGNBQWMsQ0FBQyxRQUFRLENBQ3BELEtBQUssQ0FDTiwwQkFBMEIsQ0FDNUIsQ0FBQztZQUNGLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxLQUFLLENBQ0gsU0FBUyxDQUFDLHFCQUFxQixjQUFjLENBQUMsUUFBUSxDQUNwRCxLQUFLLENBQ04saUNBQWlDLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FDaEUsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDO0FBckNXLFFBQUEsZ0JBQWdCLG9CQXFDM0IifQ==