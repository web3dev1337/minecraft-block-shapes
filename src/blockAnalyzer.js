const fs = require('fs').promises;
const path = require('path');

class BlockAnalyzer {
    constructor() {
        this.blocksData = null;
        this.collisionsData = null;
        this.modelsData = null;
    }

    async loadData() {
        try {
            const blocksPath = path.join(__dirname, '../minecraft-data-1.21/data/pc/1.21/blocks.json');
            const blocks = await fs.readFile(blocksPath, 'utf8');
            this.blocksData = JSON.parse(blocks);

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

        for (const block of this.blocksData) {
            // Initial categorization based on block properties
            if (this.isFullBlock(block)) {
                categories.fullBlocks.push(block);
            } else if (this.isPartialBlock(block)) {
                categories.partialBlocks.push(block);
            } else if (this.isSpecialBlock(block)) {
                categories.specialBlocks.push(block);
            } else {
                categories.nonStandardShapes.push(block);
            }
        }

        return categories;
    }

    isFullBlock(block) {
        // Basic check for full blocks (can be expanded)
        const fullBlockKeywords = ['stone', 'dirt', 'wood', 'log', 'planks'];
        return fullBlockKeywords.some(keyword => block.name.includes(keyword));
    }

    isPartialBlock(block) {
        const partialBlockKeywords = ['slab', 'stairs', 'wall', 'fence'];
        return partialBlockKeywords.some(keyword => block.name.includes(keyword));
    }

    isSpecialBlock(block) {
        const specialBlockKeywords = ['door', 'bed', 'chest', 'furnace'];
        return specialBlockKeywords.some(keyword => block.name.includes(keyword));
    }
}

module.exports = BlockAnalyzer; 