const express = require('express');
const router = express.Router();
const mascotaController = require('../controllers/mascotaController');
const fileController = require('../controllers/fileController');
const { authenticateToken, requireRole, validateOwnershipOrAdmin } = require('../middleware/auth');

// ✅ SEGURIDAD: getAll requiere autenticación - cliente solo ve sus mascotas
router.get('/', authenticateToken, mascotaController.getAll);

// ✅ SEGURIDAD: getById valida que sea el propietario, admin o empleado
router.get('/:id', authenticateToken, validateOwnershipOrAdmin('mascota', 'id'), mascotaController.getById);

// ✅ SEGURIDAD: admin, empleado y cliente pueden registrar mascotas propias
router.post('/', authenticateToken, requireRole(['admin', 'empleado', 'cliente']), mascotaController.create);
router.post('/upload-vacunas', authenticateToken, requireRole(['admin', 'empleado', 'cliente']), fileController.uploadMascotaFile);

// ✅ SEGURIDAD: solo propietario, admin o empleado puede actualizar
router.put('/:id', authenticateToken, validateOwnershipOrAdmin('mascota', 'id'), mascotaController.update);

// ✅ SEGURIDAD: solo admin puede eliminar
router.delete('/:id', authenticateToken, requireRole('admin'), mascotaController.delete);

module.exports = router;