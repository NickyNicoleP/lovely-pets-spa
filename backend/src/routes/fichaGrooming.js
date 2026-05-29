const express = require('express');
const router = express.Router();
const fichaGroomingController = require('../controllers/fichaGroomingController');
const fileController = require('../controllers/fileController');
const { authenticateToken, requireRole, validateOwnershipOrAdmin } = require('../middleware/auth');
const { validateChecklistBeforeClose } = require('../middleware/checklistValidator');

// ✅ SEGURIDAD: getAll requiere autenticación
router.get('/', authenticateToken, fichaGroomingController.getAll);

// ✅ SEGURIDAD: solo admin/empleado pueden ver estadísticas
router.get('/estadisticas', authenticateToken, requireRole(['admin', 'empleado']), fichaGroomingController.getEstadisticas);

// ✅ SEGURIDAD: getById valida acceso
router.get('/:id', authenticateToken, validateOwnershipOrAdmin('ficha_grooming', 'id'), fichaGroomingController.getById);

// ✅ SEGURIDAD: Obtener checklist de la ficha
router.get('/:id/checklist', authenticateToken, validateOwnershipOrAdmin('ficha_grooming', 'id'), fichaGroomingController.getChecklist);

// ✅ SEGURIDAD: Actualizar ítem del checklist
router.put('/:id/checklist/:itemKey', authenticateToken, validateOwnershipOrAdmin('ficha_grooming', 'id'), fichaGroomingController.updateChecklistItem);

// ✅ SEGURIDAD: solo admin/empleado/groomer pueden crear
router.post('/', authenticateToken, requireRole(['admin', 'empleado', 'groomer']), fichaGroomingController.create);

// ✅ SEGURIDAD: solo admin/empleado/groomer pueden agregar insumo
router.post('/:id/insumo', authenticateToken, requireRole(['admin', 'empleado', 'groomer']), fichaGroomingController.addInsumo);

// ✅ SEGURIDAD: Actualizar ficha (estado de ingreso, observaciones, checkboxes)
router.put('/:id', authenticateToken, validateOwnershipOrAdmin('ficha_grooming', 'id'), requireRole(['admin', 'empleado', 'groomer']), fichaGroomingController.update);

// ✅ SEGURIDAD: Subir foto antes/despues
router.post('/:id/fotos',
  authenticateToken,
  validateOwnershipOrAdmin('ficha_grooming', 'id'),
  requireRole(['admin', 'empleado', 'groomer']),
  fileController.uploadFichaPhoto,
  fichaGroomingController.uploadFoto
);

// ✅ SEGURIDAD: Cierre de ficha REQUIERE checklist completo
router.post('/:id/cerrar', 
  authenticateToken, 
  requireRole(['admin', 'empleado', 'groomer']),
  validateChecklistBeforeClose,  // Valida checklist antes de permitir cierre
  fichaGroomingController.close
);

module.exports = router;