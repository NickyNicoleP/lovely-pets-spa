const agendaService = require('../services/agendaService');
const notificacionService = require('../services/notificacionService');
const pool = require('../config/database');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { emitToUser } = require('../socket');

exports.getAll = async (req, res) => {
  try {
    const filters = {
      fecha: req.query.fecha,
      estado: req.query.estado,
      cliente_id: req.query.cliente_id
    };
    const agenda = await agendaService.getAll(filters);
    res.json(agenda);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const agenda = await agendaService.getById(req.params.id);
    res.json(agenda);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({ error: 'Debe iniciar sesión para crear una reserva' });
    }
    const reserva = await agendaService.create(req.body, userId);

    const [usuarioRows] = await pool.execute(
      `SELECT u.id FROM MASCOTA m
       JOIN CLIENTE c ON m.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       WHERE m.id = ?`,
      [reserva.mascota_id]
    );

    const usuarioId = usuarioRows?.[0]?.id;
    if (usuarioId) {
      await notificacionService.createNotification(
        usuarioId,
        'cita',
        'app',
        'Solicitud de cita recibida',
        `Tu cita para ${reserva.mascota_nombre} el ${reserva.fecha} a las ${reserva.hora} ha sido registrada.`
      );
      emitToUser(usuarioId, 'nueva_cita', {
        id: reserva.id,
        mascota: reserva.mascota_nombre,
        fecha: reserva.fecha,
        hora: reserva.hora,
        estado: reserva.estado
      });
    }

    res.status(201).json(reserva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const reserva = await agendaService.update(req.params.id, req.body, userId);

    if (req.body.estado) {
      const [usuarioRows] = await pool.execute(
        `SELECT u.id FROM SLOT_RESERVA a
         JOIN MASCOTA m ON a.mascota_id = m.id
         JOIN CLIENTE c ON m.cliente_id = c.id
         JOIN USUARIO u ON c.usuario_id = u.id
         WHERE a.id = ?`,
        [req.params.id]
      );
      const usuarioId = usuarioRows?.[0]?.id;
      if (usuarioId) {
        let titulo = 'Actualización de cita';
        let cuerpo = `Tu cita ha sido actualizada a estado ${req.body.estado}.`;

        if (req.body.estado === 'confirmada') {
          titulo = 'Cita confirmada';
          cuerpo = `Tu cita para ${reserva.mascota_nombre} el ${reserva.fecha} a las ${reserva.hora} ha sido confirmada.`;
        } else if (req.body.estado === 'cancelada') {
          titulo = 'Cita cancelada';
          cuerpo = `Tu cita para ${reserva.mascota_nombre} el ${reserva.fecha} a las ${reserva.hora} fue cancelada.`;
        } else if (req.body.estado === 'completada') {
          titulo = 'Cita completada';
          cuerpo = `Tu cita para ${reserva.mascota_nombre} el ${reserva.fecha} a las ${reserva.hora} se completó.`;
        }

        await notificacionService.createNotification(usuarioId, 'cita', 'app', titulo, cuerpo);
        emitToUser(usuarioId, 'nueva_cita', {
          id: reserva.id,
          mascota: reserva.mascota_nombre,
          fecha: reserva.fecha,
          hora: reserva.hora,
          estado: reserva.estado
        });
      }
    }

    res.json(reserva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await agendaService.delete(req.params.id, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getHorariosDisponibles = async (req, res) => {
  try {
    const { fecha, servicio_id, groomer_id } = req.query;
    const horarios = await agendaService.getHorariosDisponibles(fecha, servicio_id, groomer_id);
    res.json(horarios);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};