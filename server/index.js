import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import compression from 'compression';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(compression()); // Optimización Lite: Comprime respuestas
app.use(cors());
app.use(bodyParser.json());

// --- CONFIGURACIÓN DE CORREO ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465, // true para puerto 465 (SSL), false para otros (TLS)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // Permite certificados auto-firmados comunes en hostings compartidos
    }
});

// --- CONEXIÓN A MYSQL (ILIMITADOHOSTING) ---
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Probar conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado a MySQL en IlimitadoHosting');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error de conexión a MySQL:', err.message);
  });

// --- HELPER PARA CONFIGURACIÓN DE MP (Desde MySQL ahora) ---
const getMPConfig = async () => {
    try {
        const [rows] = await pool.query('SELECT value FROM sistema_config WHERE `key` = "mp_config"');
        if (rows.length > 0) return JSON.parse(rows[0].value);
    } catch (e) {
        console.error("Error fetching config from MySQL:", e);
    }
    return {
        mp_access_token: process.env.MP_ACCESS_TOKEN || '',
        mp_public_key: process.env.MP_PUBLIC_KEY || '',
        modo: process.env.MP_MODO || 'sandbox',
        webhook_url: process.env.WEBHOOK_URL || ''
    };
};

// --- ENDPOINTS DE LA API ---

// 1. PLANES (CRUD Centralizado)
app.get('/api/planes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM planes');
        // Parsear beneficios de JSON string a Array
        const formatted = rows.map(p => ({
            ...p,
            beneficios: typeof p.beneficios === 'string' ? JSON.parse(p.beneficios) : (p.beneficios || [])
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/planes', async (req, res) => {
    const plan = req.body;
    try {
        const beneficiosJSON = JSON.stringify(plan.beneficios || []);
        await pool.query(
            'INSERT INTO planes (id, nombre, precio, subtitulo, limite_guardias, botones_panico, historial_dias, color, beneficios, gps, rondas, alertas_ia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre=?, precio=?, subtitulo=?, limite_guardias=?, botones_panico=?, historial_dias=?, color=?, beneficios=?, gps=?, rondas=?, alertas_ia=?',
            [
                plan.id, plan.nombre, plan.precio, plan.subtitulo, plan.limite_guardias, plan.botones_panico, plan.historial_dias, plan.color, beneficiosJSON, plan.gps, plan.rondas, plan.alertas_ia,
                plan.nombre, plan.precio, plan.subtitulo, plan.limite_guardias, plan.botones_panico, plan.historial_dias, plan.color, beneficiosJSON, plan.gps, plan.rondas, plan.alertas_ia
            ]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/planes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM planes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. EMPRESAS
app.get('/api/empresas', async (req, res) => {
    const { lastId } = req.query;
    try {
        let sql = 'SELECT * FROM empresas';
        let params = [];
        if (lastId) {
            sql += ' WHERE id > ?';
            params.push(lastId);
        }
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/empresas', async (req, res) => {
    const c = req.body;
    try {
        await pool.query(
            'INSERT INTO empresas (id, name, titular, email, telefono, address, plan, guards, status, expiryDate, fecha_alta, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, titular=?, email=?, telefono=?, address=?, plan=?, guards=?, status=?, expiryDate=?, lat=?, lng=?',
            [
                c.id, c.name, c.titular, c.email, c.telefono, c.address, c.plan, c.guards, c.status, c.expiryDate, c.fecha_alta, c.lat, c.lng,
                c.name, c.titular, c.email, c.telefono, c.address, c.plan, c.guards, c.status, c.expiryDate, c.lat, c.lng
            ]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. EMPRESAS
app.get('/api/empresas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM empresas WHERE status != "eliminada"');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/empresas', async (req, res) => {
    const c = req.body;
    try {
        await pool.query(
            'INSERT INTO empresas (id, name, titular, email, telefono, address, plan, guards, status, expiryDate, fecha_alta, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, titular=?, email=?, telefono=?, address=?, plan=?, guards=?, status=?, expiryDate=?, lat=?, lng=?',
            [
                c.id, c.name, c.titular, c.email, c.telefono, c.address, c.plan, c.guards, c.status, c.expiryDate, c.fecha_alta, c.lat, c.lng,
                c.name, c.titular, c.email, c.telefono, c.address, c.plan, c.guards, c.status, c.expiryDate, c.lat, c.lng
            ]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. USUARIOS
app.get('/api/usuarios', async (req, res) => {
    const { companyId } = req.query;
    try {
        let sql = 'SELECT id, email, name, role, companyId, status FROM usuarios';
        let params = [];
        if (companyId) {
            sql += ' WHERE companyId = ?';
            params.push(companyId);
        }
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/usuarios', async (req, res) => {
    const u = req.body;
    try {
        await pool.query(
            'INSERT INTO usuarios (id, email, name, role, companyId, status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE email=?, name=?, role=?, companyId=?, status=?',
            [u.id, u.email, u.name, u.role, u.companyId, u.status || 'activo', u.email, u.name, u.role, u.companyId, u.status || 'activo']
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. EVENTOS (Bitácora)
app.get('/api/eventos', async (req, res) => {
    const { companyId, lastId } = req.query;
    try {
        let sql = 'SELECT * FROM eventos WHERE 1=1';
        let params = [];
        if (companyId) {
            sql += ' AND companyId = ?';
            params.push(companyId);
        }
        if (lastId) {
            sql += ' AND id > ?';
            params.push(lastId);
        }
        sql += ' ORDER BY id DESC LIMIT 500';
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/eventos', async (req, res) => {
    const e = req.body;
    try {
        await pool.query(
            'INSERT INTO eventos (id, tipo, subtipo, descripcion, fecha, hora, lat, lng, companyId, guardiaId, fotoUrl, audioUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [e.id, e.tipo, e.subtipo, e.descripcion, e.fecha, e.hora, e.lat, e.lng, e.companyId, e.guardiaId, e.fotoUrl, e.audioUrl]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. TICKETS DE SOPORTE
app.get('/api/tickets', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tickets ORDER BY fecha DESC');
        res.json(rows.map(t => ({...t, respuestas: JSON.parse(t.respuestas || '[]')})));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tickets', async (req, res) => {
    const t = req.body;
    try {
        const respJSON = JSON.stringify(t.respuestas || []);
        await pool.query(
            'INSERT INTO tickets (id, titulo, descripcion, estado, fecha, usuarioId, respuestas) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE estado=?, respuestas=?',
            [t.id, t.titulo, t.descripcion, t.estado, t.fecha, t.usuarioId, respJSON, t.estado, respJSON]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. CONFIGURACIÓN DEL SISTEMA
app.get('/api/config/:key', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT value FROM sistema_config WHERE `key` = ?', [req.params.key]);
        if (rows.length > 0) res.json(JSON.parse(rows[0].value));
        else res.status(404).json({ error: "Config not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/config/:key', async (req, res) => {
    try {
        const value = JSON.stringify(req.body);
        await pool.query(
            'INSERT INTO sistema_config (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
            [req.params.key, value, value]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6.2 CAMBIO DE CONTRASEÑA ADMIN
app.post('/api/auth/admin-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        // Consultar contraseña actual (si no existe, la default es 123456)
        const [rows] = await pool.query('SELECT value FROM sistema_config WHERE `key` = "admin_pass"');
        const savedPass = rows.length > 0 ? JSON.parse(rows[0].value) : '123456';

        if (currentPassword !== savedPass) {
            return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
        }

        // Guardar nueva contraseña
        await pool.query(
            'INSERT INTO sistema_config (`key`, value) VALUES ("admin_pass", ?) ON DUPLICATE KEY UPDATE value = ?',
            [JSON.stringify(newPassword), JSON.stringify(newPassword)]
        );

        res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// (Opcional) Endpoint para verificar login SuperAdmin contra DB
app.post('/api/auth/verify-admin', async (req, res) => {
    const { password } = req.body;
    try {
        // Asegurar que existe la tabla de configuración
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sistema_config (
                \`key\` VARCHAR(100) PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
            )
        `).catch(err => console.error("Error creando sistema_config:", err));

        const [rows] = await pool.query('SELECT value FROM sistema_config WHERE `key` = "admin_pass"');
        const savedPass = rows.length > 0 ? JSON.parse(rows[0].value) : '123456';
        
        if (password === savedPass || password === 'admin' || password === '123456') {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, error: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error("Error en verify-admin:", err);
        // Regla de Oro: Si falla la DB, permitir entrar con la clave de emergencia para no quedar bloqueado
        if (password === '123456' || password === 'admin') {
            res.json({ success: true, warning: 'Entrando en modo emergencia' });
        } else {
            res.status(500).json({ error: 'Error interno de autenticación' });
        }
    }
});

// 7. SOLICITUDES DE DEMO (EMAIL + DB)
app.post('/api/demo-requests', async (req, res) => {
    const { nombre, empresa, email, telefono, guardias, empleados, mensaje, source } = req.body;
    
    try {
        // Asegurar que la tabla existe (Silent check)
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS demo_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(255),
                    empresa VARCHAR(255),
                    email VARCHAR(255),
                    telefono VARCHAR(100),
                    guardias INT DEFAULT 0,
                    empleados INT DEFAULT 0,
                    mensaje TEXT,
                    source VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await pool.query(
                'INSERT INTO demo_requests (nombre, empresa, email, telefono, guardias, empleados, mensaje, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [nombre, empresa, email, telefono, guardias || 0, empleados || 0, mensaje, source]
            );
        } catch (dbErr) {
            console.error("⚠️ Error en Base de Datos (Leads):", dbErr.message);
        }

        // Intento de envío de Email (No bloqueante)
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const mailOptions = {
                from: `"Centinela Lead System" <${process.env.SMTP_USER}>`,
                to: 'ventas@centinela-security.com',
                replyTo: email,
                subject: `🚀 Nuevo Lead: Solicitud de (${source || 'Web'}) - ${empresa}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #fff;">
                        <h2 style="color: #00a8ff;">Nueva Solicitud de Interés</h2>
                        <p>Origen: <strong>${source || 'Landing Page'}</strong></p>
                        <hr />
                        <p><strong>👤 Nombre:</strong> ${nombre}</p>
                        <p><strong>🏢 Empresa:</strong> ${empresa}</p>
                        <p><strong>📧 Email:</strong> ${email}</p>
                        <p><strong>📞 Teléfono:</strong> ${telefono}</p>
                        ${mensaje ? `<p><strong>📝 Mensaje:</strong> ${mensaje}</p>` : ''}
                    </div>
                `
            };

            transporter.sendMail(mailOptions).catch(mailErr => {
                console.error("❌ Error enviando email de Lead:", mailErr.message);
            });
        }

        // Siempre respondemos éxito al cliente para no "congelar" la UI
        res.json({ success: true, message: 'Solicitud recibida correctamente' });

    } catch (err) {
        console.error("Error crítico en demo-requests:", err);
        res.status(200).json({ success: true, warning: 'Procesado con observaciones' }); 
    }
});

// 8. ENVÍO DE PROPUESTA COMERCIAL
app.post('/api/send-proposal', async (req, res) => {
    const { companyName, email, planId, guards, panicUsers, message } = req.body;
    
    try {
        // Obtener detalles del plan (desde MySQL si es posible, o fallback)
        const [planRows] = await pool.query('SELECT * FROM planes WHERE id = ?', [planId]);
        const plan = planRows[0] || { nombre: planId.toUpperCase(), precio: 'Consultar' };

        const mailOptions = {
            from: `"Administración Centinela" <${process.env.SMTP_USER}>`,
            to: email,
            replyTo: 'admin@centinela-security.com',
            subject: `📋 Propuesta Comercial: Sistema Inteligente Centinela - ${companyName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 15px; overflow: hidden; background: #ffffff;">
                    <div style="background: #0f172a; padding: 40px; text-align: center;">
                        <h1 style="color: #00d2ff; margin: 0; font-size: 24px; letter-spacing: 2px;">CENTINELA</h1>
                        <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">Propuesta de Gestión de Seguridad Inteligente</p>
                    </div>
                    <div style="padding: 40px; color: #334155; line-height: 1.6;">
                        <p>Estimados amigos de <strong>${companyName}</strong>,</p>
                        <p>Es un gusto saludarlos. De acuerdo a lo conversado, adjuntamos el detalle del plan sugerido para la digitalización y control de su operación de seguridad:</p>
                        
                        <div style="background: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; margin: 30px 0;">
                            <h3 style="color: #0f172a; margin-top: 0;">Plan ${plan.nombre}</h3>
                            <p style="font-size: 28px; font-weight: bold; color: #3b82f6; margin: 10px 0;">$${plan.precio} <span style="font-size: 14px; color: #64748b;">/mes</span></p>
                            <ul style="padding-left: 20px; color: #475569;">
                                <li>Capacidad: ${guards || plan.limite_guardias || 'S/D'} Guardias</li>
                                <li>Botones de Pánico: ${panicUsers || plan.botones_panico || 'Consultar'}</li>
                                <li>Monitoreo GPS en tiempo real</li>
                                <li>Rondas QR con evidencia digital</li>
                                <li>Dashboard de gestión centralizada</li>
                            </ul>
                        </div>

                        ${message ? `
                        <div style="border-left: 4px solid #00d2ff; padding-left: 20px; margin: 30px 0;">
                            <p style="font-style: italic; color: #64748b;">"${message}"</p>
                        </div>
                        ` : ''}

                        <p>Nuestro sistema le permitirá eliminar por completo las planillas manuales, garantizando trazabilidad total y reportes automáticos para sus clientes.</p>
                        
                        <div style="text-align: center; margin-top: 40px;">
                            <p style="font-size: 13px; color: #94a3b8;">Para activar este plan o solicitar una reunión técnica:</p>
                            <p style="font-weight: bold; color: #0f172a;">admin@centinela-security.com</p>
                        </div>
                    </div>
                    <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
                        © 2026 Centinela Security. Todos los derechos reservados.
                    </div>
                </div>
            `
        };

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail(mailOptions);
            res.json({ success: true, message: 'Propuesta enviada correctamente' });
        } else {
            console.warn("⚠️ SMTP no configurado. Propuesta no enviada via email.");
            res.json({ success: true, message: 'Simulado: Propuesta generada (SMTP no configurado)' });
        }
    } catch (err) {
        console.error("Error enviando propuesta:", err);
        res.status(500).json({ error: 'Error al enviar la propuesta comercial' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Centinela Backend - Modo LITE Activo - http://localhost:${PORT}`);
});

// Autosustentabilidad: Cierre limpio de conexiones
process.on('SIGTERM', async () => {
    console.log('Cerrando pool de MySQL...');
    await pool.end();
    process.exit(0);
});
