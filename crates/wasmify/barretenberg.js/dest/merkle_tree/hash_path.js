"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashPath = void 0;
const serialize_1 = require("../serialize");
class HashPath {
    constructor(data = []) {
        this.data = data;
    }
    toBuffer() {
        const elements = this.data.map((nodes) => Buffer.concat([nodes[0], nodes[1]]));
        return (0, serialize_1.serializeBufferArrayToVector)(elements);
    }
    static fromBuffer(buf, offset = 0) {
        const { elem } = HashPath.deserialize(buf, offset);
        return elem;
    }
    static deserialize(buf, offset = 0) {
        const deserializePath = (buf, offset) => ({
            elem: [
                buf.slice(offset, offset + 32),
                buf.slice(offset + 32, offset + 64),
            ],
            adv: 64,
        });
        const { elem, adv } = (0, serialize_1.deserializeArrayFromVector)(deserializePath, buf, offset);
        return { elem: new HashPath(elem), adv };
    }
}
exports.HashPath = HashPath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzaF9wYXRoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21lcmtsZV90cmVlL2hhc2hfcGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw0Q0FHc0I7QUFFdEIsTUFBYSxRQUFRO0lBQ25CLFlBQW1CLE9BQW1CLEVBQUU7UUFBckIsU0FBSSxHQUFKLElBQUksQ0FBaUI7SUFBRyxDQUFDO0lBRXJDLFFBQVE7UUFDYixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQ3ZDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDcEMsQ0FBQztRQUNGLE9BQU8sSUFBQSx3Q0FBNEIsRUFBQyxRQUFRLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFXLEVBQUUsTUFBTSxHQUFHLENBQUM7UUFDdkMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBVyxFQUFFLE1BQU0sR0FBRyxDQUFDO1FBQ3hDLE1BQU0sZUFBZSxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4QyxJQUFJLEVBQUU7Z0JBQ0osR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQztnQkFDOUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUM7YUFDcEM7WUFDRCxHQUFHLEVBQUUsRUFBRTtTQUNSLENBQUMsQ0FBQztRQUNILE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBQSxzQ0FBMEIsRUFDOUMsZUFBZSxFQUNmLEdBQUcsRUFDSCxNQUFNLENBQ1AsQ0FBQztRQUNGLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDM0MsQ0FBQztDQUNGO0FBOUJELDRCQThCQyJ9