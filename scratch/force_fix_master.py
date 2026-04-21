import os

file_path = r"c:\Users\vidal\OneDrive\Anti-Gravity\Centinela 2.0 - copia (2)\src\pages\MasterDashboard.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.readlines()

new_content = []
found = False
for line in content:
    if "if (uCompany === sName) return true;" in line:
        old_indent = line[:line.find("if")]
        new_content.append(f"{old_indent}// 1. Coincidencia por ID o Nombre exacto (Doble validación)\n")
        new_content.append(f"{old_indent}if (u.companyId === selectedCompanyId || u.empresaId === selectedCompanyId || uCompany === sName) return true;\n")
        found = True
    else:
        new_content.append(line)

if found:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_content)
    print("REPLACEMENT_SUCCESSFUL")
else:
    print("PATTERN_NOT_FOUND")
