const pool = require('./src/config/database');
const fichaGroomingService = require('./src/services/fichaGroomingService');

function parseDateArg() {
  const arg = process.argv.find((value) => value.startsWith('--to='));
  if (!arg) {
    return new Date();
  }

  const dateString = arg.replace('--to=', '').trim();
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Fecha inválida: ${dateString}. Utiliza formato YYYY-MM-DD.`);
  }
  return date;
}

function formatAsDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function run() {
  try {
    const limitDate = parseDateArg();
    const limitDateString = formatAsDateOnly(limitDate);

    console.log(`Cerrando fichas abiertas con fecha de reserva hasta ${limitDateString} (inclusive)...`);

    const [fichas] = await pool.execute(
      `SELECT fg.id, fg.reserva_id, sr.fecha_hora, fg.fecha_cierre
       FROM FICHA_GROOMING fg
       JOIN SLOT_RESERVA sr ON fg.reserva_id = sr.id
       WHERE fg.fecha_cierre IS NULL
         AND DATE(sr.fecha_hora) <= ?
       ORDER BY sr.fecha_hora ASC`,
      [limitDateString]
    );

    if (!fichas || fichas.length === 0) {
      console.log('No se encontraron fichas abiertas para cerrar en ese rango de fecha.');
      process.exit(0);
    }

    console.log(`Fichas a cerrar: ${fichas.length}`);
    for (const ficha of fichas) {
      try {
        const closedFicha = await fichaGroomingService.close(ficha.id, null);
        console.log(`✔ Ficha ${ficha.id} cerrada correctamente (reserva ${ficha.reserva_id}).`);
      } catch (error) {
        console.error(`❌ No se pudo cerrar la ficha ${ficha.id}: ${error.message}`);
      }
    }

    console.log('Proceso de cierre finalizado.');
    process.exit(0);
  } catch (error) {
    console.error('Error en el cierre masivo de fichas:', error.message);
    process.exit(1);
  }
}

run();
