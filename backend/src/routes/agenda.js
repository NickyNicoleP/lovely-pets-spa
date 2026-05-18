const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, agendaController.getAll);
router.get('/horarios', agendaController.getHorariosDisponibles);
router.get('/:id', optionalAuth, agendaController.getById);
router.post('/', authenticateToken, agendaController.create);
router.put('/:id', authenticateToken, requireRole('admin', 'empleado'), agendaController.update);
router.delete('/:id', authenticateToken, requireRole('admin', 'empleado'), agendaController.delete);

module.exports = router;