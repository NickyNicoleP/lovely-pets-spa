const express = require('express');
const router = express.Router();
const encuestaController = require('../controllers/encuestaController');
const { authenticateToken } = require('../middleware/auth');

// Create NPS survey response
router.post('/', authenticateToken, encuestaController.createEncuesta);

module.exports = router;
