const BlockAnalyzer = require('./blockAnalyzer');
const fs = require('fs').promises;
const path = require('path');

// Add getMaterialType helper function
function getMaterialType(blockId) {
    if (blockId.includes('wood') || blockId.includes('planks')) return 'wood';
    if (blockId.includes('stone') || blockId.includes('rock')) return 'stone';
    if (blockId.includes('metal') || blockId.includes('iron')) return 'metal';
    if (blockId.includes('glass')) return 'glass';
    if (blockId.includes('dirt') || blockId.includes('grass')) return 'earth';
    return 'other';
}

async function generateMarkdownReport(categories, stats, analyzer) {
    let md = '# Minecraft Block Shapes Analysis\n\n';
    
    // Categories
    for (const [category, blocks] of Object.entries(categories)) {
        md += `## ${category} (${blocks.length} blocks)\n\n`;
        
        // Add category overview
        md += getCategoryOverview(category) + '\n\n';
        
        // Show first 5 examples with enhanced analysis
        const examples = blocks.slice(0, 5);
        examples.forEach(block => {
            md += `### ${block.id}\n`;
            md += `- Shape Indices: \`[${block.shapeIndices.join(', ')}]\`\n`;
            
            // Add shape analysis
            block.shapes.forEach((shape, index) => {
                if (!shape || shape.length === 0) {
                    md += `- Shape ${block.shapeIndices[index]}: No collision box\n`;
                } else {
                    shape.forEach((box, boxIndex) => {
                        const dimensions = {
                            width: Math.abs(box[3] - box[0]),
                            height: Math.abs(box[4] - box[1]),
                            depth: Math.abs(box[5] - box[2])
                        };
                        md += `- Shape ${block.shapeIndices[index]}, Box ${boxIndex}: \`${JSON.stringify(dimensions)}\`\n`;
                    });
                }
            });

            // Add conversion recommendation
            const recommendation = analyzer.getConversionRecommendation(block, category);
            if (recommendation) {
                md += '\nConversion Recommendation:\n';
                md += `- Difficulty: ${recommendation.difficulty}\n`;
                md += `- Strategy: ${recommendation.strategy}\n`;
                md += `- Notes: ${recommendation.notes}\n`;
            }

            // Add detailed block analysis
            const analysis = analyzer.analyzeBlockType(block);
            if (analysis.category) {
                md += '\nBlock Analysis:\n';
                md += `- Category: ${analysis.category}\n`;
                md += `- Sub-type: ${analysis.subType}\n`;
                md += `- Properties: ${analysis.properties.join(', ')}\n`;
                if (analysis.behaviorNotes.length > 0) {
                    md += `- Behavior Notes: ${analysis.behaviorNotes.join(', ')}\n`;
                }
            }

            md += '\n';
        });
        
        // Add category statistics
        md += '### Category Statistics\n';
        md += getCategoryStats(blocks) + '\n\n';
        
        // List all blocks in category
        md += '### All blocks in this category:\n';
        md += blocks.map(b => `- ${b.id}`).join('\n');
        md += '\n\n';
    }
    
    // Statistics
    md += '## Statistics\n\n';
    md += '### General\n';
    md += `- Total blocks analyzed: ${stats.total}\n`;
    md += `- Full blocks (1x1x1): ${stats.fullBlocks}\n`;
    md += `- Partial blocks: ${stats.partialBlocks}\n`;
    md += `- Special blocks: ${stats.specialBlocks}\n`;
    md += `- Non-standard shapes: ${stats.nonStandardShapes}\n\n`;
    
    md += '### Detailed\n';
    md += `- Blocks with no collision: ${stats.noCollision}\n`;
    md += `- Blocks with multiple shapes: ${stats.multiShape}\n`;
    md += `- Blocks with multiple collision boxes: ${stats.multiBox}\n`;
    
    return md;
}

function getCategoryOverview(category) {
    const overviews = {
        fullBlocks: 'Standard cubic blocks that occupy a full 1x1x1 space. These are the easiest to convert and can be directly mapped to target game blocks.',
        partialBlocks: 'Blocks that occupy less than a full block space. These require careful consideration of scaling and placement in the target game.',
        specialBlocks: 'Blocks with complex shapes or multiple states. These may need special handling or simplification for conversion.',
        nonStandardShapes: 'Blocks with unique or no collision shapes. These may need custom implementation or could be omitted.'
    };
    return overviews[category] || '';
}

function getCategoryStats(blocks) {
    const stats = {
        totalBlocks: blocks.length,
        uniqueShapes: new Set(blocks.flatMap(b => b.shapeIndices)).size,
        materialTypes: new Set(blocks.map(b => getMaterialType(b.id))).size
    };
    
    return `- Total Blocks: ${stats.totalBlocks}\n` +
           `- Unique Shapes: ${stats.uniqueShapes}\n` +
           `- Material Types: ${stats.materialTypes}`;
}

// Add this function
function generateBlockMetadata(block, category, analyzer) {
    const baseMetadata = {
        id: block.id,
        importCategory: category,
        collisionData: {
            shapes: block.shapes,
            boundingBox: calculateBoundingBox(block.shapes),
            hasCollision: block.shapes.some(shape => shape && shape.length > 0),
            height: {
                exact: analyzer.getBlockHeight(block.shapes),
                category: analyzer.categorizeHeight(analyzer.getBlockHeight(block.shapes))
            }
        },
        gameConversion: {
            canImport: category === 'fullBlocks',
            complexity: getComplexityRating(category),
            recommendation: analyzer.getConversionRecommendation(block, category),
        },
        materialInfo: {
            type: getMaterialType(block.id),
            isTransparent: block.id.includes('glass') || block.id.includes('ice'),
            isInteractive: isInteractiveBlock(block.id)
        },
        blockBehavior: {
            hasStates: block.shapes.length > 1,
            isDirectional: isDirectionalBlock(block.id),
            needsSupport: needsSupport(block.id),
            hasGravity: hasGravity(block.id)
        }
    };

    // Add specific conversion notes
    if (category === 'partialBlocks') {
        const dims = getMainDimensions(block.shapes);
        baseMetadata.scalingInfo = {
            originalSize: dims,
            recommendedScale: calculateRecommendedScale(dims),
            canUseFullBlock: dims.height > 0.8
        };
    }

    return baseMetadata;
}

function getComplexityRating(category) {
    const ratings = {
        fullBlocks: 1,
        partialBlocks: 2,
        specialBlocks: 4,
        nonStandardShapes: 3
    };
    return ratings[category] || 5;
}

function calculateBoundingBox(shapes) {
    if (!shapes.length || !shapes[0] || !shapes[0].length) {
        return { width: 0, height: 0, depth: 0 };
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    shapes.forEach(shape => {
        if (shape) {
            shape.forEach(box => {
                minX = Math.min(minX, box[0]);
                minY = Math.min(minY, box[1]);
                minZ = Math.min(minZ, box[2]);
                maxX = Math.max(maxX, box[3]);
                maxY = Math.max(maxY, box[4]);
                maxZ = Math.max(maxZ, box[5]);
            });
        }
    });

    return {
        width: Math.abs(maxX - minX),
        height: Math.abs(maxY - minY),
        depth: Math.abs(maxZ - minZ)
    };
}

function isInteractiveBlock(id) {
    return /door|button|lever|chest|furnace|table|gate/.test(id);
}

function isDirectionalBlock(id) {
    return /stairs|door|torch|ladder|sign|button|lever|gate/.test(id);
}

function needsSupport(id) {
    return /torch|ladder|sign|rail|lever|button|carpet|pressure_plate/.test(id);
}

function hasGravity(id) {
    return /sand|gravel|anvil|dragon_egg/.test(id);
}

// Add these functions after the other helper functions

function getMainDimensions(shapes) {
    // Get the first non-empty shape's dimensions
    const firstShape = shapes.find(shape => shape && shape.length > 0);
    if (!firstShape || !firstShape[0]) {
        return { width: 0, height: 0, depth: 0 };
    }

    const box = firstShape[0];
    return {
        width: Math.abs(box[3] - box[0]),
        height: Math.abs(box[4] - box[1]),
        depth: Math.abs(box[5] - box[2])
    };
}

function calculateRecommendedScale(dimensions) {
    // Calculate recommended scaling based on dimensions
    const { width, height, depth } = dimensions;
    
    // If any dimension is very small (less than 0.2), suggest scaling up
    if (width < 0.2 || height < 0.2 || depth < 0.2) {
        return {
            factor: 2,
            reason: "Very small dimensions, suggest scaling up for visibility"
        };
    }

    // If dimensions are close to half-block
    if (width <= 0.5 && height <= 0.5 && depth <= 0.5) {
        return {
            factor: 0.5,
            reason: "Half-block size, can use half-scale"
        };
    }

    // If dimensions are close to full block
    if (width > 0.8 || height > 0.8 || depth > 0.8) {
        return {
            factor: 1,
            reason: "Close to full block size, suggest using full block"
        };
    }

    // For other cases, suggest proportional scaling
    const maxDimension = Math.max(width, height, depth);
    return {
        factor: Math.ceil(maxDimension * 2) / 2, // Round up to nearest 0.5
        reason: "Proportional scaling based on largest dimension"
    };
}

function generateMinimalBlockMetadata(block, category, analyzer) {
    return {
        id: block.id,
        importCategory: category,
        properties: {
            hasCollision: block.collisionData.hasCollision,
            isTransparent: block.materialInfo.isTransparent,
            isInteractive: block.materialInfo.isInteractive,
            hasStates: block.blockBehavior.hasStates
        },
        height: block.collisionData.height
    };
}

// Generate minimal report
async function generateReports(analyzer, stats, categories) {
    const minimalReport = {
        metadata: {
            version: "1.0.0",
            totalBlocks: stats.total
        },
        blocks: Object.entries(categories).flatMap(([category, blocks]) => 
            blocks.map(block => ({
                id: block.id,
                importCategory: category,
                properties: {
                    hasCollision: block.shapes.some(shape => shape && shape.length > 0),
                    isTransparent: block.id.includes('glass') || block.id.includes('ice'),
                    isInteractive: isInteractiveBlock(block.id),
                    hasStates: block.shapes.length > 1
                },
                height: {
                    exact: analyzer.getBlockHeight(block.shapes),
                    category: analyzer.categorizeHeight(analyzer.getBlockHeight(block.shapes))
                }
            }))
        )
    };
    
    await fs.writeFile(
        'reports/block-shapes-minimal.json', 
        JSON.stringify(minimalReport, null, 2)
    );
}

async function main() {
    const analyzer = new BlockAnalyzer();
    
    try {
        const categories = await analyzer.loadData();
        
        console.log('Block Shape Analysis Results:');
        console.log('----------------------------');
        
        for (const [category, blocks] of Object.entries(categories)) {
            console.log(`\n${category}:`);
            console.log(`Total: ${blocks.length} blocks`);
            if (blocks.length > 0) {
                console.log('Examples:');
                blocks.slice(0, 3).forEach(block => {
                    console.log(`  - Block: ${block.id}`);
                    console.log(`    Shape Indices: [${block.shapeIndices.join(', ')}]`);
                    
                    // Process each shape
                    block.shapes.forEach((shape, index) => {
                        if (!shape || shape.length === 0) {
                            console.log(`    Shape ${block.shapeIndices[index]}: No collision box`);
                        } else {
                            shape.forEach((box, boxIndex) => {
                                const dimensions = {
                                    width: Math.abs(box[3] - box[0]),
                                    height: Math.abs(box[4] - box[1]),
                                    depth: Math.abs(box[5] - box[2])
                                };
                                console.log(`    Shape ${block.shapeIndices[index]}, Box ${boxIndex}: ${JSON.stringify(dimensions)}`);
                            });
                        }
                    });
                });
            }
        }

        // Calculate statistics
        const stats = {
            total: Object.values(categories).reduce((sum, arr) => sum + arr.length, 0),
            fullBlocks: categories.fullBlocks.length,
            partialBlocks: categories.partialBlocks.length,
            specialBlocks: categories.specialBlocks.length,
            nonStandardShapes: categories.nonStandardShapes.length,
            noCollision: categories.nonStandardShapes.filter(block => 
                block.shapes.every(shape => !shape || shape.length === 0)
            ).length,
            multiShape: categories.specialBlocks.filter(block => block.shapes.length > 1).length,
            multiBox: categories.specialBlocks.filter(block => 
                block.shapes.some(shape => shape && shape.length > 1)
            ).length
        };

        // Generate reports
        const reportDir = path.join(__dirname, '../reports');
        await fs.mkdir(reportDir, { recursive: true });

        // Modify the JSON report generation in main():
        const jsonReport = {
            metadata: {
                generatedAt: new Date().toISOString(),
                version: "1.0.0",
                totalBlocks: stats.total,
                categories: {
                    fullBlocks: stats.fullBlocks,
                    partialBlocks: stats.partialBlocks,
                    specialBlocks: stats.specialBlocks,
                    nonStandardShapes: stats.nonStandardShapes
                }
            },
            conversionStats: {
                directlyImportable: stats.fullBlocks,
                requiresScaling: stats.partialBlocks,
                requiresCustomImplementation: stats.specialBlocks + stats.nonStandardShapes,
                noCollisionBlocks: stats.noCollision,
                multiStateBlocks: stats.multiShape
            },
            blocks: Object.entries(categories).flatMap(([category, blocks]) => 
                blocks.map(block => generateBlockMetadata(block, category, analyzer))
            ),
            categoryOverviews: {
                fullBlocks: "Direct 1:1 conversion possible",
                partialBlocks: "Requires scaling or adaptation",
                specialBlocks: "Needs custom implementation",
                nonStandardShapes: "Consider simplified alternatives"
            }
        };
        await fs.writeFile(
            path.join(reportDir, 'block-shapes.json'), 
            JSON.stringify(jsonReport, null, 2)
        );

        // Save Markdown report - pass analyzer instance
        const markdownReport = await generateMarkdownReport(categories, stats, analyzer);
        await fs.writeFile(
            path.join(reportDir, 'block-shapes.md'),
            markdownReport
        );

        // Add new minimal report generation with stats
        await generateReports(analyzer, stats, categories);

        console.log('\nReports generated:');
        console.log('- JSON report: reports/block-shapes.json');
        console.log('- Markdown report: reports/block-shapes.md');
        console.log('- Minimal JSON report: reports/block-shapes-minimal.json');

    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

main(); 