"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffchainJoinSplitData = void 0;
const serialize_1 = require("../serialize");
const viewing_key_1 = require("../viewing_key");
class OffchainJoinSplitData {
    constructor(viewingKeys, txRefNo = 0) {
        this.viewingKeys = viewingKeys;
        this.txRefNo = txRefNo;
        if (viewingKeys.length !== 2) {
            throw new Error(`Expect 2 viewing keys. Received ${viewingKeys.length}.`);
        }
        if (viewingKeys.some((vk) => vk.isEmpty())) {
            throw new Error("Viewing key cannot be empty.");
        }
    }
    static fromBuffer(buf) {
        if (buf.length !== OffchainJoinSplitData.SIZE) {
            throw new Error("Invalid buffer size.");
        }
        let dataStart = 0;
        const viewingKey0 = new viewing_key_1.ViewingKey(buf.slice(dataStart, dataStart + viewing_key_1.ViewingKey.SIZE));
        dataStart += viewing_key_1.ViewingKey.SIZE;
        const viewingKey1 = new viewing_key_1.ViewingKey(buf.slice(dataStart, dataStart + viewing_key_1.ViewingKey.SIZE));
        dataStart += viewing_key_1.ViewingKey.SIZE;
        const txRefNo = buf.readUInt32BE(dataStart);
        return new OffchainJoinSplitData([viewingKey0, viewingKey1], txRefNo);
    }
    toBuffer() {
        return Buffer.concat([
            ...this.viewingKeys.map((k) => k.toBuffer()),
            (0, serialize_1.numToUInt32BE)(this.txRefNo),
        ]);
    }
}
exports.OffchainJoinSplitData = OffchainJoinSplitData;
OffchainJoinSplitData.EMPTY = new OffchainJoinSplitData([
    new viewing_key_1.ViewingKey(Buffer.alloc(viewing_key_1.ViewingKey.SIZE)),
    new viewing_key_1.ViewingKey(Buffer.alloc(viewing_key_1.ViewingKey.SIZE)),
]);
OffchainJoinSplitData.SIZE = OffchainJoinSplitData.EMPTY.toBuffer().length;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2ZmY2hhaW5fam9pbl9zcGxpdF9kYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29mZmNoYWluX3R4X2RhdGEvb2ZmY2hhaW5fam9pbl9zcGxpdF9kYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDRDQUE2QztBQUM3QyxnREFBNEM7QUFFNUMsTUFBYSxxQkFBcUI7SUFPaEMsWUFDa0IsV0FBeUIsRUFDekIsVUFBVSxDQUFDO1FBRFgsZ0JBQVcsR0FBWCxXQUFXLENBQWM7UUFDekIsWUFBTyxHQUFQLE9BQU8sQ0FBSTtRQUUzQixJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1NBQzNFO1FBQ0QsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRTtZQUMxQyxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7U0FDakQ7SUFDSCxDQUFDO0lBRUQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFXO1FBQzNCLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUU7WUFDN0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1NBQ3pDO1FBRUQsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLE1BQU0sV0FBVyxHQUFHLElBQUksd0JBQVUsQ0FDaEMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxHQUFHLHdCQUFVLENBQUMsSUFBSSxDQUFDLENBQ2xELENBQUM7UUFDRixTQUFTLElBQUksd0JBQVUsQ0FBQyxJQUFJLENBQUM7UUFDN0IsTUFBTSxXQUFXLEdBQUcsSUFBSSx3QkFBVSxDQUNoQyxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLEdBQUcsd0JBQVUsQ0FBQyxJQUFJLENBQUMsQ0FDbEQsQ0FBQztRQUNGLFNBQVMsSUFBSSx3QkFBVSxDQUFDLElBQUksQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLE9BQU8sSUFBSSxxQkFBcUIsQ0FBQyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQsUUFBUTtRQUNOLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNuQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDNUMsSUFBQSx5QkFBYSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQzs7QUExQ0gsc0RBMkNDO0FBMUNRLDJCQUFLLEdBQUcsSUFBSSxxQkFBcUIsQ0FBQztJQUN2QyxJQUFJLHdCQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyx3QkFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdDLElBQUksd0JBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLHdCQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDOUMsQ0FBQyxDQUFDO0FBQ0ksMEJBQUksR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDIn0=