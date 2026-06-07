const configService = require('../services/configService');

exports.getConfig = async (req, res) => {
  try {
    const config = await configService.getConfig();
    res.json(config);
  } catch (error) {
    console.error('[CONFIG] Error obteniendo configuración:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const config = await configService.updateConfig(req.body);
    res.json(config);
  } catch (error) {
    console.error('[CONFIG] Error actualizando configuración:', error.message);
    res.status(400).json({ error: error.message });
  }
};
