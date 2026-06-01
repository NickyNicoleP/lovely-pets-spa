const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, carritoController.getAll);
router.get('/:id', authenticateToken, carritoController.getById);
router.post('/', authenticateToken, requireRole(['cliente', 'admin', 'empleado']), carritoController.create);
router.put('/:id/status', authenticateToken, requireRole(['admin', 'empleado']), carritoController.updateStatus);

module.exports = router;
