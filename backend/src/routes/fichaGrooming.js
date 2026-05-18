const express = require('express');
const router = express.Router();
const fichaGroomingController = require('../controllers/fichaGroomingController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, fichaGroomingController.getAll);
router.get('/estadisticas', authenticateToken, requireRole('admin', 'empleado'), fichaGroomingController.getEstadisticas);
router.get('/:id', authenticateToken, fichaGroomingController.getById);
router.post('/', authenticateToken, requireRole('admin', 'empleado'), fichaGroomingController.create);
router.post('/:id/insumo', authenticateToken, requireRole('admin', 'empleado'), fichaGroomingController.addInsumo);
router.post('/:id/cerrar', authenticateToken, requireRole('admin', 'empleado'), fichaGroomingController.close);

module.exports = router;