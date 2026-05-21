const express = require('express');
const router = express.Router();
const mascotaController = require('../controllers/mascotaController');
const { authenticateToken, requireRole, validateOwnershipOrAdmin } = require('../middleware/auth');

// ✅ SEGURIDAD: getAll requiere autenticación - cliente solo ve sus mascotas
router.get('/', authenticateToken, mascotaController.getAll);

// ✅ SEGURIDAD: getById valida que sea el propietario, admin o empleado
router.get('/:id', authenticateToken, validateOwnershipOrAdmin('mascota', 'id'), mascotaController.getById);

// ✅ SEGURIDAD: solo admin y empleado pueden crear
router.post('/', authenticateToken, requireRole(['admin', 'empleado']), mascotaController.create);

// ✅ SEGURIDAD: solo propietario, admin o empleado puede actualizar
router.put('/:id', authenticateToken, validateOwnershipOrAdmin('mascota', 'id'), mascotaController.update);

// ✅ SEGURIDAD: solo admin puede eliminar
router.delete('/:id', authenticateToken, requireRole('admin'), mascotaController.delete);

module.exports = router;