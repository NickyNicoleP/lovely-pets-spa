const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const fileController = require('../controllers/fileController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Rutas básicas de productos
router.get('/', productoController.getAll);
router.get('/low-stock', productoController.getLowStock);
router.get('/:id', productoController.getById);
router.post('/', authenticateToken, requireRole('admin'), productoController.create);
router.put('/:id', authenticateToken, requireRole('admin'), productoController.update);
router.delete('/:id', authenticateToken, requireRole('admin'), productoController.delete);

// Rutas de imágenes
router.post('/upload-imagen', authenticateToken, requireRole('admin'), fileController.uploadProductImage);
router.post('/imagenes', authenticateToken, requireRole('admin'), productoController.agregarImagen);
router.get('/:productoId/imagenes', productoController.obtenerImagenes);
router.delete('/imagenes/:imagenId', authenticateToken, requireRole('admin'), productoController.eliminarImagen);
router.put('/imagenes/:imagenId/principal', authenticateToken, requireRole('admin'), productoController.establecerImagenPrincipal);

module.exports = router;