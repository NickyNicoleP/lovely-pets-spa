const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, inventarioController.getAll);
router.get('/:id', authenticateToken, requireRole(['admin', 'empleado']), inventarioController.getById);
router.post('/', authenticateToken, requireRole(['admin']), inventarioController.create);
router.post('/movimiento', authenticateToken, requireRole(['admin']), inventarioController.create);

module.exports = router;