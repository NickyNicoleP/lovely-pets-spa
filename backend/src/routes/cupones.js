const express = require('express');
const router = express.Router();
const cuponController = require('../controllers/cuponController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, cuponController.getAll);
router.get('/validar', authenticateToken, cuponController.validar);
router.post('/', authenticateToken, cuponController.create);

module.exports = router;
