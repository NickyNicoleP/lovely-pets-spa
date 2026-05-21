const fichaService = require('./src/services/fichaGroomingService');
const pool = require('./src/config/database');

async function run() {
  try {
    const [rows] = await pool.execute(
      "SELECT fg.id FROM FICHA_GROOMING fg WHERE fg.fecha_cierre IS NULL LIMIT 1"
    );

    if (!rows || rows.length === 0) {
      console.log('No hay fichas abiertas para cerrar.');
      process.exit(0);
    }

    const fichaId = rows[0].id;
    console.log('Intentando cerrar ficha id=', fichaId);

    const result = await fichaService.close(fichaId, null);
    console.log('✔ Ficha cerrada correctamente:', result);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error cerrando ficha:', err.message);
    process.exit(1);
  }
}

run();
