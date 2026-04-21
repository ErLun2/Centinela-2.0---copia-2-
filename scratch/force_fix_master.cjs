const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'MasterDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

if (content.includes('if (uCompany === sName) return true;')) {
    content = content.replace(
        'if (uCompany === sName) return true;',
        'if (u.companyId === selectedCompanyId || u.empresaId === selectedCompanyId || uCompany === sName) return true;'
    );
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('REPLACEMENT_SUCCESSFUL');
} else {
    console.log('PATTERN_NOT_FOUND');
}
