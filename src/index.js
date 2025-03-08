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
            console.log('Examples:');
            blocks.slice(0, 3).forEach(block => {
                console.log(`  - Block ID: ${block.id}`);
                console.log(`    Shape: ${JSON.stringify(block.shape)}`);
            });
        }

        // Summary
        console.log('\nSummary:');
        console.log('--------');
        console.log(`Total blocks analyzed: ${Object.values(categories).reduce((sum, arr) => sum + arr.length, 0)}`);
        console.log(`Full blocks: ${categories.fullBlocks.length}`);
        console.log(`Partial blocks: ${categories.partialBlocks.length}`);
        console.log(`Non-standard shapes: ${categories.nonStandardShapes.length}`);
        console.log(`Special blocks: ${categories.specialBlocks.length}`);
    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

main(); 