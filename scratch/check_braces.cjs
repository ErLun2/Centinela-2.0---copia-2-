
const fs = require('fs');
const content = fs.readFileSync('src/pages/MasterDashboard.jsx', 'utf8');
const lines = content.split('\n');
let stack = [];
lines.forEach((line, i) => {
    for (let char of line) {
        if (char === '{') stack.push(i + 1);
        else if (char === '}') {
            if (stack.length === 0) console.log(`Extra closing brace at line ${i + 1}`);
            else stack.pop();
        }
    }
});
if (stack.length > 0) console.log(`Unclosed braces opened at lines: ${stack.join(', ')}`);
else console.log("Braces are balanced");
