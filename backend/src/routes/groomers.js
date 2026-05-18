const express = require('express');
const router = express.Router();
const groomerController = require('../controllers/groomerController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', groomerController.getAll);
router.get('/:id', groomerController.getById);
router.put('/:id/disponibilidad', authenticateToken, requireRole(['admin', 'empleado']), groomerController.updateDisponibilidad);

module.exports = router;
