const fichaGroomingService = require('../services/fichaGroomingService');
const { authenticateToken, requireRole } = require('../middleware/auth');

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