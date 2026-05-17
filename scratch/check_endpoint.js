import https from 'https';

const url = 'https://centinela-backend.onrender.com/api/test-email';

console.log(`Realizando petición GET a: ${url}...`);

const req = https.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Body:', data);
    });
});

req.on('error', (e) => {
    console.error(`Error de conexión: ${e.message}`);
});

req.setTimeout(60000, () => {
    console.error('Timeout superado (60s). El servidor de Render podría tardar en arrancar.');
    req.destroy();
});
