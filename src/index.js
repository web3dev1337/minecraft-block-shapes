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
                    console.log(`    Shape Index: ${block.shapeIndex}`);
                    console.log(`    Collision Boxes: ${block.shape ? block.shape.length : 0}`);
                    
                    if (block.shape && block.shape.length > 0) {
                        const dimensions = block.shape.map(box => ({
                            width: Math.abs(box[3] - box[0]),
                            height: Math.abs(box[4] - box[1]),
                            depth: Math.abs(box[5] - box[2])
                        }));
                        console.log(`    Dimensions: ${JSON.stringify(dimensions)}`);
                    } else {
                        console.log(`    Dimensions: No collision boxes`);
                    }
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

    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

main(); 