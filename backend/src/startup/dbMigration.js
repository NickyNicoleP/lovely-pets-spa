const mysql = require('mysql2/promise');
require('dotenv').config();

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pawspa_db',
  charset: process.env.DB_CHARSET || 'utf8mb4_unicode_ci',
};

async function addColumnIfNotExists(connection, tableName, columnName, definition) {
  const [columns] = await connection.execute(
    `SHOW COLUMNS FROM \`${tableName}\` WHERE Field = ?`,
    [columnName]
  );

  if (!columns || columns.length === 0) {
    await connection.execute(
      `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`
    );
    console.log(`✓ Columna "${columnName}" agregada a ${tableName}`);
  } else {
    console.log(`• Columna "${columnName}" ya existe en ${tableName}`);
  }
}

async function ensureFichaInsumoColumns() {
  const connection = await mysql.createConnection(connectionConfig);

  try {
    await addColumnIfNotExists(
      connection,
      'FICHA_INSUMO',
      'estado',
      "ENUM('pendiente','usado','devuelto','merma') DEFAULT 'pendiente'"
    );
    await addColumnIfNotExists(
      connection,
      'FICHA_INSUMO',
      'responsable',
      'VARCHAR(150) NULL'
    );
  } finally {
    await connection.end();
  }
}

async function ensureEncuestaTable() {
  const connection = await mysql.createConnection(connectionConfig);

  try {
    const [rows] = await connection.execute(
      "SHOW TABLES LIKE 'ENCUESTA'"
    );

    if (!rows || rows.length === 0) {
      await connection.execute(
        `CREATE TABLE ENCUESTA (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          puntuacion TINYINT NOT NULL,
          comentario TEXT NULL,
          fecha DATETIME NOT NULL DEFAULT UTC_TIMESTAMP(),
          INDEX idx_usuario_id (usuario_id),
          INDEX idx_fecha (fecha),
          CONSTRAINT fk_encuesta_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIO(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      );
      console.log('✓ Tabla ENCUESTA creada');
    } else {
      console.log('• Tabla ENCUESTA ya existe');
    }
  } finally {
    await connection.end();
  }
}

module.exports = {
  ensureFichaInsumoColumns,
  ensureEncuestaTable
};
