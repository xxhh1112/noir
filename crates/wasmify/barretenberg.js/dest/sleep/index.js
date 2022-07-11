"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.InterruptableSleep = void 0;
const errors_1 = require("../errors");
class InterruptableSleep {
    constructor() {
        this.interruptResolve = () => { };
        this.interruptPromise = new Promise((resolve) => (this.interruptResolve = resolve));
        this.timeouts = [];
    }
    async sleep(ms) {
        let timeout;
        const promise = new Promise((resolve) => (timeout = setTimeout(() => resolve(false), ms)));
        this.timeouts.push(timeout);
        const shouldThrow = await Promise.race([promise, this.interruptPromise]);
        clearTimeout(timeout);
        this.timeouts.splice(this.timeouts.indexOf(timeout), 1);
        if (shouldThrow) {
            throw new errors_1.InterruptError("Interrupted.");
        }
    }
    interrupt(sleepShouldThrow = false) {
        this.interruptResolve(sleepShouldThrow);
        this.interruptPromise = new Promise((resolve) => (this.interruptResolve = resolve));
    }
}
exports.InterruptableSleep = InterruptableSleep;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.sleep = sleep;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2xlZXAvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsc0NBQTJDO0FBRTNDLE1BQWEsa0JBQWtCO0lBQS9CO1FBQ1UscUJBQWdCLEdBQW1DLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQztRQUM1RCxxQkFBZ0IsR0FBRyxJQUFJLE9BQU8sQ0FDcEMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxDQUMvQyxDQUFDO1FBQ00sYUFBUSxHQUFxQixFQUFFLENBQUM7SUFzQjFDLENBQUM7SUFwQlEsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFVO1FBQzNCLElBQUksT0FBd0IsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FDekIsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FDOUQsQ0FBQztRQUNGLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLE1BQU0sV0FBVyxHQUFHLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4RCxJQUFJLFdBQVcsRUFBRTtZQUNmLE1BQU0sSUFBSSx1QkFBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQzFDO0lBQ0gsQ0FBQztJQUVNLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLO1FBQ3ZDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLE9BQU8sQ0FDakMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxDQUMvQyxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBM0JELGdEQTJCQztBQUVELFNBQWdCLEtBQUssQ0FBQyxFQUFVO0lBQzlCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRkQsc0JBRUMifQ==