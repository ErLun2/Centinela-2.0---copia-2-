const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'MasterDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

const oldSyncBlock = `        if (!data || data.length === 0) {
            console.log("🚀 Sincronizando planes base con el servidor...");
            for (const plan of defaultPlanesList) {
               await db.guardarPlan({
                 ...plan,
                 beneficios: JSON.stringify(plan.beneficios || [])
               });
            }
            // Re-cargar después de sincronizar
            const updatedData = await db.obtenerPlanes();
            data = updatedData;
         }`;

const newSyncBlock = `        // REGLA DE ORO: Sincronización individual y agresiva de planes core
        const existingPlanIds = (data || []).map(p => (p.id || '').toLowerCase());
        let syncedAny = false;
        for (const plan of defaultPlanesList) {
           if (!existingPlanIds.includes(plan.id.toLowerCase())) {
              console.log(\`🚀 Sincronizando plan faltante: \${plan.id}\`);
              await db.guardarPlan({
                ...plan,
                beneficios: JSON.stringify(plan.beneficios || [])
              });
              syncedAny = true;
           }
        }
        if (syncedAny) {
           const updatedData = await db.obtenerPlanes();
           data = updatedData;
        }`;

if (content.includes('if (!data || data.length === 0)')) {
    // We try to replace the whole block more safely
    const startIdx = content.indexOf('if (!data || data.length === 0)');
    const endIdx = content.indexOf('data = updatedData;', startIdx) + 'data = updatedData;'.length + 10; // estimate
    
    // Better: use direct string replacement if possible
    content = content.replace(oldSyncBlock.trim(), newSyncBlock.trim());
    console.log('Sync block replaced');
} else {
    console.log('Sync block NOT found via simple string match');
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('PROCESS_COMPLETED');
