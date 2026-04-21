const fs = require('fs');
const path = require('path');

// 1. Patch CompanyDashboard.jsx (Remove SuperAdmin from company user list)
const companyPath = path.join(__dirname, '..', 'src', 'pages', 'CompanyDashboard.jsx');
let companyContent = fs.readFileSync(companyPath, 'utf-8');

const oldCompanyFilter = `.filter(u => ['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA', 'SUPERVISOR', 'DUEÑO'].includes((u.rol || u.role || '').trim().toUpperCase()))`;
const newCompanyFilter = `.filter(u => ['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA', 'SUPERVISOR', 'DUEÑO'].includes((u.rol || u.role || '').trim().toUpperCase()))
                        .filter(u => (u.email || '').toLowerCase() !== 'vidal@master.com')`;

if (companyContent.includes(oldCompanyFilter)) {
    companyContent = companyContent.replace(oldCompanyFilter, newCompanyFilter);
    console.log('CompanyDashboard filter updated');
}

fs.writeFileSync(companyPath, companyContent, 'utf-8');

// 2. Patch MasterDashboard.jsx (Remove SuperAdmin from the global users list)
const masterPath = path.join(__dirname, '..', 'src', 'pages', 'MasterDashboard.jsx');
let masterContent = fs.readFileSync(masterPath, 'utf-8');

// Find the map/filter logic for the users table in MasterDashboard
// It usually looks like users.filter(...)
const oldMasterFilter = `users.filter(u => selectedCompanyId === 'all' || u.companyId === selectedCompanyId || u.empresaId === selectedCompanyId)`;
const newMasterFilter = `users.filter(u => (u.email || '').toLowerCase() !== 'vidal@master.com')
                .filter(u => selectedCompanyId === 'all' || u.companyId === selectedCompanyId || u.empresaId === selectedCompanyId)`;

if (masterContent.includes(oldMasterFilter)) {
    masterContent = masterContent.replace(oldMasterFilter, newMasterFilter);
    console.log('MasterDashboard filter updated');
} else {
    // Try a more generic one if it failed
    masterContent = masterContent.replace('users.map((u, i) =>', "users.filter(u => (u.email || '').toLowerCase() !== 'vidal@master.com').map((u, i) =>");
    console.log('MasterDashboard map updated via fallback');
}

fs.writeFileSync(masterPath, masterContent, 'utf-8');
console.log('SUPERADMIN_HIDDEN_EVERYWHERE');
