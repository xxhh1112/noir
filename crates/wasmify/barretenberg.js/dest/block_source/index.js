"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const tslib_1 = require("tslib");
const serialize_1 = require("../serialize");
const blockchain_1 = require("../blockchain");
const defi_interaction_event_1 = require("./defi_interaction_event");
class Block {
    constructor(txHash, created, rollupId, rollupSize, encodedRollupProofData, offchainTxData, interactionResult, gasUsed, gasPrice, subtreeRoot) {
        this.txHash = txHash;
        this.created = created;
        this.rollupId = rollupId;
        this.rollupSize = rollupSize;
        this.encodedRollupProofData = encodedRollupProofData;
        this.offchainTxData = offchainTxData;
        this.interactionResult = interactionResult;
        this.gasUsed = gasUsed;
        this.gasPrice = gasPrice;
        this.subtreeRoot = subtreeRoot;
    }
    static deserialize(buf, offset = 0) {
        const des = new serialize_1.Deserializer(buf, offset);
        const txHash = des.exec(blockchain_1.TxHash.deserialize);
        const created = des.date();
        const rollupId = des.uInt32();
        const rollupSize = des.uInt32();
        const rollupProofData = des.vector();
        const offchainTxData = des.deserializeArray(serialize_1.deserializeBufferFromVector);
        const interactionResult = des.deserializeArray(defi_interaction_event_1.DefiInteractionEvent.deserialize);
        const gasUsed = des.uInt32();
        const gasPrice = des.bigInt();
        const subtreeRoot = des.vector();
        return {
            elem: new Block(txHash, created, rollupId, rollupSize, rollupProofData, offchainTxData, interactionResult, gasUsed, gasPrice, subtreeRoot.equals(Buffer.alloc(0)) ? undefined : subtreeRoot),
            adv: des.getOffset() - offset,
        };
    }
    static fromBuffer(buf) {
        return Block.deserialize(buf).elem;
    }
    toBuffer() {
        var _a;
        return Buffer.concat([
            this.txHash.toBuffer(),
            (0, serialize_1.serializeDate)(this.created),
            (0, serialize_1.numToUInt32BE)(this.rollupId),
            (0, serialize_1.numToUInt32BE)(this.rollupSize),
            (0, serialize_1.serializeBufferToVector)(this.encodedRollupProofData),
            (0, serialize_1.serializeBufferArrayToVector)(this.offchainTxData.map((b) => (0, serialize_1.serializeBufferToVector)(b))),
            (0, serialize_1.serializeBufferArrayToVector)(this.interactionResult.map((b) => b.toBuffer())),
            (0, serialize_1.numToUInt32BE)(this.gasUsed),
            (0, serialize_1.serializeBigInt)(this.gasPrice),
            (0, serialize_1.serializeBufferToVector)((_a = this.subtreeRoot) !== null && _a !== void 0 ? _a : Buffer.alloc(0)),
        ]);
    }
}
exports.Block = Block;
(0, tslib_1.__exportStar)(require("./server_block_source"), exports);
(0, tslib_1.__exportStar)(require("./defi_interaction_event"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYmxvY2tfc291cmNlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSw0Q0FRc0I7QUFDdEIsOENBQXVDO0FBQ3ZDLHFFQUFnRTtBQUdoRSxNQUFhLEtBQUs7SUFDaEIsWUFDUyxNQUFjLEVBQ2QsT0FBYSxFQUNiLFFBQWdCLEVBQ2hCLFVBQWtCLEVBQ2xCLHNCQUE4QixFQUM5QixjQUF3QixFQUN4QixpQkFBeUMsRUFDekMsT0FBZSxFQUNmLFFBQWdCLEVBQ2hCLFdBQW9CO1FBVHBCLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDZCxZQUFPLEdBQVAsT0FBTyxDQUFNO1FBQ2IsYUFBUSxHQUFSLFFBQVEsQ0FBUTtRQUNoQixlQUFVLEdBQVYsVUFBVSxDQUFRO1FBQ2xCLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBUTtRQUM5QixtQkFBYyxHQUFkLGNBQWMsQ0FBVTtRQUN4QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXdCO1FBQ3pDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixhQUFRLEdBQVIsUUFBUSxDQUFRO1FBQ2hCLGdCQUFXLEdBQVgsV0FBVyxDQUFTO0lBQzFCLENBQUM7SUFFSixNQUFNLENBQUMsV0FBVyxDQUFDLEdBQVcsRUFBRSxNQUFNLEdBQUcsQ0FBQztRQUN4QyxNQUFNLEdBQUcsR0FBRyxJQUFJLHdCQUFZLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsbUJBQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM1QyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDM0IsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzlCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckMsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLHVDQUEyQixDQUFDLENBQUM7UUFDekUsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQzVDLDZDQUFvQixDQUFDLFdBQVcsQ0FDakMsQ0FBQztRQUNGLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUM3QixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDOUIsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2pDLE9BQU87WUFDTCxJQUFJLEVBQUUsSUFBSSxLQUFLLENBQ2IsTUFBTSxFQUNOLE9BQU8sRUFDUCxRQUFRLEVBQ1IsVUFBVSxFQUNWLGVBQWUsRUFDZixjQUFjLEVBQ2QsaUJBQWlCLEVBQ2pCLE9BQU8sRUFDUCxRQUFRLEVBQ1IsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUM5RDtZQUNELEdBQUcsRUFBRSxHQUFHLENBQUMsU0FBUyxFQUFFLEdBQUcsTUFBTTtTQUM5QixDQUFDO0lBQ0osQ0FBQztJQUVELE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBVztRQUMzQixPQUFPLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3JDLENBQUM7SUFFRCxRQUFROztRQUNOLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNuQixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUN0QixJQUFBLHlCQUFhLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUMzQixJQUFBLHlCQUFhLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUM1QixJQUFBLHlCQUFhLEVBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUM5QixJQUFBLG1DQUF1QixFQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztZQUNwRCxJQUFBLHdDQUE0QixFQUMxQixJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBQSxtQ0FBdUIsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUMzRDtZQUNELElBQUEsd0NBQTRCLEVBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUNoRDtZQUNELElBQUEseUJBQWEsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzNCLElBQUEsMkJBQWUsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQzlCLElBQUEsbUNBQXVCLEVBQUMsTUFBQSxJQUFJLENBQUMsV0FBVyxtQ0FBSSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzdELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQW5FRCxzQkFtRUM7QUF5QkQscUVBQXNDO0FBQ3RDLHdFQUF5QyJ9