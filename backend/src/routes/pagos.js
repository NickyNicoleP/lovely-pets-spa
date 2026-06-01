const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, pagoController.getAll);
router.get('/:id', authenticateToken, pagoController.getById);
router.post('/', authenticateToken, requireRole(['admin', 'empleado']), pagoController.create);

module.exports = router;
