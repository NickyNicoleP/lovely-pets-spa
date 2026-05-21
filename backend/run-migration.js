// Script para aplicar migración de imágenes
const mysql = require('mysql2/promise');

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pawspa_db',
  charset: process.env.DB_CHARSET || 'utf8mb4_unicode_ci',
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

    // Crear índices si no existen
    try {
      const [existing1] = await connection.execute(
        'SHOW INDEX FROM FOTO_PRODUCTO WHERE Key_name = ?',
        ['idx_foto_producto_id']
      );
      if (!existing1 || existing1.length === 0) {
        await connection.execute(
          'CREATE INDEX idx_foto_producto_id ON FOTO_PRODUCTO(producto_id)'
        );
        console.log('✓ Índice "idx_foto_producto_id" creado');
      } else {
        console.log('• Índice "idx_foto_producto_id" ya existe, se omite');
      }

      const [existing2] = await connection.execute(
        'SHOW INDEX FROM FOTO_PRODUCTO WHERE Key_name = ?',
        ['idx_foto_principal']
      );
      if (!existing2 || existing2.length === 0) {
        await connection.execute(
          'CREATE INDEX idx_foto_principal ON FOTO_PRODUCTO(producto_id, es_principal)'
        );
        console.log('✓ Índice "idx_foto_principal" creado');
      } else {
        console.log('• Índice "idx_foto_principal" ya existe, se omite');
      }
    } catch (ixErr) {
      console.warn('⚠️ Error comprobando/creando índices:', ixErr.message);
    }

    // Agregar columna observaciones a SLOT_RESERVA si no existe (para registrar notas y pagos)
    await connection.execute(
      'ALTER TABLE SLOT_RESERVA ADD COLUMN IF NOT EXISTS observaciones TEXT'
    );
    console.log('✓ Columna "observaciones" agregada a SLOT_RESERVA');

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
