"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deserializer = void 0;
const free_funcs_1 = require("./free_funcs");
class Deserializer {
    constructor(buf, offset = 0) {
        this.buf = buf;
        this.offset = offset;
    }
    bool() {
        return this.exec(free_funcs_1.deserializeBool) ? true : false;
    }
    uInt32() {
        return this.exec(free_funcs_1.deserializeUInt32);
    }
    int32() {
        return this.exec(free_funcs_1.deserializeInt32);
    }
    bigInt(width = 32) {
        return this.exec((buf, offset) => (0, free_funcs_1.deserializeBigInt)(buf, offset, width));
    }
    vector() {
        return this.exec(free_funcs_1.deserializeBufferFromVector);
    }
    buffer(width) {
        const buf = this.buf.slice(this.offset, this.offset + width);
        this.offset += width;
        return buf;
    }
    string() {
        return this.vector().toString();
    }
    date() {
        return new Date(Number(this.bigInt(8)));
    }
    deserializeArray(fn) {
        return this.exec((buf, offset) => (0, free_funcs_1.deserializeArrayFromVector)(fn, buf, offset));
    }
    exec(fn) {
        const { elem, adv } = fn(this.buf, this.offset);
        this.offset += adv;
        return elem;
    }
    getOffset() {
        return this.offset;
    }
}
exports.Deserializer = Deserializer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVzZXJpYWxpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcmlhbGl6ZS9kZXNlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBT3NCO0FBT3RCLE1BQWEsWUFBWTtJQUN2QixZQUFvQixHQUFXLEVBQVUsU0FBUyxDQUFDO1FBQS9CLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFJO0lBQUcsQ0FBQztJQUVoRCxJQUFJO1FBQ1QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLDRCQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDbkQsQ0FBQztJQUVNLE1BQU07UUFDWCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsOEJBQWlCLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU0sS0FBSztRQUNWLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBZ0IsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFTSxNQUFNLENBQUMsS0FBSyxHQUFHLEVBQUU7UUFDdEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBVyxFQUFFLE1BQWMsRUFBRSxFQUFFLENBQy9DLElBQUEsOEJBQWlCLEVBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FDdEMsQ0FBQztJQUNKLENBQUM7SUFFTSxNQUFNO1FBQ1gsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLHdDQUEyQixDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVNLE1BQU0sQ0FBQyxLQUFhO1FBQ3pCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQztRQUNyQixPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFTSxNQUFNO1FBQ1gsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVNLElBQUk7UUFDVCxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sZ0JBQWdCLENBQUksRUFBb0I7UUFDN0MsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBVyxFQUFFLE1BQWMsRUFBRSxFQUFFLENBQy9DLElBQUEsdUNBQTBCLEVBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FDNUMsQ0FBQztJQUNKLENBQUM7SUFFTSxJQUFJLENBQUksRUFBb0I7UUFDakMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUM7UUFDbkIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sU0FBUztRQUNkLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0NBQ0Y7QUF0REQsb0NBc0RDIn0=