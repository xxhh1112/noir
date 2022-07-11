"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultPrivacySets = exports.privacySetsFromJson = exports.privacySetsToJson = void 0;
function privacySetsToJson(privacySets) {
    const json = {};
    for (const assetId in privacySets) {
        const assetSets = privacySets[assetId];
        json[assetId] = assetSets.map((set) => {
            return {
                value: set.value.toString(),
                users: set.users,
            };
        });
    }
    return json;
}
exports.privacySetsToJson = privacySetsToJson;
function privacySetsFromJson(privacySets) {
    const result = {};
    for (const assetId in privacySets) {
        const assetSets = privacySets[assetId];
        result[Number(assetId)] = assetSets.map((set) => {
            return {
                value: BigInt(set.value),
                users: set.users,
            };
        });
    }
    return result;
}
exports.privacySetsFromJson = privacySetsFromJson;
function getDefaultPrivacySets() {
    return {
        0: [],
        1: [],
    };
}
exports.getDefaultPrivacySets = getDefaultPrivacySets;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpdmFjeV9zZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcm9sbHVwX3Byb3ZpZGVyL3ByaXZhY3lfc2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVVBLFNBQWdCLGlCQUFpQixDQUFDLFdBRWpDO0lBR0MsTUFBTSxJQUFJLEdBQXdDLEVBQUUsQ0FBQztJQUNyRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFdBQVcsRUFBRTtRQUNqQyxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNwQyxPQUFPO2dCQUNMLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtnQkFDM0IsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO2FBQ0MsQ0FBQztRQUN0QixDQUFDLENBQUMsQ0FBQztLQUNKO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBaEJELDhDQWdCQztBQUVELFNBQWdCLG1CQUFtQixDQUFDLFdBRW5DO0lBR0MsTUFBTSxNQUFNLEdBQW9DLEVBQUUsQ0FBQztJQUNuRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFdBQVcsRUFBRTtRQUNqQyxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUM5QyxPQUFPO2dCQUNMLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztnQkFDeEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO2FBQ0gsQ0FBQztRQUNsQixDQUFDLENBQUMsQ0FBQztLQUNKO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQWhCRCxrREFnQkM7QUFFRCxTQUFnQixxQkFBcUI7SUFDbkMsT0FBTztRQUNMLENBQUMsRUFBRSxFQUFFO1FBQ0wsQ0FBQyxFQUFFLEVBQUU7S0FDNkIsQ0FBQztBQUN2QyxDQUFDO0FBTEQsc0RBS0MifQ==