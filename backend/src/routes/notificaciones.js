const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, notificacionController.getAll);
router.patch('/:id/read', authenticateToken, notificacionController.markRead);

module.exports = router;
