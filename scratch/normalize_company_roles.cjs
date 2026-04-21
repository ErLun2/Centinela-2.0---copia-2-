const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'CompanyDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Normalize role options in the main creation modal
const oldOptions = `                     <option value="GUARD">GUARDIA OPERATIVO</option>
                     <option value="SUPERVISOR">SUPERVISOR</option>
                     <option value="OPERADOR">OPERADOR DE MONITOREO</option>
                     <option value="ADMIN">ADMINISTRADOR DE EMPRESA</option>`;

const newOptions = `                     <option value="GUARD">GUARDIA</option>
                     <option value="SUPERVISOR">SUPERVISOR</option>
                     <option value="OPERADOR">OPERADOR</option>
                     <option value="ADMIN">ADMINISTRADOR</option>`;

if (content.includes(oldOptions.trim())) {
    content = content.replace(oldOptions.trim(), newOptions.trim());
    console.log('Role options replaced');
} else {
    // Try individual replacements if the block doesn't match exactly
    content = content.replace('value="GUARD">GUARDIA OPERATIVO', 'value="GUARD">GUARDIA');
    content = content.replace('value="OPERADOR">OPERADOR DE MONITOREO', 'value="OPERADOR">OPERADOR');
    content = content.replace('value="ADMIN">ADMINISTRADOR DE EMPRESA', 'value="ADMIN">ADMINISTRADOR');
    console.log('Individual roles updated');
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('ROLES_NORMALIZED');
