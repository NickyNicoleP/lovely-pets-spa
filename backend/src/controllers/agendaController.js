const agendaService = require('../services/agendaService');
const notificacionService = require('../services/notificacionService');
const { getWhatsAppService } = require('../services/whatsappService');
const pool = require('../config/database');
const { emitToUser } = require('../socket');

exports.getAll = async (req, res) => {
  try {
    const filters = {
      fecha: req.query.fecha,
      estado: req.query.estado,
      cliente_id: req.query.cliente_id
    };
    const agenda = await agendaService.getAll(filters, req.user.id, req.user.rol);
    res.json(agenda);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const agenda = await agendaService.getById(req.params.id, req.user.id, req.user.rol);
    res.json(agenda);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    console.log('[AGENDA CREATE] req.body:', JSON.stringify(req.body, null, 2));
    const userId = req.user.id;
    const reserva = await agendaService.create(req.body, userId, req.user.rol);

    const [usuarioRows] = await pool.execute(
      `SELECT u.id, u.nombre, u.telefono FROM MASCOTA m
       JOIN CLIENTE c ON m.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       WHERE m.id = ?`,
      [reserva.mascota_id]
    );

    const usuarioData = usuarioRows?.[0];
    if (usuarioData) {
      const { id: usuarioId, nombre: clienteName, telefono: clientePhone } = usuarioData;
      
      // In-app notification
      await notificacionService.createNotification(
        usuarioId,
        'cita',
        'app',
        '📅 Tu cita ha sido registrada',
        `¡Reserva confirmada! ${reserva.mascota_nombre} tiene cita el ${reserva.fecha} a las ${reserva.hora}. Te enviaremos un recordatorio 24 horas antes.`
      );
      
      // Real-time notification
      emitToUser(usuarioId, 'nueva_cita', {
        id: reserva.id,
        mascota: reserva.mascota_nombre,
        fecha: reserva.fecha,
        hora: reserva.hora,
        estado: reserva.estado
      });

      // WhatsApp notification (if phone number exists)
      if (clientePhone) {
        try {
          const whatsappService = await getWhatsAppService();
          if (whatsappService.isConnected) {
            await whatsappService.sendAppointmentConfirmation(
              clientePhone,
              clienteName,
              reserva.mascota_nombre,
              reserva.fecha,
              reserva.hora
            );
          }
        } catch (whatsappError) {
          console.log('[AGENDA CREATE] WhatsApp notification skipped:', whatsappError.message);
        }
      }
    }

    res.status(201).json(reserva);
  } catch (error) {
    console.error('[AGENDA CREATE ERROR]', error);
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user.id;
    const reserva = await agendaService.update(req.params.id, req.body, userId);

    if (req.body.estado) {
      const [usuarioRows] = await pool.execute(
        `SELECT u.id, u.nombre, u.telefono FROM SLOT_RESERVA a
         JOIN MASCOTA m ON a.mascota_id = m.id
         JOIN CLIENTE c ON m.cliente_id = c.id
         JOIN USUARIO u ON c.usuario_id = u.id
         WHERE a.id = ?`,
        [req.params.id]
      );
      const usuarioData = usuarioRows?.[0];
      if (usuarioData) {
        const { id: usuarioId, nombre: clienteName, telefono: clientePhone } = usuarioData;
        let titulo = '📝 Actualización de cita';
        let cuerpo = `Tu cita ha sido actualizada a estado ${req.body.estado}.`;

        if (req.body.estado === 'confirmada') {
          titulo = '✅ Cita confirmada';
          cuerpo = `¡Tu cita para ${reserva.mascota_nombre} el ${reserva.fecha} a las ${reserva.hora} ha sido confirmada! Te esperamos.`;
        } else if (req.body.estado === 'cancelada') {
          titulo = '❌ Cita cancelada';
          cuerpo = `Tu cita para ${reserva.mascota_nombre} el ${reserva.fecha} a las ${reserva.hora} ha sido cancelada. Contáctanos si tienes dudas.`;
        } else if (req.body.estado === 'completada') {
          titulo = '✨ Cita completada';
          cuerpo = `¡Tu cita para ${reserva.mascota_nombre} el ${reserva.fecha} se completó exitosamente! Gracias por confiar en nosotros.`;
        }

        await notificacionService.createNotification(usuarioId, 'cita', 'app', titulo, cuerpo);
        emitToUser(usuarioId, 'nueva_cita', {
          id: reserva.id,
          mascota: reserva.mascota_nombre,
          fecha: reserva.fecha,
          hora: reserva.hora,
          estado: reserva.estado
        });

        // WhatsApp notification for confirmada state
        if (req.body.estado === 'confirmada' && clientePhone) {
          try {
            const whatsappService = await getWhatsAppService();
            if (whatsappService.isConnected) {
              await whatsappService.sendAppointmentConfirmation(
                clientePhone,
                clienteName,
                reserva.mascota_nombre,
                reserva.fecha,
                reserva.hora
              );
            }
          } catch (whatsappError) {
            console.log('[AGENDA UPDATE] WhatsApp notification skipped:', whatsappError.message);
          }
        }
      }
    }

    res.json(reserva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await agendaService.delete(req.params.id, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getHorariosDisponibles = async (req, res) => {
  try {
    const { fecha, servicio_id, groomer_id, mascota_id } = req.query;
    const horarios = await agendaService.getHorariosDisponibles(fecha, servicio_id, groomer_id, mascota_id);
    res.json(horarios);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};