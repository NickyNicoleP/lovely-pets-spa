const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/whatsapp/status
 * Get WhatsApp connection status (all authenticated users)
 */
router.get('/status', authenticateToken, whatsappController.getStatus);

/**
 * GET /api/whatsapp/qr
 * Get QR code if disconnected (admin only)
 */
router.get('/qr', authenticateToken, requireRole(['admin', 'administrador']), whatsappController.getQrCode);

/**
 * GET /api/whatsapp/history
 * Get message history (admin only)
 * Query params: ?limit=50
 */
router.get('/history', authenticateToken, requireRole(['admin', 'administrador']), whatsappController.getMessageHistory);

/**
 * POST /api/whatsapp/reconnect
 * Reconnect WhatsApp service (admin only)
 */
router.post('/reconnect', authenticateToken, requireRole(['admin', 'administrador']), whatsappController.reconnect);

/**
 * POST /api/whatsapp/disconnect
 * Disconnect WhatsApp service (admin only)
 */
router.post('/disconnect', authenticateToken, requireRole(['admin', 'administrador']), whatsappController.disconnect);

module.exports = router;
