const clienteService = require('../services/clienteService');
const { authenticateToken, requireRole } = require('../middleware/auth');

exports.getAll = async (req, res) => {
  try {
    const clientes = await clienteService.getAll();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const cliente = await clienteService.getById(req.params.id);
    res.json(cliente);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const cliente = await clienteService.create(req.body, userId);
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const cliente = await clienteService.update(req.params.id, req.body, userId);
    res.json(cliente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await clienteService.delete(req.params.id, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getMascotas = async (req, res) => {
  try {
    const mascotas = await clienteService.getMascotas(req.params.id);
    res.json(mascotas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};