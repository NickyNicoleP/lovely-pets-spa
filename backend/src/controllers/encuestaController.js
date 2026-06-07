const encuestaService = require('../services/encuestaService');

exports.createEncuesta = async (req, res) => {
  try {
    const { puntuacion, comentario } = req.body;
    const encuesta = await encuestaService.create({ puntuacion, comentario }, req.user.id);
    res.status(201).json(encuesta);
  } catch (error) {
    console.error('Error creando encuesta:', error.message);
    res.status(400).json({ error: error.message });
  }
};
