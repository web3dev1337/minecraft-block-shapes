const BlockAnalyzer = require('./blockAnalyzer');

async function main() {
    const analyzer = new BlockAnalyzer();
    
    try {
        const categories = await analyzer.loadData();
        
        console.log('Block Analysis Results:');
        console.log('----------------------');
        
        for (const [category, blocks] of Object.entries(categories)) {
            console.log(`\n${category}:`);
            console.log(`Total: ${blocks.length} blocks`);
            console.log('Examples:', blocks.slice(0, 3).map(b => b.name).join(', '));
        }
    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

main(); 