const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Rutas públicas
router.get('/', clienteController.getAll);
router.get('/:id', clienteController.getById);
router.get('/:id/mascotas', clienteController.getMascotas);

// Rutas protegidas
router.post('/', authenticateToken, requireRole(['admin', 'empleado']), clienteController.create);
router.put('/:id', authenticateToken, requireRole(['admin', 'empleado']), clienteController.update);
router.delete('/:id', authenticateToken, requireRole(['admin']), clienteController.delete);

module.exports = router;