const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const pool = mysql.createPool({
    host: 'centinela-db.c0y2y2y2y2y2.us-east-1.rds.amazonaws.com', // Fake host, I need the real one
    user: 'admin',
    password: '...',
    database: 'centine1_centinela_db',
    ssl: { rejectUnauthorized: false }
  });
  // ...
}
