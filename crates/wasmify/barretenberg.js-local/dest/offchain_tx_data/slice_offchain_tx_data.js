"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sliceOffchainTxData = exports.getOffchainDataLength = void 0;
const client_proofs_1 = require("../client_proofs");
const offchain_account_data_1 = require("./offchain_account_data");
const offchain_defi_deposit_data_1 = require("./offchain_defi_deposit_data");
const offchain_join_split_data_1 = require("./offchain_join_split_data");
function getOffchainDataLength(proofId) {
    switch (proofId) {
        case client_proofs_1.ProofId.DEPOSIT:
        case client_proofs_1.ProofId.WITHDRAW:
        case client_proofs_1.ProofId.SEND:
            return offchain_join_split_data_1.OffchainJoinSplitData.SIZE;
        case client_proofs_1.ProofId.ACCOUNT:
            return offchain_account_data_1.OffchainAccountData.SIZE;
        case client_proofs_1.ProofId.DEFI_DEPOSIT:
            return offchain_defi_deposit_data_1.OffchainDefiDepositData.SIZE;
        default:
            return 0;
    }
}
exports.getOffchainDataLength = getOffchainDataLength;
const sliceOffchainTxData = (proofIds, offchainTxData) => {
    let dataStart = 0;
    let dataEnd = 0;
    const result = proofIds.map((proofId) => {
        dataStart = dataEnd;
        dataEnd += getOffchainDataLength(proofId);
        return offchainTxData.slice(dataStart, dataEnd);
    });
    if (dataEnd != offchainTxData.length) {
        throw new Error("Offchain data has unexpected length for given proof ids.");
    }
    return result;
};
exports.sliceOffchainTxData = sliceOffchainTxData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2xpY2Vfb2ZmY2hhaW5fdHhfZGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vZmZjaGFpbl90eF9kYXRhL3NsaWNlX29mZmNoYWluX3R4X2RhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsb0RBQTJDO0FBQzNDLG1FQUE4RDtBQUM5RCw2RUFBdUU7QUFDdkUseUVBQW1FO0FBRW5FLFNBQWdCLHFCQUFxQixDQUFDLE9BQWdCO0lBQ3BELFFBQVEsT0FBTyxFQUFFO1FBQ2YsS0FBSyx1QkFBTyxDQUFDLE9BQU8sQ0FBQztRQUNyQixLQUFLLHVCQUFPLENBQUMsUUFBUSxDQUFDO1FBQ3RCLEtBQUssdUJBQU8sQ0FBQyxJQUFJO1lBQ2YsT0FBTyxnREFBcUIsQ0FBQyxJQUFJLENBQUM7UUFDcEMsS0FBSyx1QkFBTyxDQUFDLE9BQU87WUFDbEIsT0FBTywyQ0FBbUIsQ0FBQyxJQUFJLENBQUM7UUFDbEMsS0FBSyx1QkFBTyxDQUFDLFlBQVk7WUFDdkIsT0FBTyxvREFBdUIsQ0FBQyxJQUFJLENBQUM7UUFDdEM7WUFDRSxPQUFPLENBQUMsQ0FBQztLQUNaO0FBQ0gsQ0FBQztBQWJELHNEQWFDO0FBRU0sTUFBTSxtQkFBbUIsR0FBRyxDQUNqQyxRQUFtQixFQUNuQixjQUFzQixFQUN0QixFQUFFO0lBQ0YsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztJQUNoQixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDdEMsU0FBUyxHQUFHLE9BQU8sQ0FBQztRQUNwQixPQUFPLElBQUkscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUMsT0FBTyxjQUFjLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNsRCxDQUFDLENBQUMsQ0FBQztJQUNILElBQUksT0FBTyxJQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUU7UUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQywwREFBMEQsQ0FBQyxDQUFDO0tBQzdFO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyxDQUFDO0FBZlcsUUFBQSxtQkFBbUIsdUJBZTlCIn0=