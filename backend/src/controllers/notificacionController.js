const notificacionService = require('../services/notificacionService');

exports.getAll = async (req, res) => {
  try {
    const notifications = await notificacionService.getByUserId(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notification = await notificacionService.markRead(req.params.id, req.user.id);
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
