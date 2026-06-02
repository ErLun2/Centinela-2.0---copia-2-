import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Forzar zona horaria de Argentina en todas las conexiones del pool
pool.on('connect', (client) => {
  client.query("SET timezone = 'America/Argentina/Buenos_Aires';").catch(err => {
    console.error("Error setting session timezone to America/Argentina/Buenos_Aires:", err);
  });
});

console.log("🐘 [DB] USANDO POSTGRESQL - Pool Inicializado");

export default pool;
