import re

path = r"c:\Users\vidal\OneDrive\Anti-Gravity\Centinela 2.0 - copia (2)\src\pages\CompanyDashboard.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

func_code = """
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
"""

if "const getARDateStr = (dateInput) => {" not in content:
    content = content.replace("const CompanyDashboard = () => {", func_code + "\nconst CompanyDashboard = () => {")

content = content.replace("new Date().toISOString().split('T')[0]", "getARDateStr(new Date())")
content = content.replace("e.fechaRegistro.split('T')[0]", "getARDateStr(e.fechaRegistro)")
content = content.replace("mediaModal.event?.fechaRegistro?.split('T')[0]", "getARDateStr(mediaModal.event?.fechaRegistro)")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Dates logic swapped for Argentina Time successfully.")
