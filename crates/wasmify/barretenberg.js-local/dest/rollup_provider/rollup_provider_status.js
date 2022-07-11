"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollupProviderStatusFromJson = exports.rollupProviderStatusToJson = exports.partialRuntimeConfigFromJson = exports.runtimeConfigFromJson = exports.runtimeConfigToJson = void 0;
const tslib_1 = require("tslib");
const address_1 = require("../address");
const blockchain_1 = require("../blockchain");
const bridge_config_1 = require("./bridge_config");
const bridge_status_1 = require("./bridge_status");
const privacy_set_1 = require("./privacy_set");
(0, tslib_1.__exportStar)(require("./bridge_config"), exports);
(0, tslib_1.__exportStar)(require("./bridge_status"), exports);
(0, tslib_1.__exportStar)(require("./privacy_set"), exports);
const runtimeConfigToJson = ({ maxFeeGasPrice, maxFeePerGas, maxPriorityFeePerGas, bridgeConfigs, privacySets, rollupBeneficiary, ...rest }) => ({
    ...rest,
    maxFeeGasPrice: maxFeeGasPrice.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    bridgeConfigs: bridgeConfigs.map(bridge_config_1.bridgeConfigToJson),
    privacySets: (0, privacy_set_1.privacySetsToJson)(privacySets),
    rollupBeneficiary: rollupBeneficiary
        ? rollupBeneficiary.toString()
        : undefined,
});
exports.runtimeConfigToJson = runtimeConfigToJson;
const runtimeConfigFromJson = ({ maxFeeGasPrice, maxFeePerGas, maxPriorityFeePerGas, bridgeConfigs, privacySets, rollupBeneficiary, ...rest }) => ({
    ...rest,
    maxFeeGasPrice: BigInt(maxFeeGasPrice),
    maxFeePerGas: BigInt(maxFeePerGas),
    maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
    bridgeConfigs: bridgeConfigs.map(bridge_config_1.bridgeConfigFromJson),
    privacySets: (0, privacy_set_1.privacySetsFromJson)(privacySets),
    rollupBeneficiary: rollupBeneficiary
        ? address_1.EthAddress.fromString(rollupBeneficiary)
        : undefined,
});
exports.runtimeConfigFromJson = runtimeConfigFromJson;
const partialRuntimeConfigFromJson = ({ maxFeeGasPrice, maxFeePerGas, maxPriorityFeePerGas, bridgeConfigs, privacySets, rollupBeneficiary, ...rest }) => ({
    ...rest,
    ...(maxFeeGasPrice !== undefined
        ? { maxFeeGasPrice: BigInt(maxFeeGasPrice) }
        : {}),
    ...(maxFeePerGas !== undefined ? { maxFeePerGas: BigInt(maxFeePerGas) } : {}),
    ...(maxPriorityFeePerGas !== undefined
        ? { maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas) }
        : {}),
    ...(bridgeConfigs
        ? { bridgeConfigs: bridgeConfigs.map(bridge_config_1.bridgeConfigFromJson) }
        : {}),
    ...(privacySets ? { privacySets: (0, privacy_set_1.privacySetsFromJson)(privacySets) } : {}),
    ...(rollupBeneficiary
        ? { rollupBeneficiary: address_1.EthAddress.fromString(rollupBeneficiary) }
        : {}),
});
exports.partialRuntimeConfigFromJson = partialRuntimeConfigFromJson;
const rollupProviderStatusToJson = ({ blockchainStatus, nextPublishTime, runtimeConfig, bridgeStatus, ...rest }) => ({
    ...rest,
    blockchainStatus: (0, blockchain_1.blockchainStatusToJson)(blockchainStatus),
    nextPublishTime: nextPublishTime.toISOString(),
    runtimeConfig: (0, exports.runtimeConfigToJson)(runtimeConfig),
    bridgeStatus: bridgeStatus.map(bridge_status_1.bridgeStatusToJson),
});
exports.rollupProviderStatusToJson = rollupProviderStatusToJson;
const rollupProviderStatusFromJson = ({ blockchainStatus, nextPublishTime, runtimeConfig, bridgeStatus, ...rest }) => ({
    ...rest,
    blockchainStatus: (0, blockchain_1.blockchainStatusFromJson)(blockchainStatus),
    nextPublishTime: new Date(nextPublishTime),
    runtimeConfig: (0, exports.runtimeConfigFromJson)(runtimeConfig),
    bridgeStatus: bridgeStatus.map(bridge_status_1.bridgeStatusFromJson),
});
exports.rollupProviderStatusFromJson = rollupProviderStatusFromJson;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9sbHVwX3Byb3ZpZGVyX3N0YXR1cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb2xsdXBfcHJvdmlkZXIvcm9sbHVwX3Byb3ZpZGVyX3N0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsd0NBQXdDO0FBQ3hDLDhDQUt1QjtBQUN2QixtREFLeUI7QUFDekIsbURBS3lCO0FBQ3pCLCtDQUt1QjtBQUV2QiwrREFBZ0M7QUFDaEMsK0RBQWdDO0FBQ2hDLDZEQUE4QjtBQTBDdkIsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLEVBQ2xDLGNBQWMsRUFDZCxZQUFZLEVBQ1osb0JBQW9CLEVBQ3BCLGFBQWEsRUFDYixXQUFXLEVBQ1gsaUJBQWlCLEVBQ2pCLEdBQUcsSUFBSSxFQUNPLEVBQXFCLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLEdBQUcsSUFBSTtJQUNQLGNBQWMsRUFBRSxjQUFjLENBQUMsUUFBUSxFQUFFO0lBQ3pDLFlBQVksRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFO0lBQ3JDLG9CQUFvQixFQUFFLG9CQUFvQixDQUFDLFFBQVEsRUFBRTtJQUNyRCxhQUFhLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0IsQ0FBQztJQUNwRCxXQUFXLEVBQUUsSUFBQSwrQkFBaUIsRUFBQyxXQUFXLENBQUM7SUFDM0MsaUJBQWlCLEVBQUUsaUJBQWlCO1FBQ2xDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUU7UUFDOUIsQ0FBQyxDQUFDLFNBQVM7Q0FDZCxDQUFDLENBQUM7QUFsQlUsUUFBQSxtQkFBbUIsdUJBa0I3QjtBQUVJLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxFQUNwQyxjQUFjLEVBQ2QsWUFBWSxFQUNaLG9CQUFvQixFQUNwQixhQUFhLEVBQ2IsV0FBVyxFQUNYLGlCQUFpQixFQUNqQixHQUFHLElBQUksRUFDVyxFQUFpQixFQUFFLENBQUMsQ0FBQztJQUN2QyxHQUFHLElBQUk7SUFDUCxjQUFj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