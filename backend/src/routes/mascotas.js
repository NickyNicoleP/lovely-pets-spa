const express = require('express');
const router = express.Router();
const mascotaController = require('../controllers/mascotaController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', mascotaController.getAll);
router.get('/:id', mascotaController.getById);
router.post('/', authenticateToken, requireRole('admin', 'empleado'), mascotaController.create);
router.put('/:id', authenticateToken, requireRole('admin', 'empleado'), mascotaController.update);
router.delete('/:id', authenticateToken, requireRole('admin'), mascotaController.delete);

module.exports = router;