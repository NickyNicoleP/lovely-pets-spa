const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Admin: Sales and Revenue Report
router.get('/ventas', authenticateToken, requireRole(['admin', 'administrador']), reporteController.getVentasAdmin);

// Reception: Daily Schedule Report
router.get('/agenda-diaria', authenticateToken, requireRole(['empleado', 'veterinario', 'admin', 'administrador']), reporteController.getAgendaDiaria);
router.get('/caja-diaria', authenticateToken, requireRole(['empleado', 'veterinario', 'admin', 'administrador']), reporteController.getCajaDiaria);

// Groomer: Service History and Statistics
router.get('/groomer/historial', authenticateToken, requireRole(['groomer']), reporteController.getHistorialGroomer);
router.get('/groomer/estadisticas', authenticateToken, requireRole(['groomer']), reporteController.getEstadisticasGroomer);

// Client personal report
router.get('/cliente', authenticateToken, requireRole(['cliente']), reporteController.getReporteCliente);

// NPS report
router.get('/nps', authenticateToken, requireRole(['admin', 'administrador']), reporteController.getNpsResumen);

// Admin analyses
router.get('/admin/ranking', authenticateToken, requireRole(['admin', 'administrador']), reporteController.getRankingRentabilidad);
router.get('/admin/ocupacion', authenticateToken, requireRole(['admin', 'administrador']), reporteController.getOcupacionGlobal);
router.get('/admin/insumos', authenticateToken, requireRole(['admin', 'administrador']), reporteController.getAuditoriaInsumos);

// Report PDF download
router.get('/pdf', authenticateToken, reporteController.downloadReportPdf);

// General Dashboard Statistics (role-aware)
router.get('/estadisticas', authenticateToken, reporteController.getEstadisticasGenerales);

module.exports = router;
