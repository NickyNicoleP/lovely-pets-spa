const cuponService = require('../services/cuponService');

exports.getAll = async (req, res) => {
  try {
    const cupones = await cuponService.getAll();
    res.json(cupones);
  } catch (error) {
    console.error('[CUPON] Error obteniendo cupones:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.validar = async (req, res) => {
  try {
    const codigo = req.query.codigo;
    const cupon = await cuponService.getByCode(codigo);
    res.json(cupon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const cupon = await cuponService.create(req.body);
    res.status(201).json(cupon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
