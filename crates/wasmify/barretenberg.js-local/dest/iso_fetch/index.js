"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetch = void 0;
const tslib_1 = require("tslib");
const detect_node_1 = (0, tslib_1.__importDefault)(require("detect-node"));
function fetch(input, init) {
    if (detect_node_1.default) {
        // eslint-disable-next-line
        const f = require("node-fetch").default;
        return f(input, init);
    }
    else {
        if (typeof window !== "undefined" && window.fetch)
            return window.fetch(input, init);
        if (typeof self !== "undefined" && self.fetch)
            return self.fetch(input, init);
        throw new Error("`fetch` api unavailable.");
    }
}
exports.fetch = fetch;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaXNvX2ZldGNoL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSwyRUFBaUM7QUFFakMsU0FBZ0IsS0FBSyxDQUNuQixLQUFrQixFQUNsQixJQUFrQjtJQUVsQixJQUFJLHFCQUFNLEVBQUU7UUFDViwyQkFBMkI7UUFDM0IsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUN4QyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdkI7U0FBTTtRQUNMLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQyxLQUFLO1lBQy9DLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkMsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxDQUFDLEtBQUs7WUFDM0MsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7S0FDN0M7QUFDSCxDQUFDO0FBZkQsc0JBZUMifQ==