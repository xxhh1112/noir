"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bridgeConfigFromJson = exports.bridgeConfigToJson = void 0;
const bridgeConfigToJson = ({ bridgeId, ...rest }) => ({
    ...rest,
    bridgeId: bridgeId.toString(),
});
exports.bridgeConfigToJson = bridgeConfigToJson;
const bridgeConfigFromJson = ({ bridgeId, ...rest }) => ({
    ...rest,
    bridgeId: BigInt(bridgeId),
});
exports.bridgeConfigFromJson = bridgeConfigFromJson;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJpZGdlX2NvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xsdXBfcHJvdmlkZXIvYnJpZGdlX2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFnQk8sTUFBTSxrQkFBa0IsR0FBRyxDQUFDLEVBQ2pDLFFBQVEsRUFDUixHQUFHLElBQUksRUFDTSxFQUFvQixFQUFFLENBQUMsQ0FBQztJQUNyQyxHQUFHLElBQUk7SUFDUCxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRTtDQUM5QixDQUFDLENBQUM7QUFOVSxRQUFBLGtCQUFrQixzQkFNNUI7QUFFSSxNQUFNLG9CQUFvQixHQUFHLENBQUMsRUFDbkMsUUFBUSxFQUNSLEdBQUcsSUFBSSxFQUNVLEVBQWdCLEVBQUUsQ0FBQyxDQUFDO0lBQ3JDLEdBQUcsSUFBSTtJQUNQLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDO0NBQzNCLENBQUMsQ0FBQztBQU5VLFFBQUEsb0JBQW9CLHdCQU05QiJ9