const pool = require('../config/database');
const notificacionService = require('./notificacionService');
const { emitToUser } = require('../socket');

const REMINDER_INTERVAL_MS = 60 * 60 * 1000; // 1 hora

async function sendAppointmentReminders() {
  try {
    const [reservas] = await pool.execute(
      `SELECT sr.id, sr.fecha_hora, sr.estado, m.nombre AS mascota_nombre, u.id AS usuario_id
       FROM SLOT_RESERVA sr
       JOIN MASCOTA m ON sr.mascota_id = m.id
       JOIN CLIENTE c ON m.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       WHERE sr.estado = 'confirmada'
         AND sr.recordatorio_enviado = FALSE
         AND sr.fecha_hora BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 25 HOUR)`
    );

    if (!Array.isArray(reservas) || reservas.length === 0) {
      return;
    }

    for (const reserva of reservas) {
      const fechaHora = new Date(reserva.fecha_hora);
      const ahora = new Date();
      const horasRestantes = (fechaHora - ahora) / (1000 * 60 * 60);

      if (horasRestantes <= 25 && horasRestantes > 0) {
        const titulo = 'Recordatorio de cita';
        const cuerpo = `Tu cita para ${reserva.mascota_nombre} está programada dentro de 24 horas.`;

        await notificacionService.createNotification(
          reserva.usuario_id,
          'recordatorio',
          'app',
          titulo,
          cuerpo
        );

        emitToUser(reserva.usuario_id, 'recordatorio_cita', {
          reservationId: reserva.id,
          mascota: reserva.mascota_nombre,
          fecha_hora: reserva.fecha_hora,
          titulo,
          cuerpo
        });

        await pool.execute(
          'UPDATE SLOT_RESERVA SET recordatorio_enviado = TRUE WHERE id = ?',
          [reserva.id]
        );
      }
    }
  } catch (error) {
    console.error('[SCHEDULER] Error enviando recordatorios de cita:', error);
  }
}

function startReminderScheduler() {
  sendAppointmentReminders();
  setInterval(sendAppointmentReminders, REMINDER_INTERVAL_MS);
}

module.exports = {
  startReminderScheduler
};
