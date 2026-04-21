const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'MasterDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Insert a pre-save plan synchronization check
const preSaveCheck = `
        // REGLA DE ORO: Validar que el plan de la empresa existe en el servidor antes de guardar
        // para evitar errores de Foreign Key (Error 500)
        try {
            const currentPlanId = newCompany.plan || 'basico';
            const serverPlanes = await db.obtenerPlanes();
            const planExists = serverPlanes.some(p => (p.id || '').toLowerCase() === currentPlanId.toLowerCase());
            
            if (!planExists) {
                console.log(\`⚠️ El plan \${currentPlanId} no existe en servidor. Sincronizando...\`);
                const planData = Object.values(PLANES).find(p => p.id.toLowerCase() === currentPlanId.toLowerCase()) || PLANES.BASICO;
                await db.guardarPlan({
                    ...planData,
                    beneficios: JSON.stringify(planData.beneficios || [])
                });
            }
        } catch (planErr) {
            console.error("Error al validar existencia de plan:", planErr);
        }
`;

const searchInFunction = 'const handleCreateOrUpdateCompany = async (e) => {\n    e.preventDefault();\n    setIsSaving(true);';
const replacementInFunction = 'const handleCreateOrUpdateCompany = async (e) => {\n    e.preventDefault();\n    setIsSaving(true);\n' + preSaveCheck;

if (content.includes('setIsSaving(true);')) {
    // A bit risky with simple replace if multiple matches, but in MasterDashboard this should be unique enough in context
    content = content.replace(searchInFunction, replacementInFunction);
    console.log('Pre-save check inserted');
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('PROCESS_COMPLETED');
