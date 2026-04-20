const fs = require('fs');

function removeLines(filename, startLine, endLine) {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split(/\r?\n/);
    
    // Lines are 1-indexed
    const newLines = lines.filter((_, idx) => {
        const lineNum = idx + 1;
        return lineNum < startLine || lineNum > endLine;
    });
    
    fs.writeFileSync(filename, newLines.join('\n'), 'utf8');
    console.log(`Removed lines ${startLine} to ${endLine}`);
}

const args = process.argv.slice(2);
removeLines(args[0], parseInt(args[1]), parseInt(args[2]));
