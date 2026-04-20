const fs = require('fs');

const replacements = [
    // Double/Triple encoded or Emojis
    { from: /DÃƒÆ’Ã‚Â AS/g, to: 'DÍAS' },
    { from: /DÃƒÆ’Ã‚Â/g, to: 'DÍ' },
    { from: /GESTIÃƒÆ’Ã¢â‚¬Å“N/g, to: 'GESTIÓN' },
    { from: /RESOLUCIÃƒÆ’Ã¢â‚¬Å“N/g, to: 'RESOLUCIÓN' },
    { from: /ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â/g, to: '📍' },
    { from: /ðŸ¢/g, to: '🟢' },
    { from: /ðŸ“‚/g, to: '📂' },
    { from: /ðŸ•’/g, to: '🕒' },
    { from: /Ã¢Å¡Â Ã¯Â¸Â/g, to: '⚠️' },
    
    // Normal single encoding issues
    { from: /Ã“/g, to: 'Ó' },
    { from: /Ã³/g, to: 'ó' },
    { from: /Ã¡/g, to: 'á' },
    { from: /Ã©/g, to: 'é' },
    { from: /Ã­/g, to: 'í' },
    { from: /Ãº/g, to: 'ú' },
    { from: /Ã±/g, to: 'ñ' },
    { from: /Ã‘/g, to: 'Ñ' },
    
    // Specific frequent words
    { from: /ConfiguraciÃ³n/g, to: 'Configuración' },
    { from: /GestiÃ³n/g, to: 'Gestión' },
    { from: /DotaciÃ³n/g, to: 'Dotación' },
    { from: /IdentificaciÃ³n/g, to: 'Identificación' },
    { from: /NotificaciÃ³n/g, to: 'Notificación' },
    { from: /ResoluciÃ³n/g, to: 'Resolución' },
    { from: /estÃ¡/g, to: 'está' },
    { from: /vacÃ­a/g, to: 'vacía' },
    { from: /mÃ³vil/g, to: 'móvil' },
    { from: /aquÃ­/g, to: 'aquí' },
    { from: /DÃ­as/g, to: 'Días' },
    { from: /dÃ­as/g, to: 'días' },
    { from: /SesiÃ³n/g, to: 'Sesión' },
    { from: /TelÃ©fono/g, to: 'Teléfono' },
    { from: /Contraseña/g, to: 'Contraseña' }, // Just in case
];

function cleanFile(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    
    replacements.forEach(rep => {
        content = content.replace(rep.from, rep.to);
    });
    
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`Cleaned ${filename}`);
}

cleanFile(process.argv[2]);
