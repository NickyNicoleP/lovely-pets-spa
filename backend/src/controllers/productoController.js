const productoService = require('../services/productoService');
const { authenticateToken, requireRole } = require('../middleware/auth');

exports.getAll = async (req, res) => {
  try {
    const productos = await productoService.getAll();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const producto = await productoService.getById(req.params.id);
    res.json(producto);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const producto = await productoService.create(req.body, userId);
    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const producto = await productoService.update(req.params.id, req.body, userId);
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await productoService.delete(req.params.id, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Agregar imagen a un producto
 */
exports.agregarImagen = async (req, res) => {
  try {
    const { productoId, rutaArchivo, urlImagen, descripcion, esPrincipal } = req.body;

    if (!productoId || !rutaArchivo) {
      return res.status(400).json({ error: 'productoId y rutaArchivo son requeridos' });
    }

    const imagenId = await productoService.agregarImagen(
      productoId,
      rutaArchivo,
      urlImagen,
      descripcion || null,
      esPrincipal || false
    );

    res.status(201).json({
      success: true,
      imagenId,
      message: 'Imagen agregada correctamente'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Obtener imágenes de un producto
 */
exports.obtenerImagenes = async (req, res) => {
  try {
    const { productoId } = req.params;
    const imagenes = await productoService.obtenerImagenes(productoId);
    res.json(imagenes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Eliminar imagen
 */
exports.eliminarImagen = async (req, res) => {
  try {
    const { imagenId } = req.params;
    const result = await productoService.eliminarImagen(imagenId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Establecer imagen principal
 */
exports.establecerImagenPrincipal = async (req, res) => {
  try {
    const { imagenId } = req.params;
    const result = await productoService.establecerImagenPrincipal(imagenId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const productos = await productoService.getLowStock();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};