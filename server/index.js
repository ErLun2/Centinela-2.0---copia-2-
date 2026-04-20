import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
    try {
        const [rows] = await pool.query('SELECT * FROM empresas');
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
    const { companyId } = req.query;
    try {
        let sql = 'SELECT * FROM eventos';
        let params = [];
        if (companyId) {
            sql += ' WHERE companyId = ?';
            params.push(companyId);
        }
        sql += ' ORDER BY fecha DESC, hora DESC LIMIT 500';
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Centinela Backend running at http://localhost:${PORT}`);
});
