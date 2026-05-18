const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, requireRole(['admin']), authController.getAllUsers);
router.post('/', authenticateToken, requireRole(['admin']), authController.createUser);

module.exports = router;