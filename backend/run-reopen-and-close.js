const pool = require('./src/config/database');
const fichaService = require('./src/services/fichaGroomingService');

async function run() {
  try {
    // Buscar la última ficha (por id) y marcar fecha_cierre = NULL
    const [rows] = await pool.execute('SELECT id FROM FICHA_GROOMING ORDER BY id DESC LIMIT 1');
    if (!rows || rows.length === 0) {
      console.log('No hay fichas en la base de datos.');
      process.exit(0);
    }
    const fichaId = rows[0].id;
    console.log('Reabriendo ficha id=', fichaId);
    await pool.execute('UPDATE FICHA_GROOMING SET fecha_cierre = NULL WHERE id = ?', [fichaId]);

    // Asegurar estado de la reserva relacionado a en_proceso
    const [resRow] = await pool.execute('SELECT reserva_id FROM FICHA_GROOMING WHERE id = ?', [fichaId]);
    const reservaId = resRow[0]?.reserva_id;
    if (reservaId) {
      await pool.execute('UPDATE SLOT_RESERVA SET estado = ? WHERE id = ?', ['en_proceso', reservaId]);
    }

    // Ejecutar el cierre usando el servicio (aplicará validaciones, descontará stock, notificará)
    console.log('Intentando cerrar ficha id=', fichaId);
    const result = await fichaService.close(fichaId, null);
    console.log('✔ Ficha cerrada correctamente:', result);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en reopen+close:', err.message);
    process.exit(1);
  }
}

run();
