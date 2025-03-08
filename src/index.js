const BlockAnalyzer = require('./blockAnalyzer');
const fs = require('fs').promises;
const path = require('path');

async function generateMarkdownReport(categories, stats) {
    let md = '# Minecraft Block Shapes Analysis\n\n';
    
    // Categories
    for (const [category, blocks] of Object.entries(categories)) {
        md += `## ${category} (${blocks.length} blocks)\n\n`;
        
        // Show first 5 examples
        const examples = blocks.slice(0, 5);
        examples.forEach(block => {
            md += `### ${block.id}\n`;
            md += `- Shape Indices: \`[${block.shapeIndices.join(', ')}]\`\n`;
            
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
            md += '\n';
        });
        
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

        // Save JSON report
        const jsonReport = {
            categories,
            statistics: stats,
            metadata: {
                generatedAt: new Date().toISOString(),
                totalBlocks: stats.total
            }
        };
        await fs.writeFile(
            path.join(reportDir, 'block-shapes.json'), 
            JSON.stringify(jsonReport, null, 2)
        );

        // Save Markdown report
        const markdownReport = await generateMarkdownReport(categories, stats);
        await fs.writeFile(
            path.join(reportDir, 'block-shapes.md'),
            markdownReport
        );

        console.log('\nReports generated:');
        console.log('- JSON report: reports/block-shapes.json');
        console.log('- Markdown report: reports/block-shapes.md');

    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

main(); 