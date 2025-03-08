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
        for (const [blockId, shapeIndices] of Object.entries(this.collisionsData.blocks)) {
            // Get all shapes for this block
            const shapes = shapeIndices.map(index => this.collisionsData.shapes[index] || []);
            
            const blockInfo = {
                id: blockId,
                shapeIndices: shapeIndices,
                shapes: shapes
            };

            if (this.isNoCollisionBlock(shapes)) {
                categories.nonStandardShapes.push(blockInfo);
            } else if (this.isFullBlock(shapes)) {
                categories.fullBlocks.push(blockInfo);
            } else if (this.isPartialBlock(shapes)) {
                categories.partialBlocks.push(blockInfo);
            } else if (this.isSpecialBlock(shapes)) {
                categories.specialBlocks.push(blockInfo);
            } else {
                categories.nonStandardShapes.push(blockInfo);
            }
        }

        return categories;
    }

    isNoCollisionBlock(shapes) {
        return shapes.every(shape => !shape || shape.length === 0);
    }

    isFullBlock(shapes) {
        // A full block has one or more identical shapes that are full blocks
        if (!shapes.length) return false;
        
        // Check if all shapes are either empty or full blocks
        return shapes.every(shape => {
            if (!shape || shape.length !== 1) return false;
            const box = shape[0];
            if (!box || box.length !== 6) return false;

            const width = Math.abs(box[3] - box[0]);
            const height = Math.abs(box[4] - box[1]);
            const depth = Math.abs(box[5] - box[2]);

            return width === 0.5 && height === 0.5 && depth === 0.5;
        });
    }

    isPartialBlock(shapes) {
        // Partial blocks have a single shape with a single box smaller than full size
        if (shapes.length !== 1 || !shapes[0] || shapes[0].length !== 1) return false;
        
        const box = shapes[0][0];
        if (!box || box.length !== 6) return false;

        const width = Math.abs(box[3] - box[0]);
        const height = Math.abs(box[4] - box[1]);
        const depth = Math.abs(box[5] - box[2]);

        return width < 0.5 || height < 0.5 || depth < 0.5;
    }

    isSpecialBlock(shapes) {
        // Special blocks have multiple DIFFERENT shapes or multiple boxes in a shape
        const uniqueShapes = new Set(shapes.map(shape => 
            shape ? JSON.stringify(shape) : 'empty'
        ));
        return uniqueShapes.size > 1 || shapes.some(shape => shape && shape.length > 1);
    }

    getShapeDimensions(box) {
        return {
            width: Math.abs(box[3] - box[0]),
            height: Math.abs(box[4] - box[1]),
            depth: Math.abs(box[5] - box[2])
        };
    }
}

module.exports = BlockAnalyzer; 