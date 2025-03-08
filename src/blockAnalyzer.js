const fs = require('fs').promises;
const path = require('path');

class BlockAnalyzer {
    constructor() {
        this.blocksData = null;
        this.collisionsData = null;
    }

    async loadData() {
        try {
            // Load collision shapes data
            const collisionsPath = path.join(__dirname, '../minecraft-data-1.21/blockCollisionShapes.json');
            const collisions = await fs.readFile(collisionsPath, 'utf8');
            this.collisionsData = JSON.parse(collisions);

            // For now, let's analyze just the collision shapes
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

        // Analyze collision shapes
        for (const [blockId, shape] of Object.entries(this.collisionsData)) {
            const blockInfo = {
                id: blockId,
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
        // Check if the shape is a full 1x1x1 block
        if (!Array.isArray(shape)) return false;
        
        // A full block typically has coordinates from 0,0,0 to 1,1,1
        return shape.some(box => 
            box.length === 6 && 
            box[0] === 0 && box[1] === 0 && box[2] === 0 && 
            box[3] === 1 && box[4] === 1 && box[5] === 1
        );
    }

    isPartialBlock(shape) {
        // Check for partial blocks (slabs, stairs, etc.)
        if (!Array.isArray(shape)) return false;
        
        return shape.some(box => 
            box.length === 6 && 
            (box[4] < 1 || // Less than full height
             box[3] - box[0] < 1 || // Less than full width
             box[5] - box[2] < 1) // Less than full depth
        );
    }

    isSpecialBlock(shape) {
        // Check for complex shapes (multiple boxes or unusual dimensions)
        return Array.isArray(shape) && shape.length > 1;
    }
}

module.exports = BlockAnalyzer; 