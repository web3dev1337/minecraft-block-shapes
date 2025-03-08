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

    categorizeHeight(height) {
        if (height >= 1.0) return 'full';
        if (height >= 0.875) return 'almost_full';
        if (height >= 0.5) return 'half';
        if (height >= 0.125) return 'slab';
        return 'minimal';
    }

    getBlockHeight(shapes) {
        if (!shapes || shapes.length === 0) return 0;
        
        // Get maximum height from all shapes
        let maxHeight = 0;
        for (const shape of shapes) {
            if (!shape || shape.length === 0) continue;
            for (const box of shape) {
                const dims = this.getShapeDimensions(box);
                maxHeight = Math.max(maxHeight, dims.height);
            }
        }
        return maxHeight;
    }

    getConversionRecommendation(block, category) {
        switch(category) {
            case 'fullBlocks':
                return {
                    difficulty: 'Easy',
                    strategy: 'Direct 1:1 conversion',
                    notes: 'Can be directly mapped as standard cube blocks'
                };

            case 'partialBlocks': {
                const shape = block.shapes[0]?.[0];
                if (!shape) return null;
                
                const dims = this.getShapeDimensions(shape);
                if (dims.height < 0.25) {
                    return {
                        difficulty: 'Medium',
                        strategy: 'Convert as flat surface',
                        notes: `Very thin block (height: ${dims.height}), consider as decorative surface`
                    };
                }
                
                if (dims.width === dims.depth && dims.width < 0.5) {
                    return {
                        difficulty: 'Medium',
                        strategy: 'Convert as centered post',
                        notes: `Centered ${dims.width}x${dims.height}x${dims.depth} block, consider as post/pole`
                    };
                }

                return {
                    difficulty: 'Medium',
                    strategy: 'Scale to nearest block unit',
                    notes: `Partial block ${dims.width}x${dims.height}x${dims.depth}, consider scaling or using closest standard size`
                };
            }

            case 'specialBlocks': {
                const hasMultipleShapes = block.shapes.length > 1;
                const hasMultipleBoxes = block.shapes.some(s => s && s.length > 1);
                
                if (block.id.includes('stairs')) {
                    return {
                        difficulty: 'Hard',
                        strategy: 'Simplified stair block',
                        notes: 'Consider implementing as basic stair shape or using ramps'
                    };
                }
                
                if (block.id.includes('door')) {
                    return {
                        difficulty: 'Hard',
                        strategy: 'Two-state block',
                        notes: 'Implement as simple door with open/closed states'
                    };
                }

                if (hasMultipleShapes && !hasMultipleBoxes) {
                    return {
                        difficulty: 'Hard',
                        strategy: 'State-based conversion',
                        notes: 'Block has multiple states, consider implementing primary state only'
                    };
                }

                return {
                    difficulty: 'Complex',
                    strategy: 'Custom implementation',
                    notes: 'Complex shape requires special handling or simplification'
                };
            }

            case 'nonStandardShapes': {
                if (this.isNoCollisionBlock(block.shapes)) {
                    return {
                        difficulty: 'Easy',
                        strategy: 'Decorative element',
                        notes: 'No collision, implement as visual effect or ignore'
                    };
                }

                return {
                    difficulty: 'Hard',
                    strategy: 'Placeholder implementation',
                    notes: 'Consider simplified placeholder or skip'
                };
            }

            default:
                return null;
        }
    }

    analyzeBlockType(block) {
        const analysis = {
            category: '',
            subType: '',
            properties: [],
            behaviorNotes: [],
            height: {
                exact: 0,
                category: ''
            }
        };

        // Add height analysis
        const blockHeight = this.getBlockHeight(block.shapes);
        analysis.height.exact = blockHeight;
        analysis.height.category = this.categorizeHeight(blockHeight);

        // Determine basic category
        if (block.id.includes('stairs')) {
            analysis.category = 'Navigation';
            analysis.subType = 'Stairs';
            analysis.properties.push('Directional', 'Half-block compatible');
        } else if (block.id.includes('slab')) {
            analysis.category = 'Navigation';
            analysis.subType = 'Slab';
            analysis.properties.push('Vertical placement', 'Half-height');
        } else if (block.id.includes('door')) {
            analysis.category = 'Interactive';
            analysis.subType = 'Door';
            analysis.properties.push('Two-state', 'Directional');
        } else if (block.id.includes('fence') || block.id.includes('wall')) {
            analysis.category = 'Barrier';
            analysis.subType = 'Connector';
            analysis.properties.push('Connects to neighbors', 'Partial block');
        }

        // Analyze material type
        if (block.id.includes('wood') || block.id.includes('planks')) {
            analysis.properties.push('Wooden material');
        } else if (block.id.includes('stone') || block.id.includes('brick')) {
            analysis.properties.push('Stone material');
        } else if (block.id.includes('glass')) {
            analysis.properties.push('Transparent');
        }

        // Special behaviors
        if (block.id.includes('redstone')) {
            analysis.category = 'Mechanical';
            analysis.properties.push('Signal conductor');
            analysis.behaviorNotes.push('Requires redstone mechanics');
        }

        return analysis;
    }
}

module.exports = BlockAnalyzer; 