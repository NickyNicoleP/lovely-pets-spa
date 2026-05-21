// Ejecuta backend/demo_grooming.sql desde Node (evita redirección en PowerShell)
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
require('dotenv').config();

async function run() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pawspa_db',
    charset: process.env.DB_CHARSET || 'utf8mb4_unicode_ci',
    multipleStatements: true,
  };

  const sqlPath = './demo_grooming.sql';

  try {
    const sql = await fs.readFile(sqlPath, 'utf8');
    const connection = await mysql.createConnection(connectionConfig);
    console.log('Conectado a la base de datos, ejecutando demo_grooming.sql...');
    const [result] = await connection.query(sql);
    console.log('✅ Script ejecutado correctamente');
    await connection.end();
  } catch (err) {
    console.error('❌ Error ejecutando demo_grooming.sql:', err.message);
    process.exitCode = 1;
  }
}

run();
