const { getWhatsAppService } = require('../services/whatsappService');
const { requireRole } = require('../middleware/auth');

/**
 * Get WhatsApp connection status
 */
exports.getStatus = async (req, res) => {
  try {
    const whatsappService = await getWhatsAppService();
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get WhatsApp QR code (if disconnected)
 */
exports.getQrCode = async (req, res) => {
  try {
    const whatsappService = await getWhatsAppService();
    const { qrCode } = whatsappService.getStatus();
    
    if (!qrCode) {
      return res.status(200).json({
        hasQr: false,
        message: 'WhatsApp is already connected'
      });
    }

    res.json({
      hasQr: true,
      qrCode
    });
  } catch (error) {
    console.error('Error getting WhatsApp QR:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get message history
 */
exports.getMessageHistory = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const whatsappService = await getWhatsAppService();
    const history = whatsappService.getMessageHistory(limit);
    
    res.json({
      count: history.length,
      messages: history
    });
  } catch (error) {
    console.error('Error getting WhatsApp message history:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reconnect WhatsApp service (admin only)
 */
exports.reconnect = async (req, res) => {
  try {
    const whatsappService = await getWhatsAppService();
    
    if (whatsappService.isConnected) {
      return res.json({
        success: true,
        message: 'WhatsApp is already connected',
        status: whatsappService.getStatus()
      });
    }

    // Try to initialize
    await whatsappService.initialize();
    
    res.json({
      success: true,
      message: 'Reconnection initiated. Check terminal for QR code.',
      status: whatsappService.getStatus()
    });
  } catch (error) {
    console.error('Error reconnecting WhatsApp:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Disconnect WhatsApp service (admin only)
 */
exports.disconnect = async (req, res) => {
  try {
    const whatsappService = await getWhatsAppService();
    await whatsappService.disconnect();
    
    res.json({
      success: true,
      message: 'WhatsApp disconnected',
      status: whatsappService.getStatus()
    });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
