const fs = require('fs');
let content = fs.readFileSync('src/pages/CompanyDashboard.jsx', 'utf8');
content = content.replace(/DÍ[\s\S]{1,2}AS LABORALES/g, 'DÍAS LABORALES');
content = content.replace(/â€¢/g, '•');
fs.writeFileSync('src/pages/CompanyDashboard.jsx', content, 'utf8');
console.log('Fixed DÍAS space and dots');
