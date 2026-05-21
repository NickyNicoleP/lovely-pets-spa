const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole, blacklistToken } = require('../middleware/auth');
const { rateLimitLogin } = require('../middleware/rateLimiter');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', rateLimitLogin, authController.login);
router.post('/verify-2fa', authController.verify2FA);
router.post('/refresh', authController.refresh);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.get('/captcha', authController.getCaptcha);

// Rutas protegidas
router.post('/logout', authenticateToken, authController.logout);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

// Rutas 2FA
router.post('/2fa/setup', authenticateToken, authController.setup2FA);
router.post('/2fa/enable', authenticateToken, authController.enable2FA);
router.post('/2fa/disable', authenticateToken, authController.disable2FA);

// Rutas de admin
router.get('/users', authenticateToken, requireRole(['admin']), authController.getAllUsers);
router.post('/users', authenticateToken, requireRole(['admin']), authController.createUserByAdmin);
router.put('/users/:id/role', authenticateToken, requireRole(['admin']), authController.updateUserRole);
router.put('/users/:id/status', authenticateToken, requireRole(['admin']), authController.updateUserStatus);
router.delete('/users/:id', authenticateToken, requireRole(['admin']), authController.deleteUser);

module.exports = router;