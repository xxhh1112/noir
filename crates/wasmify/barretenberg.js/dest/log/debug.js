"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEnabled = exports.enableLogs = exports.setPostDebugLogHook = exports.setPreDebugLogHook = exports.createDebugLogger = void 0;
const tslib_1 = require("tslib");
const debug_1 = (0, tslib_1.__importDefault)(require("debug"));
let preLogHook;
let postLogHook;
function theFunctionThroughWhichAllLogsPass(logger, ...args) {
    if (preLogHook) {
        preLogHook(...args);
    }
    logger(...args);
    if (postLogHook) {
        postLogHook(...args);
    }
}
function createDebugLogger(name) {
    const logger = (0, debug_1.default)(name);
    return (...args) => theFunctionThroughWhichAllLogsPass(logger, ...args);
}
exports.createDebugLogger = createDebugLogger;
function setPreDebugLogHook(fn) {
    preLogHook = fn;
}
exports.setPreDebugLogHook = setPreDebugLogHook;
function setPostDebugLogHook(fn) {
    postLogHook = fn;
}
exports.setPostDebugLogHook = setPostDebugLogHook;
function enableLogs(str) {
    debug_1.default.enable(str);
}
exports.enableLogs = enableLogs;
function isEnabled(str) {
    return debug_1.default.enabled(str);
}
exports.isEnabled = isEnabled;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbG9nL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSwrREFBMEI7QUFFMUIsSUFBSSxVQUFrRCxDQUFDO0FBQ3ZELElBQUksV0FBbUQsQ0FBQztBQUV4RCxTQUFTLGtDQUFrQyxDQUFDLE1BQVcsRUFBRSxHQUFHLElBQVc7SUFDckUsSUFBSSxVQUFVLEVBQUU7UUFDZCxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUNyQjtJQUNELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ2hCLElBQUksV0FBVyxFQUFFO1FBQ2YsV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDdEI7QUFDSCxDQUFDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsSUFBWTtJQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFBLGVBQUssRUFBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixPQUFPLENBQUMsR0FBRyxJQUFXLEVBQUUsRUFBRSxDQUN4QixrQ0FBa0MsQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBSkQsOENBSUM7QUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxFQUE0QjtJQUM3RCxVQUFVLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLENBQUM7QUFGRCxnREFFQztBQUVELFNBQWdCLG1CQUFtQixDQUFDLEVBQTRCO0lBQzlELFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDbkIsQ0FBQztBQUZELGtEQUVDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLEdBQVc7SUFDcEMsZUFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwQixDQUFDO0FBRkQsZ0NBRUM7QUFFRCxTQUFnQixTQUFTLENBQUMsR0FBVztJQUNuQyxPQUFPLGVBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUIsQ0FBQztBQUZELDhCQUVDIn0=