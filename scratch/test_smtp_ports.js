import net from 'net';

const host = 'centinela-security.com';
const ports = [25, 465, 587];

console.log(`=== INICIANDO DIAGNÓSTICO DE PUERTOS SMTP PARA ${host} ===`);

ports.forEach(port => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    
    console.log(`Intentando conectar a ${host}:${port}...`);
    
    socket.connect(port, host, () => {
        console.log(`✅ CONEXIÓN EXITOSA a ${host}:${port}`);
        socket.destroy();
    });
    
    socket.on('data', (data) => {
        console.log(`[RESPUESTA ${port}]:`, data.toString().trim());
        socket.destroy();
    });
    
    socket.on('error', (err) => {
        console.error(`❌ ERROR en ${host}:${port}:`, err.message);
        socket.destroy();
    });
    
    socket.on('timeout', () => {
        console.error(`⌛ TIMEOUT en ${host}:${port}`);
        socket.destroy();
    });
});
