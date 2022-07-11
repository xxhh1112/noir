"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
class ConsoleLogger {
    constructor(prefix, logger = console.log) {
        this.prefix = prefix;
        this.logger = logger;
    }
    log(...args) {
        this.logger(`${this.prefix}:`, ...args);
    }
}
function createLogger(prefix) {
    if (prefix) {
        const logger = new ConsoleLogger(prefix, console.log);
        return (...args) => logger.log(...args);
    }
    return console.log;
}
exports.createLogger = createLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc29sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9sb2cvY29uc29sZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxNQUFNLGFBQWE7SUFDakIsWUFDVSxNQUFjLEVBQ2QsU0FBbUMsT0FBTyxDQUFDLEdBQUc7UUFEOUMsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLFdBQU0sR0FBTixNQUFNLENBQXdDO0lBQ3JELENBQUM7SUFFRyxHQUFHLENBQUMsR0FBRyxJQUFXO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQ0Y7QUFFRCxTQUFnQixZQUFZLENBQUMsTUFBYztJQUN6QyxJQUFJLE1BQU0sRUFBRTtRQUNWLE1BQU0sTUFBTSxHQUFHLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEQsT0FBTyxDQUFDLEdBQUcsSUFBVyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDaEQ7SUFDRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDckIsQ0FBQztBQU5ELG9DQU1DIn0=