const pagoService = require('../services/pagoService');

exports.getAll = async (req, res) => {
  try {
    const filters = {
      reserva_id: req.query.reserva_id,
      pedido_id: req.query.pedido_id,
      metodo: req.query.metodo,
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin
    };

    const pagos = await pagoService.getAll(filters);
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const pago = await pagoService.getById(req.params.id);
    res.json(pago);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const pago = await pagoService.create(req.body, userId);
    res.status(201).json(pago);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
