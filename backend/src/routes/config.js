const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, requireRole(['admin', 'empleado']), configController.getConfig);
router.put('/', authenticateToken, requireRole(['admin', 'empleado']), configController.updateConfig);

module.exports = router;
