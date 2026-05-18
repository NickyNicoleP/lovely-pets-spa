const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', servicioController.getAll);
router.get('/:id', servicioController.getById);
router.post('/', authenticateToken, requireRole('admin'), servicioController.create);
router.put('/:id', authenticateToken, requireRole('admin'), servicioController.update);
router.delete('/:id', authenticateToken, requireRole('admin'), servicioController.delete);

module.exports = router;