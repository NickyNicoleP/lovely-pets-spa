// Script para aplicar migración de imágenes
const mysql = require('mysql2/promise');

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
    console.log(`• Columna "${columnName}" ya existe en ${tableName}, se omite`);
  }
}

async function runMigration() {
  const connection = await mysql.createConnection(connectionConfig);

  try {
    console.log('Iniciando migración de imágenes...');

    // Agregar columnas a PRODUCTO
    await addColumnIfNotExists(connection, 'PRODUCTO', 'imagen', 'VARCHAR(255)');
    await addColumnIfNotExists(connection, 'PRODUCTO', 'imagen_url', 'TEXT');
    await addColumnIfNotExists(connection, 'FICHA_INSUMO', 'estado', "ENUM('pendiente','usado','devuelto','merma') DEFAULT 'pendiente'");
    await addColumnIfNotExists(connection, 'FICHA_INSUMO', 'responsable', 'VARCHAR(150) NULL');

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
    await addColumnIfNotExists(connection, 'SLOT_RESERVA', 'observaciones', 'TEXT');
    await addColumnIfNotExists(connection, 'SLOT_RESERVA', 'codigo_cupon', 'VARCHAR(60)');
    await addColumnIfNotExists(connection, 'CARRITO_PEDIDO', 'cupon_codigo', 'VARCHAR(60)');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS CONFIGURACION (
        id INT PRIMARY KEY AUTO_INCREMENT,
        capacidad_diaria INT DEFAULT 10,
        politica_cancelacion TEXT,
        bank_qr_url VARCHAR(255),
        horario_inicio VARCHAR(5) DEFAULT '09:00',
        horario_fin VARCHAR(5) DEFAULT '18:00',
        dias_trabajo JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tabla "CONFIGURACION" creada');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS CUPON (
        id INT PRIMARY KEY AUTO_INCREMENT,
        codigo VARCHAR(60) NOT NULL UNIQUE,
        descripcion TEXT,
        descuento_pct DECIMAL(5,2) NOT NULL,
        vigente_desde DATE,
        vigente_hasta DATE,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tabla "CUPON" creada');

    await connection.execute(
      "ALTER TABLE PAGO_FACTURA MODIFY COLUMN metodo ENUM('efectivo','qr','tarjeta','link_pago','transferencia') NOT NULL"
    );
    console.log('✓ Actualizado ENUM de metodo en PAGO_FACTURA');

    await connection.execute(
      "ALTER TABLE PAGO_FACTURA MODIFY COLUMN estado ENUM('pendiente','pagado','pendiente_verificacion','rechazado','reembolsado') DEFAULT 'pendiente'"
    );
    console.log('✓ Actualizado ENUM de estado en PAGO_FACTURA');

    // Asegurar que exista una fila de configuración
    await connection.execute(
      `INSERT INTO CONFIGURACION (capacidad_diaria, politica_cancelacion, bank_qr_url, horario_inicio, horario_fin, dias_trabajo)
       SELECT 10, 'La cancelación debe hacerse con al menos 24 horas de antelación para evitar cargos. Las cancelaciones a última hora pueden ser rechazadas o sujetas a un cobro parcial.', '', '09:00', '18:00', JSON_ARRAY('lunes','martes','miercoles','jueves','viernes')
       FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM CONFIGURACION)`
    );
    console.log('✓ Fila de configuración inicial creada si no existía');

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
