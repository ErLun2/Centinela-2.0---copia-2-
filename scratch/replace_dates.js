const fs = require('fs');

const path = "c:/Users/vidal/OneDrive/Anti-Gravity/Centinela 2.0 - copia (2)/src/pages/CompanyDashboard.jsx";
let content = fs.readFileSync(path, 'utf8');

const func_code = `
// Helper to get Argentina local date string YYYY-MM-DD
const getARDateStr = (dateInput) => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput.split('T')[0] : '';
    // Ajustar a UTC-3. Restamos 3 horas al UTC.
    const arDate = new Date(d.getTime() - (3 * 60 * 60 * 1000));
    return arDate.toISOString().split('T')[0];
  } catch (e) {
    return String(dateInput).split('T')[0];
  }
};
`;

if (!content.includes('const getARDateStr = (dateInput) => {')) {
    content = content.replace("const CompanyDashboard = () => {", func_code + "\nconst CompanyDashboard = () => {");
}

content = content.split("new Date().toISOString().split('T')[0]").join("getARDateStr(new Date())");
content = content.split("e.fechaRegistro.split('T')[0]").join("getARDateStr(e.fechaRegistro)");
content = content.split("mediaModal.event?.fechaRegistro?.split('T')[0]").join("getARDateStr(mediaModal.event?.fechaRegistro)");

fs.writeFileSync(path, content, 'utf8');
console.log("Dates logic swapped for Argentina Time successfully.");
