const inventarioService = require('../services/inventarioService');
const { authenticateToken, requireRole } = require('../middleware/auth');

exports.getAll = async (req, res) => {
  try {
    const filters = {
      producto_id: req.query.producto_id,
      tipo: req.query.tipo,
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin
    };
    const movimientos = await inventarioService.getAll(filters);
    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const movimiento = await inventarioService.getById(req.params.id);
    res.json(movimiento);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const movimiento = await inventarioService.create(req.body, userId);
    res.status(201).json(movimiento);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};