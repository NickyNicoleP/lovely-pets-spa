const auditService = require('../services/auditService');
const { authenticateToken, requireRole } = require('../middleware/auth');

exports.getLoginLogs = async (req, res) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      evento: req.query.evento,
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin
    };
    const logs = await auditService.getLoginLogs(filters);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      accion: req.query.accion,
      entidad: req.query.entidad,
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin
    };
    const logs = await auditService.getAuditLogs(filters);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};