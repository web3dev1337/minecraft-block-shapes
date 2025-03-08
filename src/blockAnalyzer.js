const fs = require('fs').promises;
const path = require('path');

class BlockAnalyzer {
    constructor() {
        this.collisionsData = null;
    }

    async loadData() {
        try {
            // Load collision shapes data
            const collisionsPath = path.join(__dirname, '../minecraft-data-1.21/blockCollisionShapes.json');
            const collisions = await fs.readFile(collisionsPath, 'utf8');
            const data = JSON.parse(collisions);
            
            // The file has two main sections: blocks (mapping) and shapes (array of collision boxes)
            this.collisionsData = {
                blocks: data.blocks,
                shapes: data.shapes
            };

            return this.categorizeBlocks();
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    categorizeBlocks() {
        const categories = {
            fullBlocks: [],
            partialBlocks: [],
            nonStandardShapes: [],
            specialBlocks: []
        };

        // Analyze each block's shape
        for (const [blockId, shapeIndex] of Object.entries(this.collisionsData.blocks)) {
            const shape = this.collisionsData.shapes[shapeIndex];
            const blockInfo = {
                id: blockId,
                shapeIndex: shapeIndex,
                shape: shape
            };

            if (this.isFullBlock(shape)) {
                categories.fullBlocks.push(blockInfo);
            } else if (this.isPartialBlock(shape)) {
                categories.partialBlocks.push(blockInfo);
            } else if (this.isSpecialBlock(shape)) {
                categories.specialBlocks.push(blockInfo);
            } else {
                categories.nonStandardShapes.push(blockInfo);
            }
        }

        return categories;
    }

    isFullBlock(shape) {
        // A full block is a single box from 0,0,0 to 1,1,1
        if (!Array.isArray(shape)) return false;
        
        return shape.length === 1 && 
               shape[0].length === 6 &&
               shape[0][0] === 0 && shape[0][1] === 0 && shape[0][2] === 0 &&
               shape[0][3] === 1 && shape[0][4] === 1 && shape[0][5] === 1;
    }

    isPartialBlock(shape) {
        // Partial blocks have a single collision box smaller than 1x1x1
        if (!Array.isArray(shape) || shape.length !== 1) return false;
        
        const box = shape[0];
        return box.length === 6 && (
            box[3] - box[0] < 1 || // Width less than 1
            box[4] - box[1] < 1 || // Height less than 1
            box[5] - box[2] < 1    // Depth less than 1
        );
    }

    isSpecialBlock(shape) {
        // Special blocks have multiple collision boxes
        return Array.isArray(shape) && shape.length > 1;
    }

    getShapeDimensions(box) {
        return {
            width: box[3] - box[0],
            height: box[4] - box[1],
            depth: box[5] - box[2]
        };
    }
}

module.exports = BlockAnalyzer; 