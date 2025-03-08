const BlockAnalyzer = require('./blockAnalyzer');

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

        // Summary
        console.log('\nSummary:');
        console.log('--------');
        const total = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`Total blocks analyzed: ${total}`);
        console.log(`Full blocks (1x1x1): ${categories.fullBlocks.length}`);
        console.log(`Partial blocks (smaller than 1x1x1): ${categories.partialBlocks.length}`);
        console.log(`Special blocks (multiple boxes): ${categories.specialBlocks.length}`);
        console.log(`Non-standard shapes: ${categories.nonStandardShapes.length}`);

        // Additional statistics
        console.log('\nDetailed Statistics:');
        console.log('-----------------');
        const noCollision = categories.nonStandardShapes.filter(block => 
            block.shapes.every(shape => !shape || shape.length === 0)
        ).length;
        console.log(`Blocks with no collision: ${noCollision}`);
        
        const multiShape = categories.specialBlocks.filter(block => block.shapes.length > 1).length;
        console.log(`Blocks with multiple shapes: ${multiShape}`);
        
        const multiBox = categories.specialBlocks.filter(block => 
            block.shapes.some(shape => shape && shape.length > 1)
        ).length;
        console.log(`Blocks with multiple collision boxes: ${multiBox}`);

    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

main(); 