const fs = require('fs');

const path = "c:/Users/vidal/OneDrive/Anti-Gravity/Centinela 2.0 - copia (2)/src/pages/CompanyDashboard.jsx";
let content = fs.readFileSync(path, 'utf8');

const targetStr = `                    .filter(e => !resumenFilters.objetivo || e.objetivoId === resumenFilters.objetivo)
                    .filter(e => !resumenFilters.guardia || e.usuario === resumenFilters.guardia || e.usuarioId === resumenFilters.guardia)
                    .filter(e => !resumenFilters.tipo || e.tipo === resumenFilters.tipo)`;

const replacementStr = `                    .filter(e => {
                      if (!resumenFilters.objetivo) return true;
                      let objId = e.objetivoId;
                      if (!objId && typeof e.usuario === 'object' && e.usuario !== null) {
                        const guardUser = companyUsers.find(u => (e.usuario.legajo && u.legajo === e.usuario.legajo) || (e.usuario.nombre && e.usuario.apellido && u.nombre === e.usuario.nombre && u.apellido === e.usuario.apellido));
                        objId = guardUser?.schedule?.objectiveId;
                      }
                      return objId === resumenFilters.objetivo;
                    })
                    .filter(e => {
                      if (!resumenFilters.guardia) return true;
                      if (typeof e.usuario === 'object' && e.usuario !== null) {
                        const targetGuard = companyUsers.find(cu => (cu.id || cu.uid) === resumenFilters.guardia);
                        return e.usuario.id === resumenFilters.guardia || e.usuario.uid === resumenFilters.guardia || e.usuario.id === targetGuard?.id || (targetGuard && e.usuario.legajo && e.usuario.legajo === targetGuard.legajo);
                      }
                      return e.usuario === resumenFilters.guardia || e.usuarioId === resumenFilters.guardia;
                    })
                    .filter(e => {
                      if (!resumenFilters.tipo) return true;
                      const t = (e.tipo || '').toLowerCase();
                      if (resumenFilters.tipo === 'novedad') return t === 'novedad' || t === 'informe';
                      if (resumenFilters.tipo === 'recorrido') return t === 'recorrido' || t === 'ronda_completada' || t === 'recorrido_completado';
                      if (resumenFilters.tipo === 'emergencia') return t === 'emergencia' || t === 'alerta';
                      return t === resumenFilters.tipo;
                    })`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    
    // Also, optionally add Ingreso/Egreso to dropdown just in case
    const optionsTarget = `<option value="emergencia">Emergencias</option>
                </select>`;
    const optionsReplacement = `<option value="emergencia">Emergencias</option>
                  <option value="ingreso">Ingresos / Egresos</option>
                </select>`;
    content = content.replace(optionsTarget, optionsReplacement);

    fs.writeFileSync(path, content, 'utf8');
    console.log("Filters logic updated successfully!");
} else {
    console.log("Could not find the target string. Maybe it was formatted differently.");
}
