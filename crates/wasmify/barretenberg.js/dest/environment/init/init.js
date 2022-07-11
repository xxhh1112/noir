"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitHelpers = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const bigint_buffer_1 = require("../../bigint_buffer");
const pathTools = (0, tslib_1.__importStar)(require("path"));
const init_config_1 = require("./init_config");
const NOTE_LENGTH = 32;
const ADDRESS_LENGTH = 64;
const ALIAS_HASH_LENGTH = 28;
const NULLIFIER_LENGTH = 32;
const SIGNING_KEY_LENGTH = 32;
class InitHelpers {
    static getInitData(chainId) {
        return {
            roots: InitHelpers.getInitRoots(chainId),
            dataTreeSize: InitHelpers.getInitDataSize(chainId),
        };
    }
    static getInitRoots(chainId) {
        const { initDataRoot, initNullRoot, initRootsRoot } = (0, init_config_1.getInitData)(chainId).initRoots;
        return {
            dataRoot: Buffer.from(initDataRoot, "hex"),
            nullRoot: Buffer.from(initNullRoot, "hex"),
            rootsRoot: Buffer.from(initRootsRoot, "hex"),
        };
    }
    static getInitDataSize(chainId) {
        return (0, init_config_1.getInitData)(chainId).initDataSize;
    }
    static getInitAccounts(chainId) {
        return (0, init_config_1.getInitData)(chainId).initAccounts;
    }
    static getAccountDataFile(chainId) {
        if (!(0, init_config_1.getInitData)(chainId).accountsData) {
            return undefined;
        }
        const relPathToFile = (0, init_config_1.getInitData)(chainId).accountsData;
        const fullPath = pathTools.resolve(__dirname, relPathToFile);
        return fullPath;
    }
    static getRootDataFile(chainId) {
        if (!(0, init_config_1.getInitData)(chainId).roots) {
            return undefined;
        }
        const relPathToFile = (0, init_config_1.getInitData)(chainId).roots;
        const fullPath = pathTools.resolve(__dirname, relPathToFile);
        return fullPath;
    }
    static async writeData(filePath, data) {
        const path = pathTools.resolve(__dirname, filePath);
        const fileHandle = await fs_1.promises.open(path, "w");
        const { bytesWritten } = await fileHandle.write(data);
        await fileHandle.close();
        return bytesWritten;
    }
    static async readData(filePath) {
        const path = pathTools.resolve(__dirname, filePath);
        try {
            const fileHandle = await fs_1.promises.open(path, "r");
            const data = await fileHandle.readFile();
            await fileHandle.close();
            return data;
        }
        catch (err) {
            console.log(`Failed to read file: ${path}. Error: ${err}`);
            return Buffer.alloc(0);
        }
    }
    static async writeAccountTreeData(accountData, filePath) {
        accountData.forEach((account) => {
            if (account.notes.note1.length !== NOTE_LENGTH) {
                throw new Error(`Note1 has length ${account.notes.note1.length}, it should be ${NOTE_LENGTH}`);
            }
            if (account.notes.note2.length !== NOTE_LENGTH) {
                throw new Error(`Note2 has length ${account.notes.note2.length}, it should be ${NOTE_LENGTH}`);
            }
            if (account.alias.aliasHash.length !== ALIAS_HASH_LENGTH) {
                throw new Error(`Alias hash has length ${account.alias.aliasHash.length}, it should be ${ALIAS_HASH_LENGTH}`);
            }
            if (account.alias.address.length !== ADDRESS_LENGTH) {
                throw new Error(`Alias grumpkin address has length ${account.alias.address.length}, it should be ${ADDRESS_LENGTH}`);
            }
            if (account.nullifiers.nullifier1.length !== NULLIFIER_LENGTH) {
                throw new Error(`Nullifier1 has length ${account.nullifiers.nullifier1.length}, it should be ${NULLIFIER_LENGTH}`);
            }
            if (account.nullifiers.nullifier2.length !== NULLIFIER_LENGTH) {
                throw new Error(`Nullifier1 has length ${account.nullifiers.nullifier2.length}, it should be ${NULLIFIER_LENGTH}`);
            }
            if (account.signingKeys.signingKey1.length !== SIGNING_KEY_LENGTH) {
                throw new Error(`Signing Key 1 has length ${account.signingKeys.signingKey1.length}, it should be ${SIGNING_KEY_LENGTH}`);
            }
            if (account.signingKeys.signingKey2.length !== SIGNING_KEY_LENGTH) {
                throw new Error(`Signing Key 2 has length ${account.signingKeys.signingKey2.length}, it should be ${SIGNING_KEY_LENGTH}`);
            }
        });
        const dataToWrite = accountData.flatMap((account) => {
            return [
                account.alias.aliasHash,
                account.alias.address,
                account.notes.note1,
                account.notes.note2,
                account.nullifiers.nullifier1,
                account.nullifiers.nullifier2,
                account.signingKeys.signingKey1,
                account.signingKeys.signingKey2,
            ];
        });
        return await this.writeData(filePath, Buffer.concat(dataToWrite));
    }
    static parseAccountTreeData(data) {
        const lengthOfAccountData = ALIAS_HASH_LENGTH +
            ADDRESS_LENGTH +
            2 * NOTE_LENGTH +
            2 * NULLIFIER_LENGTH +
            2 * SIGNING_KEY_LENGTH;
        const numAccounts = data.length / lengthOfAccountData;
        if (numAccounts === 0) {
            return [];
        }
        const accounts = new Array(numAccounts);
        for (let i = 0; i < numAccounts; i++) {
            let start = i * lengthOfAccountData;
            const alias = {
                aliasHash: data.slice(start, start + ALIAS_HASH_LENGTH),
                address: data.slice(start + ALIAS_HASH_LENGTH, start + (ALIAS_HASH_LENGTH + ADDRESS_LENGTH)),
            };
            start += ALIAS_HASH_LENGTH + ADDRESS_LENGTH;
            const notes = {
                note1: data.slice(start, start + NOTE_LENGTH),
                note2: data.slice(start + NOTE_LENGTH, start + 2 * NOTE_LENGTH),
            };
            start += 2 * NOTE_LENGTH;
            const nullifiers = {
                nullifier1: data.slice(start, start + NULLIFIER_LENGTH),
                nullifier2: data.slice(start + NULLIFIER_LENGTH, start + 2 * NULLIFIER_LENGTH),
            };
            start += 2 * NULLIFIER_LENGTH;
            const signingKeys = {
                signingKey1: data.slice(start, start + SIGNING_KEY_LENGTH),
                signingKey2: data.slice(start + SIGNING_KEY_LENGTH, start + 2 * SIGNING_KEY_LENGTH),
            };
            const account = {
                notes,
                nullifiers,
                alias,
                signingKeys,
            };
            accounts[i] = account;
        }
        return accounts;
    }
    static async readAccountTreeData(filePath) {
        const data = await this.readData(filePath);
        return this.parseAccountTreeData(data);
    }
    static async populateDataAndRootsTrees(accounts, merkleTree, dataTreeIndex, rootsTreeIndex, rollupSize) {
        const entries = accounts.flatMap((account, index) => {
            return [
                {
                    treeId: dataTreeIndex,
                    index: BigInt(index * 2),
                    value: account.notes.note1,
                },
                {
                    treeId: dataTreeIndex,
                    index: BigInt(1 + index * 2),
                    value: account.notes.note2,
                },
            ];
        });
        console.log(`Batch inserting ${entries.length} notes into data tree...`);
        await merkleTree.batchPut(entries);
        if (rollupSize) {
            // we need to expand the data tree to have 'full' rollups worth of notes in
            const numFullRollups = Math.floor(entries.length / rollupSize);
            const additional = entries.length % rollupSize ? 1 : 0;
            const notesRequired = (numFullRollups + additional) * rollupSize;
            if (notesRequired > entries.length) {
                await merkleTree.put(dataTreeIndex, BigInt(notesRequired - 1), Buffer.alloc(32, 0));
            }
        }
        const dataRoot = merkleTree.getRoot(dataTreeIndex);
        await merkleTree.put(rootsTreeIndex, BigInt(0), dataRoot);
        const rootsRoot = merkleTree.getRoot(rootsTreeIndex);
        const dataSize = merkleTree.getSize(dataTreeIndex);
        return { dataRoot, rootsRoot, dataSize };
    }
    static async populateNullifierTree(accounts, merkleTree, nullTreeIndex) {
        const emptyBuffer = Buffer.alloc(32, 0);
        const entries = accounts
            .flatMap((account) => [
            account.nullifiers.nullifier1,
            account.nullifiers.nullifier2,
        ])
            .filter((nullifier) => !nullifier.equals(emptyBuffer))
            .map((nullifier) => {
            return {
                treeId: nullTreeIndex,
                index: (0, bigint_buffer_1.toBigIntBE)(nullifier),
                value: (0, bigint_buffer_1.toBufferBE)(BigInt(1), 32),
            };
        });
        console.log(`Batch inserting ${entries.length} notes into nullifier tree...`);
        await merkleTree.batchPut(entries);
        const root = merkleTree.getRoot(nullTreeIndex);
        return root;
    }
}
exports.InitHelpers = InitHelpers;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9lbnZpcm9ubWVudC9pbml0L2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLDJCQUFvQztBQUVwQyx1REFBNkQ7QUFDN0QsNkRBQWtDO0FBQ2xDLCtDQUE0QztBQUU1QyxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDdkIsTUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDO0FBQzFCLE1BQU0saUJBQWlCLEdBQUcsRUFBRSxDQUFDO0FBQzdCLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBQzVCLE1BQU0sa0JBQWtCLEdBQUcsRUFBRSxDQUFDO0FBd0M5QixNQUFhLFdBQVc7SUFDZixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQWU7UUFDdkMsT0FBTztZQUNMLEtBQUssRUFBRSxXQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQztZQUN4QyxZQUFZLEVBQUUsV0FBVyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUM7U0FDbkQsQ0FBQztJQUNKLENBQUM7SUFFTSxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQWU7UUFDeEMsTUFBTSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLEdBQ2pELElBQUEseUJBQVcsRUFBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDakMsT0FBTztZQUNMLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUM7WUFDMUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQztZQUMxQyxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDO1NBQzdDLENBQUM7SUFDSixDQUFDO0lBRU0sTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFlO1FBQzNDLE9BQU8sSUFBQSx5QkFBVyxFQUFDLE9BQU8sQ0FBQyxDQUFD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