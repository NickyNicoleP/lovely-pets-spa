const fichaGroomingService = require('../services/fichaGroomingService');
const notificacionService = require('../services/notificacionService');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { emitToUser } = require('../socket');

exports.getAll = async (req, res) => {
  try {
    const filters = {
      estado: req.query.estado,
      fecha: req.query.fecha
    };
    const fichas = await fichaGroomingService.getAll(filters);
    res.json(fichas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const ficha = await fichaGroomingService.getById(req.params.id);
    res.json(ficha);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const ficha = await fichaGroomingService.create(req.body, userId);
    res.status(201).json(ficha);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addInsumo = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await fichaGroomingService.addInsumo(req.params.id, req.body, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.close = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const ficha = await fichaGroomingService.close(req.params.id, userId);

    const [usuarioRows] = await pool.execute(
      `SELECT u.id FROM FICHA_GROOMING fg
       JOIN SLOT_RESERVA sr ON fg.reserva_id = sr.id
       JOIN MASCOTA m ON sr.mascota_id = m.id
       JOIN CLIENTE c ON m.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       WHERE fg.id = ?`,
      [req.params.id]
    );
    const usuarioId = usuarioRows?.[0]?.id;
    if (usuarioId) {
      await notificacionService.createNotification(
        usuarioId,
        'grooming',
        'app',
        'Ficha de grooming completada',
        `La atención de ${ficha.mascota_nombre} ha sido finalizada correctamente.`
      );
      emitToUser(usuarioId, 'ficha_completada', {
        id: ficha.id,
        mascota: ficha.mascota_nombre,
        servicio: ficha.servicio_nombre,
        fecha: ficha.reserva_fecha_hora,
        estado: 'finalizada'
      });
    }

    res.json(ficha);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getEstadisticas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const stats = await fichaGroomingService.getEstadisticas(fecha_inicio, fecha_fin);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};