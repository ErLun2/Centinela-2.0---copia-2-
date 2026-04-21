const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'CompanyDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix Dotacion Filter
const dotacionSearch = ".filter(u => u.email && u.nombre && !['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA', 'SUPERVISOR', 'DUEÑO'].includes(u.rol?.toUpperCase()))";
const dotacionReplace = ".filter(u => u.email && u.nombre && !['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA', 'SUPERVISOR', 'DUEÑO'].includes((u.rol || u.role || '').trim().toUpperCase()))";

// 2. Fix Turnos Filter
// (It's often the same pattern or very similar)
content = content.split(dotacionSearch).join(dotacionReplace);

// 3. Fix EnterpriseConfigPanel Admin Filter
const configSearch = ".filter(u => ['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA', 'SUPERVISOR', 'DUEÑO'].includes(u.rol?.toUpperCase()))";
const configReplace = ".filter(u => ['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA', 'SUPERVISOR', 'DUEÑO'].includes((u.rol || u.role || '').trim().toUpperCase()))";

if (content.includes(configSearch)) {
    content = content.replace(configSearch, configReplace);
    console.log('Config filter replaced');
}

// 4. Ensure Anthony Stark specifically shows up if role is 'Admin'
// (The above already covers it with .toUpperCase(), but let's be sure about companyId)
// The main issue is the parent filter at line 883. Let's make it smarter.
const parentFilterSearch = "const filtered = allUsers.filter(u => u.empresaId === user.empresaId || u.companyId === user.empresaId);";
const parentFilterReplace = "const filtered = allUsers.filter(u => u.empresaId === user.empresaId || u.companyId === user.empresaId || u.company === companyData?.nombre);";

if (content.includes(parentFilterSearch)) {
    content = content.replace(parentFilterSearch, parentFilterReplace);
    console.log('Parent filter replaced');
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('FINAL_NORMALIZATION_SUCCESSFUL');
