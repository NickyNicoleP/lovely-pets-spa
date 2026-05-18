const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { validatePasswordStrength } = require('../utils/passwordValidator');
require('dotenv').config();

class AuthService {
  // Registrar nuevo usuario (solo clientes públicos)
  async register(userData) {
    const { email, password, nombre, apellido, telefono, ci, direccion, rol = 'cliente', captchaToken, captchaAnswer } = userData;

    if (!this.validateCaptcha(captchaToken, captchaAnswer)) {
      throw new Error('Captcha inválido o expirado');
    }

    if (rol !== 'cliente') {
      throw new Error('Sólo los clientes pueden registrarse libremente. El personal debe ser creado por un administrador.');
    }

    // Validar contraseña fuerte
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      const error = new Error('Contraseña débil');
      error.errors = passwordValidation.errors;
      error.score = passwordValidation.score;
      throw error;
    }

    // Verificar si el email ya existe
    const [existing] = await pool.execute(
      'SELECT id FROM USUARIO WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      throw new Error('El email ya está registrado');
    }

    // Hash de contraseña con bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generar token de verificación de email (JWT válido 15 minutos)
    const verificationToken = jwt.sign(
      { email, purpose: 'verify-email' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Insertar usuario
    const [result] = await pool.execute(
      `INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, verification_token, verification_expires, email_verificado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [nombre, apellido, email, passwordHash, rol, telefono, ci || null, direccion || null, verificationToken, verificationExpires]
    );

    // Crear cliente asociado si es rol cliente
    await pool.execute(
      `INSERT INTO CLIENTE (usuario_id, ci, direccion, nivel_fidelidad, puntos_acumulados) VALUES (?, ?, ?, 'bronze', 0)`,
      [result.insertId, ci || null, direccion || null]
    );

    return {
      id: result.insertId,
      email,
      nombre,
      rol,
      verificationToken,
      verificationExpires
    };
  }

  // Crear usuario por admin
  async createUserByAdmin(userData) {
    const { email, password, nombre, apellido, telefono, ci, direccion, rol = 'cliente' } = userData;

    if (!email || !password || !nombre || !apellido) {
      throw new Error('Nombre, apellido, email y contraseña son requeridos');
    }

    const validRoles = ['admin', 'empleado', 'cliente', 'veterinario'];
    if (!validRoles.includes(rol)) {
      throw new Error('Rol inválido. Solo se permite admin, empleado, cliente o veterinario.');
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      const error = new Error('Contraseña débil');
      error.errors = passwordValidation.errors;
      error.score = passwordValidation.score;
      throw error;
    }

    const [existing] = await pool.execute(
      'SELECT id FROM USUARIO WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      throw new Error('El email ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await pool.execute(
      `INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, email_verificado, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE)`,
      [nombre, apellido, email, passwordHash, rol, telefono, ci || null, direccion || null]
    );

    if (rol === 'cliente') {
      await pool.execute(
        `INSERT INTO CLIENTE (usuario_id, ci, direccion, nivel_fidelidad, puntos_acumulados) VALUES (?, ?, ?, 'bronze', 0)`,
        [result.insertId, ci || null, direccion || null]
      );
    }

    if (rol === 'empleado' && userData.isGroomer) {
      await pool.execute(
        `INSERT INTO GROOMER (usuario_id, ci, direccion, especialidades, turno, disponibilidad_semanal, activo) VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [result.insertId, ci || null, direccion || null, userData.especialidades || 'corte básico', userData.turno || 'rotativo', JSON.stringify({ lunes: true, martes: true, miercoles: true, jueves: true, viernes: true, sabado: false, domingo: false })]
      );
    }

    if (rol === 'veterinario') {
      await pool.execute(
        `INSERT INTO VETERINARIO (usuario_id, ci, direccion, especialidad, turno, disponibilidad_semanal, activo) VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [result.insertId, ci || null, direccion || null, userData.especialidad || 'general', userData.turno || 'rotativo', JSON.stringify({ lunes: true, martes: true, miercoles: true, viernes: true, sabado: false, domingo: false })]
      );
    }

    return {
      id: result.insertId,
      email,
      nombre,
      rol
    };
  }

  // Iniciar sesión
  async login(email, password, ipAddress, userAgent) {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    // Buscar usuario
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      await this.registrarAudit(null, email, ipAddress, userAgent, 'login_fallido', { razon: 'Usuario no encontrado' });
      throw new Error('Credenciales inválidas');
    }

    const user = users[0];

    // Verificar si está activo
    if (!user.activo) {
      throw new Error('Usuario inactivo');
    }

    // Verificar si el correo fue verificado
    if (!user.email_verificado) {
      throw new Error('Por favor verifica tu correo antes de continuar');
    }

    // Verificar bloqueo de cuenta (tras 5 intentos fallidos)
    if (user.locked_until) {
      const now = new Date();
      if (new Date(user.locked_until) > now) {
        const minutosRestantes = Math.ceil((new Date(user.locked_until) - now) / 60000);
        throw new Error(`Cuenta bloqueada. Intenta de nuevo en ${minutosRestantes} minuto(s)`);
      } else {
        // Desbloquear cuenta
        await pool.execute(
          'UPDATE USUARIO SET locked_until = NULL, login_attempts = 0 WHERE id = ?',
          [user.id]
        );
      }
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Incrementar intentos fallidos
      const newAttempts = (user.login_attempts || 0) + 1;
      let updateQuery = 'UPDATE USUARIO SET login_attempts = ? WHERE id = ?';
      let params = [newAttempts, user.id];

      // Bloquear tras 5 intentos
      if (newAttempts >= 5) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        updateQuery = 'UPDATE USUARIO SET login_attempts = ?, locked_until = ? WHERE id = ?';
        params = [newAttempts, lockedUntil, user.id];
      }

      await pool.execute(updateQuery, params);
      await this.registrarAudit(user.id, email, ipAddress, userAgent, 'login_fallido', { intento: newAttempts });
      throw new Error('Credenciales inválidas');
    }

    // Verificar si requiere 2FA solo cuando está configurado en el usuario
    if (user.twofa_secret) {
      return {
        requires2FA: true,
        userId: user.id,
        tempToken: this.generateTempToken(user.id)
      };
    }

    // Login exitoso sin 2FA
    return this.generarTokensYActualizarUsuario(user, ipAddress, userAgent);
  }

  // Verificar código 2FA
  async verify2FA(userId, code, ipAddress, userAgent) {
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const user = users[0];

    if (!user.twofa_secret) {
      throw new Error('2FA no configurado');
    }

    // Verificar código TOTP
    const isValid = authenticator.verify({
      token: code,
      secret: user.twofa_secret
    });

    if (!isValid) {
      throw new Error('Código 2FA inválido');
    }

    return this.generarTokensYActualizarUsuario(user, ipAddress, userAgent);
  }

  // Generar tokens y actualizar usuario
  async generarTokensYActualizarUsuario(user, ipAddress, userAgent) {
    // Generar JWT
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    // Generar refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Actualizar último login e reiniciar contador de intentos
    await pool.execute(
      'UPDATE USUARIO SET ultimo_login = NOW(), login_attempts = 0, locked_until = NULL WHERE id = ?',
      [user.id]
    );

    // Registrar login exitoso
    await this.registrarAudit(user.id, user.email, ipAddress, userAgent, 'login_exitoso', { rol: user.rol });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
        telefono: user.telefono
      }
    };
  }

  // Refresh token
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Obtener usuario
      const [users] = await pool.execute(
        'SELECT * FROM USUARIO WHERE id = ?',
        [decoded.id]
      );

      if (users.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const user = users[0];

      // Generar nuevo access token
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  // Cerrar sesión
  async logout(userId, refreshToken) {
    await this.registrarAudit(userId, null, null, null, 'logout', {});
    return { message: 'Sesión cerrada correctamente' };
  }

  // Verificar email
  async verifyEmail(verificationToken) {
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE verification_token = ?',
      [verificationToken]
    );

    if (users.length === 0) {
      throw new Error('Token de verificación inválido');
    }

    const user = users[0];

    try {
      const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
      if (decoded.purpose !== 'verify-email' || decoded.email !== user.email) {
        throw new Error('Token de verificación inválido');
      }
    } catch (error) {
      throw new Error('Token de verificación inválido o expirado');
    }

    // Marcar como verificado
    await pool.execute(
      'UPDATE USUARIO SET email_verificado = TRUE, verification_token = NULL, verification_expires = NULL WHERE id = ?',
      [user.id]
    );

    await this.registrarAudit(user.id, user.email, null, null, 'email_verificado', {});

    return { message: 'Email verificado correctamente', userId: user.id };
  }

  // Reenviar email de verificación
  async resendVerificationEmail(email) {
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const user = users[0];

    // Si ya está verificado, no es necesario reenviar
    if (user.email_verificado) {
      throw new Error('El email ya está verificado');
    }

    // Generar nuevo token de verificación
    const verificationToken = jwt.sign(
      { email: user.email, purpose: 'verify-email' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await pool.execute(
      'UPDATE USUARIO SET verification_token = ?, verification_expires = ? WHERE id = ?',
      [verificationToken, verificationExpires, user.id]
    );

    await this.registrarAudit(user.id, user.email, null, null, 'reenviar_verificacion_email', {});

    return { verificationToken, verificationExpires };
  }

  // Configurar 2FA
  async setup2FA(userId) {
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const user = users[0];

    // Generar secreto
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, process.env.TWO_FACTOR_ISSUER || 'PawSpa', secret);

    // Generar QR Code
    const qrCode = await QRCode.toDataURL(otpauth);

    // Guardar secreto temporalmente (no habilitado hasta verificar)
    await pool.execute(
      'UPDATE USUARIO SET twofa_secret = ? WHERE id = ?',
      [secret, userId]
    );

    return { secret, qrCode };
  }

  // Habilitar 2FA después de verificación
  async enable2FA(userId, code) {
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const user = users[0];

    if (!user.twofa_secret) {
      throw new Error('2FA no configurado');
    }

    // Verificar código
    const isValid = authenticator.verify({
      token: code,
      secret: user.twofa_secret
    });

    if (!isValid) {
      throw new Error('Código inválido');
    }

    // El secreto ya está guardado, solo queda habilitado
    await this.registrarAudit(userId, null, null, null, '2fa_habilitado', {});

    return { message: '2FA habilitado correctamente' };
  }

  // Deshabilitar 2FA
  async disable2FA(userId, password) {
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const user = users[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Contraseña incorrecta');
    }

    await pool.execute(
      'UPDATE USUARIO SET twofa_secret = NULL WHERE id = ?',
      [userId]
    );

    await this.registrarAudit(userId, null, null, null, '2fa_deshabilitado', {});

    return { message: '2FA deshabilitado correctamente' };
  }

  // Cambiar contraseña
  async changePassword(userId, currentPassword, newPassword) {
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const user = users[0];

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Validar contraseña fuerte
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      const error = new Error('Contraseña débil');
      error.errors = passwordValidation.errors;
      error.score = passwordValidation.score;
      throw error;
    }

    // Hash de nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await pool.execute(
      'UPDATE USUARIO SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    );

    await this.registrarAudit(userId, null, null, null, 'cambiar_password', {});

    return { message: 'Contraseña cambiada correctamente' };
  }

  // Generar token temporal para 2FA
  generateTempToken(userId) {
    return jwt.sign(
      { temp: true, id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
  }

  generateCaptcha() {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    const answer = String(a + b);
    const captchaToken = jwt.sign(
      { answer },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return {
      question: `¿Cuánto es ${a} + ${b}?`,
      captchaToken
    };
  }

  validateCaptcha(captchaToken, captchaAnswer) {
    if (!captchaToken || captchaAnswer === undefined || captchaAnswer === null) {
      return false;
    }

    try {
      const decoded = jwt.verify(captchaToken, process.env.JWT_SECRET);
      return String(decoded.answer) === String(captchaAnswer).trim();
    } catch (error) {
      return false;
    }
  }

  // Registrar auditoría unificado
  async registrarAudit(userId, email, ipAddress, userAgent, accion, detalles) {
    try {
      // Obtener rol si userId está disponible
      let rol = null;
      if (userId) {
        const [users] = await pool.execute(
          'SELECT rol FROM USUARIO WHERE id = ?',
          [userId]
        );
        if (users.length > 0) {
          rol = users[0].rol;
        }
      }

      const ip = ipAddress ?? null;
      const agent = userAgent ?? null;
      const details = detalles == null ? null : JSON.stringify(detalles);

      // Usar la tabla AUDITORIA_LOG con todos los campos
      await pool.execute(
        'INSERT INTO AUDITORIA_LOG (usuario_id, email, rol, accion, ip_origen, user_agent, detalles) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId ?? null, email ?? null, rol, accion, ip, agent, details]
      );
    } catch (error) {
      console.error('Error al registrar auditoría:', error);
    }
  }

  // Registrar auditoría de login (compatibilidad)
  async registrarAuditLogin(userId, email, ipAddress, userAgent, evento, detalles) {
    return this.registrarAudit(userId, email, ipAddress, userAgent, evento, detalles);
  }

  // Registrar auditoría general (compatibilidad)
  async registrarAuditLog(userId, accion, entidad, entidadId, datosAnteriores, datosNuevos) {
    return this.registrarAudit(userId, null, null, null, accion, { entidad, entidadId, datosAnteriores, datosNuevos });
  }

  // Obtener usuario por ID
  async getUserById(userId) {
    const [users] = await pool.execute(
      'SELECT id, email, nombre, apellido, rol, telefono, activo, email_verificado, twofa_secret, ultimo_login, created_at FROM USUARIO WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    return users[0];
  }

  // Obtener todos los usuarios (solo admin)
  async getAllUsers() {
    const [users] = await pool.execute(
      'SELECT id, email, nombre, apellido, rol, telefono, activo, email_verificado, twofa_secret, ultimo_login, created_at FROM USUARIO ORDER BY created_at DESC'
    );

    return users;
  }

  // Actualizar usuario
  async updateUser(userId, userData) {
    const { nombre, apellido, telefono } = userData;

    await pool.execute(
      'UPDATE USUARIO SET nombre = ?, apellido = ?, telefono = ? WHERE id = ?',
      [nombre, apellido, telefono, userId]
    );

    return this.getUserById(userId);
  }

  // Eliminar usuario (soft delete)
  async deleteUser(userId) {
    await pool.execute(
      'UPDATE USUARIO SET activo = FALSE WHERE id = ?',
      [userId]
    );

    return { message: 'Usuario eliminado correctamente' };
  }

  // Actualizar rol de usuario
  async updateUserRole(userId, newRole, adminId) {
    // Verificar que el usuario existe
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const oldRole = users[0].rol;

    // Actualizar rol
    await pool.execute(
      'UPDATE USUARIO SET rol = ? WHERE id = ?',
      [newRole, userId]
    );

    // Registrar auditoría
    await this.registrarAudit(adminId, null, null, null, 'cambio_rol', {
      usuario_afectado: userId,
      rol_anterior: oldRole,
      rol_nuevo: newRole
    });

    const user = await this.getUserById(userId);
    return { ...user, oldRole };
  }

  // Actualizar estado de usuario
  async updateUserStatus(userId, activo, adminId) {
    // Verificar que el usuario existe
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const oldStatus = users[0].activo;

    // Actualizar estado
    await pool.execute(
      'UPDATE USUARIO SET activo = ? WHERE id = ?',
      [activo, userId]
    );

    // Registrar auditoría
    await this.registrarAudit(adminId, null, null, null, 'cambio_estado', {
      usuario_afectado: userId,
      estado_anterior: oldStatus,
      estado_nuevo: activo
    });

    const user = await this.getUserById(userId);
    return { ...user, oldStatus };
  }

  // Eliminar usuario (soft delete)
  async deleteUser(userId, adminId) {
    // Verificar que el usuario existe
    const [users] = await pool.execute(
      'SELECT * FROM USUARIO WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    // Soft delete
    await pool.execute(
      'UPDATE USUARIO SET activo = FALSE WHERE id = ?',
      [userId]
    );

    // Registrar auditoría
    await this.registrarAudit(adminId, null, null, null, 'eliminacion_usuario', {
      usuario_afectado: userId
    });

    return { message: 'Usuario eliminado correctamente' };
  }
}

const authServiceInstance = new AuthService();
module.exports = authServiceInstance;
module.exports.default = authServiceInstance;