"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerkleTree = void 0;
const hash_path_1 = require("./hash_path");
const MAX_DEPTH = 32;
function keepNLsb(input, numBits) {
    return numBits >= MAX_DEPTH ? input : input & ((1 << numBits) - 1);
}
class MerkleTree {
    constructor(db, hasher, name, depth, size = 0, root, initialLeafValue = MerkleTree.ZERO_ELEMENT) {
        this.db = db;
        this.hasher = hasher;
        this.name = name;
        this.depth = depth;
        this.size = size;
        this.initialLeafValue = initialLeafValue;
        this.zeroHashes = [];
        if (!(depth >= 1 && depth <= MAX_DEPTH)) {
            throw Error("Bad depth");
        }
        // Compute the zero values at each layer.
        let current = initialLeafValue;
        for (let i = 0; i < depth; ++i) {
            this.zeroHashes[i] = current;
            current = hasher.compress(current, current);
        }
        this.root = root ? root : current;
    }
    static async new(db, hasher, name, depth, initialLeafValue = MerkleTree.ZERO_ELEMENT) {
        const tree = new MerkleTree(db, hasher, name, depth, 0, undefined, initialLeafValue);
        await tree.writeMeta();
        return tree;
    }
    static async fromName(db, hasher, name, initialLeafValue = MerkleTree.ZERO_ELEMENT) {
        const meta = await db.get(Buffer.from(name));
        const root = meta.slice(0, 32);
        const depth = meta.readUInt32LE(32);
        const size = meta.readUInt32LE(36);
        return new MerkleTree(db, hasher, name, depth, size, root, initialLeafValue);
    }
    async syncFromDb() {
        const meta = await this.db.get(Buffer.from(this.name));
        this.root = meta.slice(0, 32);
        this.depth = meta.readUInt32LE(32);
        this.size = meta.readUInt32LE(36);
    }
    async writeMeta(batch) {
        const data = Buffer.alloc(40);
        this.root.copy(data);
        data.writeUInt32LE(this.depth, 32);
        data.writeUInt32LE(this.size, 36);
        if (batch) {
            batch.put(this.name, data);
        }
        else {
            await this.db.put(this.name, data);
        }
    }
    getRoot() {
        return this.root;
    }
    getSize() {
        return this.size;
    }
    /**
     * Returns a hash path for the element at the given index.
     * The hash path is an array of pairs of hashes, with the lowest pair (leaf hashes) first, and the highest pair last.
     */
    async getHashPath(index) {
        const path = new hash_path_1.HashPath();
        let data = await this.dbGet(this.root);
        for (let i = this.depth - 1; i >= 0; --i) {
            if (!data) {
                // This is an empty subtree. Fill in zero value.
                path.data[i] = [this.zeroHashes[i], this.zeroHashes[i]];
                continue;
            }
            if (data.length > 64) {
                // Data is a subtree. Extract hash pair at height i.
                const subtreeDepth = i + 1;
                let layerSize = 2 ** subtreeDepth;
                let offset = 0;
                index = keepNLsb(index, subtreeDepth);
                for (let j = 0; j < subtreeDepth; ++j) {
                    index -= index & 0x1;
                    const lhsOffset = offset + index * 32;
                    path.data[j] = [
                        data.slice(lhsOffset, lhsOffset + 32),
                        data.slice(lhsOffset + 32, lhsOffset + 64),
                    ];
                    offset += layerSize * 32;
                    layerSize >>= 1;
                    index >>= 1;
                }
                break;
            }
            const lhs = data.slice(0, 32);
            const rhs = data.slice(32, 64);
            path.data[i] = [lhs, rhs];
            const isRight = (index >> i) & 0x1;
            data = await this.dbGet(isRight ? rhs : lhs);
        }
        return path;
    }
    async updateElement(index, value) {
        return await this.updateLeafHash(index, value.equals(Buffer.alloc(32, 0)) ? this.initialLeafValue : value);
    }
    async updateLeafHash(index, leafHash) {
        const batch = this.db.batch();
        this.root = await this.updateElementInternal(this.root, leafHash, index, this.depth, batch);
        this.size = Math.max(this.size, index + 1);
        await this.writeMeta(batch);
        await batch.write();
    }
    async updateElementInternal(root, value, index, height, batch) {
        if (height === 0) {
            return value;
        }
        const data = await this.dbGet(root);
        const isRight = (index >> (height - 1)) & 0x1;
        let left = data ? data.slice(0, 32) : this.zeroHashes[height - 1];
        let right = data ? data.slice(32, 64) : this.zeroHashes[height - 1];
        const subtreeRoot = isRight ? right : left;
        const newSubtreeRoot = await this.updateElementInternal(subtreeRoot, value, keepNLsb(index, height - 1), height - 1, batch);
        if (isRight) {
            right = newSubtreeRoot;
        }
        else {
            left = newSubtreeRoot;
        }
        const newRoot = this.hasher.compress(left, right);
        batch.put(newRoot, Buffer.concat([left, right]));
        if (!root.equals(newRoot)) {
            batch.del(root);
        }
        return newRoot;
    }
    async updateElements(index, values) {
        const zeroBuf = Buffer.alloc(32, 0);
        return await this.updateLeafHashes(index, values.map((v) => (v.equals(zeroBuf) ? this.initialLeafValue : v)));
    }
    /**
     * Updates all the given values, starting at index. This is optimal when inserting multiple values, as it can
     * compute a single subtree and insert it in one go.
     * However it comes with restrictions:
     * - The insertion index must be a multiple of the subtree size, which must be power of 2.
     * - The insertion index must be >= the current size of the tree (inserting into an empty location).
     *
     * We cannot over extend the tree size, as these inserts are bulk inserts, and a subsequent update would involve
     * a lot of complexity adjusting a previously inserted bulk insert. For this reason depending on the number of
     * values to insert, it will be chunked into the fewest number of subtrees required to grow the tree be precisely
     * that size. In normal operation (e.g. continuously inserting 64 values), we will be able to leverage single inserts.
     * Only when synching creates a non power of 2 set of values will the chunking mechanism come into play.
     * e.g. If we need insert 192 values, first a subtree of 128 is inserted, then a subtree of 64.
     */
    async updateLeafHashes(index, leafHashes) {
        while (leafHashes.length) {
            const batch = this.db.batch();
            let subtreeDepth = Math.ceil(Math.log2(leafHashes.length));
            let subtreeSize = 2 ** subtreeDepth;
            // We need to reduce the size of the subtree being inserted until it is:
            // a) Less than or equal in size to the number of values being inserted.
            // b) Fits in a subtree, with a size that is a multiple of the insertion index.
            while (leafHashes.length < subtreeSize || index % subtreeSize !== 0) {
                subtreeSize >>= 1;
                subtreeDepth--;
            }
            const toInsert = leafHashes.slice(0, subtreeSize);
            const hashes = await this.hasher.hashToTree(toInsert);
            this.root = await this.updateElementsInternal(this.root, hashes, index, this.depth, subtreeDepth, batch);
            // Slice off inserted values and adjust next insertion index.
            leafHashes = leafHashes.slice(subtreeSize);
            index += subtreeSize;
            this.size = index;
            await this.writeMeta(batch);
            await batch.write();
        }
    }
    async updateElementsInternal(root, hashes, index, height, subtreeHeight, batch) {
        if (height === subtreeHeight) {
            const root = hashes.pop();
            batch.put(root, Buffer.concat(hashes));
            return root;
        }
        // Do nothing if updating zero values.
        if (hashes[hashes.length - 1].equals(this.zeroHashes[height - 1])) {
            return root;
        }
        const data = await this.dbGet(root);
        const isRight = (index >> (height - 1)) & 0x1;
        if (data && data.length > 64) {
            if (!root.equals(hashes[hashes.length - 1])) {
                throw new Error("Attempting to update pre-existing subtree.");
            }
            return root;
        }
        let left = data ? data.slice(0, 32) : this.zeroHashes[height - 1];
        let right = data ? data.slice(32, 64) : this.zeroHashes[height - 1];
        const subtreeRoot = isRight ? right : left;
        const newSubtreeRoot = await this.updateElementsInternal(subtreeRoot, hashes, keepNLsb(index, height - 1), height - 1, subtreeHeight, batch);
        if (isRight) {
            right = newSubtreeRoot;
        }
        else {
            left = newSubtreeRoot;
        }
        const newRoot = this.hasher.compress(left, right);
        batch.put(newRoot, Buffer.concat([left, right]));
        if (!root.equals(newRoot)) {
            batch.del(root);
        }
        return newRoot;
    }
    async dbGet(key) {
        return await this.db.get(key).catch(() => { });
    }
}
exports.MerkleTree = MerkleTree;
MerkleTree.ZERO_ELEMENT = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex");
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVya2xlX3RyZWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWVya2xlX3RyZWUvbWVya2xlX3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsMkNBQXVDO0FBR3ZDLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUVyQixTQUFTLFFBQVEsQ0FBQyxLQUFhLEVBQUUsT0FBZTtJQUM5QyxPQUFPLE9BQU8sSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDckUsQ0FBQztBQUVELE1BQWEsVUFBVTtJQVFyQixZQUNVLEVBQVcsRUFDWCxNQUFjLEVBQ2QsSUFBWSxFQUNaLEtBQWEsRUFDYixPQUFlLENBQUMsRUFDeEIsSUFBYSxFQUNMLG1CQUFtQixVQUFVLENBQUMsWUFBWTtRQU4xQyxPQUFFLEdBQUYsRUFBRSxDQUFTO1FBQ1gsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLFNBQUksR0FBSixJQUFJLENBQVE7UUFDWixVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2IsU0FBSSxHQUFKLElBQUksQ0FBWTtRQUVoQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQTBCO1FBVDVDLGVBQVUsR0FBYSxFQUFFLENBQUM7UUFXaEMsSUFBSSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksU0FBUyxDQUFDLEVBQUU7WUFDdkMsTUFBTSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDMUI7UUFFRCx5Q0FBeUM7UUFDekMsSUFBSSxPQUFPLEdBQUcsZ0JBQWdCLENBQUM7UUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRTtZQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxH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