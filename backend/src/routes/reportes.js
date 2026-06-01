const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Admin: Sales and Revenue Report
router.get('/ventas', authenticateToken, reporteController.getVentasAdmin);

// Reception: Daily Schedule Report
router.get('/agenda-diaria', authenticateToken, reporteController.getAgendaDiaria);

// Groomer: Service History
router.get('/groomer/:groomer_id/historial', authenticateToken, reporteController.getHistorialGroomer);
router.get('/groomer/historial', authenticateToken, reporteController.getHistorialGroomer);

// Groomer: Statistics
router.get('/groomer/:groomer_id/estadisticas', authenticateToken, reporteController.getEstadisticasGroomer);
router.get('/groomer/estadisticas', authenticateToken, reporteController.getEstadisticasGroomer);

// General Dashboard Statistics
router.get('/estadisticas', authenticateToken, reporteController.getEstadisticasGenerales);

module.exports = router;
