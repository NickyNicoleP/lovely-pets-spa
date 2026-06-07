const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');
const { authenticateToken, requireRole, validateOwnershipOrAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, agendaController.getAll);
router.get('/horarios', authenticateToken, agendaController.getHorariosDisponibles);
router.get('/:id', authenticateToken, agendaController.getById);
router.post('/', authenticateToken, agendaController.create);
router.put('/:id', authenticateToken, requireRole(['admin', 'empleado']), agendaController.update);
router.delete('/:id', authenticateToken, validateOwnershipOrAdmin('reserva', 'id'), agendaController.delete);

module.exports = router;