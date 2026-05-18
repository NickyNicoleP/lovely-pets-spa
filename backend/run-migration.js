// Script para aplicar migración de imágenes
const mysql = require('mysql2/promise');

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pawspa_db',
};

async function runMigration() {
  const connection = await mysql.createConnection(connectionConfig);

  try {
    console.log('Iniciando migración de imágenes...');

    // Agregar columnas a PRODUCTO
    await connection.execute(
      'ALTER TABLE PRODUCTO ADD COLUMN IF NOT EXISTS imagen VARCHAR(255)'
    );
    console.log('✓ Columna "imagen" agregada');

    await connection.execute(
      'ALTER TABLE PRODUCTO ADD COLUMN IF NOT EXISTS imagen_url TEXT'
    );
    console.log('✓ Columna "imagen_url" agregada');

    // Crear tabla FOTO_PRODUCTO
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS FOTO_PRODUCTO (
        id INT PRIMARY KEY AUTO_INCREMENT,
        producto_id INT NOT NULL,
        ruta_archivo VARCHAR(255) NOT NULL,
        url_imagen TEXT,
        descripcion VARCHAR(255),
        es_principal BOOLEAN DEFAULT FALSE,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES PRODUCTO(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Tabla "FOTO_PRODUCTO" creada');

    // Crear índices
    await connection.execute(
      'CREATE INDEX idx_foto_producto_id ON FOTO_PRODUCTO(producto_id)'
    );
    console.log('✓ Índice "idx_foto_producto_id" creado');

    await connection.execute(
      'CREATE INDEX idx_foto_principal ON FOTO_PRODUCTO(producto_id, es_principal)'
    );
    console.log('✓ Índice "idx_foto_principal" creado');

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
