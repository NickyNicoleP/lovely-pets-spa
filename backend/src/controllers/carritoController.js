const carritoService = require('../services/carritoService');

exports.getAll = async (req, res) => {
  try {
    const orders = await carritoService.getOrders(req.user);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const order = await carritoService.getOrderById(req.params.id, req.user);
    res.json(order);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const result = await carritoService.createOrder(req.user.id, data);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await carritoService.updateOrderStatus(req.params.id, status, req.user);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
