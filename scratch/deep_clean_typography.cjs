const fs = require('fs');

const replacements = [
    { from: /DÍ AS/g, to: 'DÍAS' },
    { from: /â€¢/g, to: '•' },
    { from: /Â/g, to: '' }, // Often a trailing artifact of UTF8-to-ISO-8859-1 conversion
    { from: /Ã /g, to: 'à' }, 
];

function cleanFile(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    
    replacements.forEach(rep => {
        content = content.replace(rep.from, rep.to);
    });
    
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`Deep Cleaned ${filename}`);
}

cleanFile(process.argv[2]);
