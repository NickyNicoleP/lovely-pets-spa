const categoriaService = require('../services/categoriaService');

exports.getAll = async (req, res) => {
  try {
    const categorias = await categoriaService.getAll();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
