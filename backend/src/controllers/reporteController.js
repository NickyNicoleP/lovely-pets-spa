const reporteService = require('../services/reporteService');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Admin: Sales and Revenue Report
 */
exports.getVentasAdmin = async (req, res) => {
  try {
    if (req.user?.rol !== 'admin' && req.user?.rol !== 'administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { fecha_inicio, fecha_fin, periodo } = req.query;
    const ventas = await reporteService.getVentasAdmin({
      fecha_inicio,
      fecha_fin,
      periodo: periodo || 'diario'
    });

    res.json(ventas);
  } catch (error) {
    console.error('Error en reporte de ventas:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reception: Daily Schedule Report
 */
exports.getAgendaDiaria = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: 'Fecha requerida' });
    }

    const agenda = await reporteService.getAgendaDiaria(fecha);
    res.json(agenda);
  } catch (error) {
    console.error('Error en reporte de agenda:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Groomer: Service History Report
 */
exports.getHistorialGroomer = async (req, res) => {
  try {
    const groomer_id = req.params.groomer_id || req.query.groomer_id;
    if (!groomer_id) {
      return res.status(400).json({ error: 'groomer_id requerido' });
    }

    const { fecha_inicio, fecha_fin } = req.query;
    const historial = await reporteService.getHistorialGroomer(groomer_id, {
      fecha_inicio,
      fecha_fin
    });

    res.json(historial);
  } catch (error) {
    console.error('Error en reporte de groomer:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Groomer: Performance Statistics
 */
exports.getEstadisticasGroomer = async (req, res) => {
  try {
    const groomer_id = req.params.groomer_id || req.query.groomer_id;
    if (!groomer_id) {
      return res.status(400).json({ error: 'groomer_id requerido' });
    }

    const { fecha_inicio, fecha_fin } = req.query;
    const stats = await reporteService.getEstadisticasGroomer(groomer_id, {
      fecha_inicio,
      fecha_fin
    });

    res.json(stats);
  } catch (error) {
    console.error('Error en estadísticas de groomer:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * General Dashboard Statistics
 */
exports.getEstadisticasGenerales = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const stats = await reporteService.getEstadisticasGenerales({
      fecha_inicio,
      fecha_fin
    });

    res.json(stats);
  } catch (error) {
    console.error('Error en estadísticas generales:', error);
    res.status(500).json({ error: error.message });
  }
};
