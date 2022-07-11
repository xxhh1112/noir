"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutex = void 0;
const tslib_1 = require("tslib");
(0, tslib_1.__exportStar)(require("./mutex_database"), exports);
class Mutex {
    constructor(db, name, timeout = 5000, tryLockInterval = 2000, pingInterval = 2000) {
        this.db = db;
        this.name = name;
        this.timeout = timeout;
        this.tryLockInterval = tryLockInterval;
        this.pingInterval = pingInterval;
        this.id = 0;
    }
    async lock() {
        while (true) {
            if (await this.db.acquireLock(this.name, this.timeout)) {
                const id = this.id;
                this.pingTimeout = setTimeout(() => this.ping(id), this.pingInterval);
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, this.tryLockInterval));
        }
    }
    async unlock() {
        clearTimeout(this.pingTimeout);
        this.id++;
        await this.db.releaseLock(this.name);
    }
    async ping(id) {
        if (id !== this.id) {
            return;
        }
        await this.db.extendLock(this.name, this.timeout);
        this.pingTimeout = setTimeout(() => this.ping(id), this.pingInterval);
    }
}
exports.Mutex = Mutex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbXV0ZXgvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUVBLGdFQUFpQztBQUVqQyxNQUFhLEtBQUs7SUFJaEIsWUFDbUIsRUFBaUIsRUFDakIsSUFBWSxFQUNaLFVBQVUsSUFBSSxFQUNkLGtCQUFrQixJQUFJLEVBQ3RCLGVBQWUsSUFBSTtRQUpuQixPQUFFLEdBQUYsRUFBRSxDQUFlO1FBQ2pCLFNBQUksR0FBSixJQUFJLENBQVE7UUFDWixZQUFPLEdBQVAsT0FBTyxDQUFPO1FBQ2Qsb0JBQWUsR0FBZixlQUFlLENBQU87UUFDdEIsaUJBQVksR0FBWixZQUFZLENBQU87UUFSOUIsT0FBRSxHQUFHLENBQUMsQ0FBQztJQVNaLENBQUM7SUFFRyxLQUFLLENBQUMsSUFBSTtRQUNmLE9BQU8sSUFBSSxFQUFFO1lBQ1gsSUFBSSxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUN0RCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNuQixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDdEUsT0FBTzthQUNSO1lBQ0QsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztTQUMzRTtJQUNILENBQUM7SUFFTSxLQUFLLENBQUMsTUFBTTtRQUNqQixZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNWLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFTyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDbkIsSUFBSSxFQUFFLEtBQUssSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUNsQixPQUFPO1NBQ1I7UUFFRCxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3hFLENBQUM7Q0FDRjtBQXJDRCxzQkFxQ0MifQ==