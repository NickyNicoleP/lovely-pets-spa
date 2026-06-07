const authService = require('../services/authService');
const auditService = require('../services/auditService');
const { authenticateToken, requireRole, blacklistToken } = require('../middleware/auth');

// Registro de usuario
exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: result,
      verificationUrl: `/api/auth/verify-email/${result.verificationToken}`
    });
  } catch (error) {
    if (error.errors && error.score !== undefined) {
      return res.status(400).json({
        error: error.message,
        passwordScore: error.score,
        requirements: error.errors
      });
    }
    res.status(400).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    const result = await authService.login(email, password, ipAddress, userAgent);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Verificar 2FA
exports.verify2FA = async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ error: 'userId y código son requeridos' });
    }
    const result = await authService.verify2FA(userId, code);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Verificar email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.manualVerifyEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await authService.verifyEmailByAdmin(id);
    res.json({ message: 'Email marcado como verificado manualmente', user: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Generar QR para 2FA
exports.generateQR = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await authService.generateQR(userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener perfil del usuario
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await authService.getUserById(userId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await authService.updateProfile(userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(userId, currentPassword, newPassword);
    res.json({ message: 'Contraseña cambiada correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener todos los usuarios (solo admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Crear usuario por admin
exports.createUserByAdmin = async (req, res) => {
  try {
    const result = await authService.createUserByAdmin(req.body, req.user.id);
    await auditService.logAction(req.user.id, 'create_user', req.ip || req.connection?.remoteAddress, req.headers['user-agent'], {
      targetUserId: result.id,
      targetUserEmail: result.email,
      targetUserRole: result.rol
    });
    res.status(201).json({
      message: 'Usuario creado correctamente',
      user: result
    });
  } catch (error) {
    if (error.errors && error.score !== undefined) {
      return res.status(400).json({
        error: error.message,
        passwordScore: error.score,
        requirements: error.errors
      });
    }
    res.status(400).json({ error: error.message });
  }
};

// Actualizar rol de usuario
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    if (!rol || !['cliente', 'empleado', 'veterinario', 'admin', 'administrador', 'groomer'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    const result = await authService.updateUserRole(id, rol, req.user.id);
    await auditService.logAction(req.user.id, 'update_user_role', req.ip || req.connection?.remoteAddress, req.headers['user-agent'], {
      targetUserId: id,
      oldRole: result.oldRole,
      newRole: rol
    });
    res.json({ message: 'Rol actualizado correctamente', user: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar estado de usuario
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'El campo activo debe ser un booleano' });
    }
    const result = await authService.updateUserStatus(id, activo, req.user.id);
    await auditService.logAction(req.user.id, 'update_user_status', req.ip || req.connection?.remoteAddress, req.headers['user-agent'], {
      targetUserId: id,
      oldStatus: result.oldStatus,
      newStatus: activo
    });
    res.json({ message: 'Estado actualizado correctamente', user: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar usuario (borrado lógico)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await authService.deleteUser(id, req.user.id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Refresh token
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token es requerido' });
    }
    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// Reenviar email de verificación
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }
    await authService.resendVerificationEmail(email);
    res.json({ message: 'Email de verificación reenviado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener captcha
exports.getCaptcha = async (req, res) => {
  try {
    const captcha = await authService.generateCaptcha();
    res.json(captcha);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;
    const token = req.token;
    if (token) {
      blacklistToken(token);
    }
    await authService.logout(userId, refreshToken);
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Configurar 2FA
exports.setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await authService.setup2FA(userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Habilitar 2FA
exports.enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Código es requerido' });
    }
    const result = await authService.enable2FA(userId, code);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Deshabilitar 2FA
exports.disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Contraseña es requerida' });
    }
    await authService.disable2FA(userId, password);
    res.json({ message: '2FA deshabilitado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Alias
exports.getAllUsers = exports.getUsers;
exports.createUser = exports.createUserByAdmin;
