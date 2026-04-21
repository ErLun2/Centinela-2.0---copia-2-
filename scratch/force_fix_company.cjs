const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'CompanyDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Pattern to find the restrictive filter in EnterpriseConfigPanel
const searchPattern = ".filter(u => u.rol?.toUpperCase() === 'ADMIN' || u.rol?.toUpperCase() === 'OPERADOR')";
const newFilter = ".filter(u => ['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA', 'SUPERVISOR', 'DUEÑO'].includes(u.rol?.toUpperCase()))";

if (content.includes(searchPattern)) {
    content = content.replace(searchPattern, newFilter);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('REPLACEMENT_SUCCESSFUL');
} else {
    // If not found exactly, try a more flexible search
    console.log('PATTERN_NOT_FOUND_EXACTLY, TRYING REGEX...');
    const regexPattern = /\.filter\(u\s*=>\s*u\.rol\?\.toUpperCase\(\s*\)\s*===\s*'ADMIN'\s*\|\|\s*u\.rol\?\.toUpperCase\(\s*\)\s*===\s*'OPERADOR'\)/;
    if (regexPattern.test(content)) {
        content = content.replace(regexPattern, newFilter);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('REPLACEMENT_SUCCESSFUL_WITH_REGEX');
    } else {
        console.log('REPLACEMENT_FAILED');
    }
}
