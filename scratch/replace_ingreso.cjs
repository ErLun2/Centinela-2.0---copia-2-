const fs = require('fs');
const path = "c:/Users/vidal/OneDrive/Anti-Gravity/Centinela 2.0 - copia (2)/src/pages/CompanyDashboard.jsx";
let content = fs.readFileSync(path, 'utf8');

const tStr = "if (resumenFilters.tipo === 'emergencia') return t === 'emergencia' || t === 'alerta';";
const replacement = "if (resumenFilters.tipo === 'emergencia') return t === 'emergencia' || t === 'alerta';\n                      if (resumenFilters.tipo === 'ingreso') return t === 'ingreso' || t === 'egreso';";

if (content.includes(tStr) && !content.includes("t === 'egreso'")) {
    content = content.replace(tStr, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Added egreso rule");
}
