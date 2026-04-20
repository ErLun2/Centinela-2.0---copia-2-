const fs = require('fs');
const path = 'src/pages/CompanyDashboard.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// We want to remove lines that contain "SIN MULTIMEDIAS ADJUNTAS" at specific locations 
// and the broken closing tags.
// Let's identify the lines exactly.
// From 2383 to 2391 (0-indexed: 2382 to 2390)

const resultLines = [...lines];

// Instead of absolute index, let's find the problematic section
const startSearch = 2380;
const endSearch = 2400;

for (let i = startSearch; i < endSearch; i++) {
    if (resultLines[i] && resultLines[i].includes('SIN MULTIMEDIAS ADJUNTAS') && resultLines[i].trim().startsWith('<div')) {
        console.log('Found garbage start at line', i + 1);
        // Remove 7 lines
        resultLines.splice(i, 7);
        break;
    }
}

fs.writeFileSync(path, resultLines.join('\n'));
console.log('Done cleaning CompanyDashboard.jsx');
