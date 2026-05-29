const mascotaService = require('../services/mascotaService');
const clienteService = require('../services/clienteService');

exports.getAll = async (req, res) => {
  try {
    // ✅ SEGURIDAD: pasar userId y rol para filtrar
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.rol : null;
    const mascotas = await mascotaService.getAll(userId, userRole);
    res.json(mascotas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const mascota = await mascotaService.getById(req.params.id);
    res.json(mascota);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.rol : null;
    const mascotaData = { ...req.body };

    if (userRole === 'cliente') {
      const cliente = await clienteService.getByUsuarioId(userId);
      mascotaData.cliente_id = cliente.id;
    }

    const mascota = await mascotaService.create(mascotaData, userId);
    res.status(201).json(mascota);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const mascota = await mascotaService.update(req.params.id, req.body, userId);
    res.json(mascota);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await mascotaService.delete(req.params.id, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};