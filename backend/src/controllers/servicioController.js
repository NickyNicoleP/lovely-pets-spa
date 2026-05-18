const servicioService = require('../services/servicioService');

exports.getAll = async (req, res) => {
  try {
    const servicios = await servicioService.getAll();
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const servicio = await servicioService.getById(req.params.id);
    res.json(servicio);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const servicio = await servicioService.create(req.body);
    res.status(201).json(servicio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const servicio = await servicioService.update(req.params.id, req.body);
    res.json(servicio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await servicioService.delete(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};