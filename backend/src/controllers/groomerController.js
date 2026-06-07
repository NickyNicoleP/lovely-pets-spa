const groomerService = require('../services/groomerService');

exports.getAll = async (req, res) => {
  try {
    const groomers = await groomerService.getAll();
    res.json(groomers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const groomer = await groomerService.getById(req.params.id);
    res.json(groomer);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const groomer = await groomerService.update(req.params.id, req.body, userId);
    res.json(groomer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateDisponibilidad = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const groomer = await groomerService.updateDisponibilidad(req.params.id, req.body, userId);
    res.json(groomer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
