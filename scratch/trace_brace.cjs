
const fs = require('fs');
const content = fs.readFileSync('src/pages/MasterDashboard.jsx', 'utf8');
const lines = content.split('\n');
let stack = [];
lines.forEach((line, i) => {
    for (let char of line) {
        if (char === '{') stack.push(i + 1);
        else if (char === '}') {
            let openedAt = stack.pop();
            if (openedAt === 28) console.log(`Brace opened at line 28 was closed at line ${i + 1}`);
            if (openedAt === undefined) console.log(`Extra closing brace at line ${i + 1}`);
        }
    }
});
