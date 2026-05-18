const agendaService = require('../services/agendaService');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');

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
    res.status(201).json(reserva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const reserva = await agendaService.update(req.params.id, req.body, userId);
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