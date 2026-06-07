const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return role;
  if (role === 'administrador') return 'admin';
  return role;
};

/**
 * Middleware: Valida JWT y extrae información del usuario
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('[AUTH] Token inválido:', err.message);
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    
    // Validar que el token no esté en blacklist (logout)
    const isBlacklisted = isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(403).json({ error: 'Sesión cerrada. Por favor, inicie sesión de nuevo.' });
    }
    
    req.user = user;
    req.token = token;
    next();
  });
};

/**
 * Middleware: Valida roles (RBAC)
 * @param {string|array} rolesArray - Rol o array de roles permitidos
 * @returns {Function} Express middleware
 */
const requireRole = (rolesArray) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const allowedRoles = Array.isArray(rolesArray) ? rolesArray : [rolesArray];
    const userRole = normalizeRole(req.user.rol);
    const allowed = allowedRoles.includes(userRole);
    
    if (!allowed) {
      console.warn(`[RBAC] Usuario ${req.user.id} (rol: ${req.user.rol}) intentó acceder sin permisos. Requerido: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ 
        error: 'No autorizado para esta acción',
        userRole: req.user.rol,
        requiredRoles: allowedRoles
      });
    }
    
    next();
  };
};

/**
 * Middleware: Valida que el usuario sea propietario del recurso O sea admin
 * Valida que mascota, cliente o reserva pertenezca al usuario autenticado
 * @param {string} resourceType - 'mascota', 'cliente', 'reserva', etc.
 * @param {string} paramName - nombre del parámetro en req.params
 */
const validateOwnershipOrAdmin = (resourceType, paramName = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Admin y empleados tienen acceso a todo
    const normalizedRole = normalizeRole(req.user.rol);
    if (normalizedRole === 'admin' || normalizedRole === 'empleado') {
      return next();
    }

    const resourceId = req.params[paramName];
    if (!resourceId) {
      return res.status(400).json({ error: 'ID de recurso requerido' });
    }

    try {
      let isOwner = false;

      if (resourceType === 'mascota') {
        // Verificar que el cliente propietario sea el usuario autenticado
        const [rows] = await pool.execute(
          `SELECT c.usuario_id FROM MASCOTA m
           JOIN CLIENTE c ON m.cliente_id = c.id
           WHERE m.id = ?`,
          [resourceId]
        );
        isOwner = rows.length > 0 && rows[0].usuario_id === req.user.id;
      } else if (resourceType === 'cliente') {
        // Verificar que el cliente sea el usuario autenticado
        const [rows] = await pool.execute(
          `SELECT usuario_id FROM CLIENTE WHERE id = ?`,
          [resourceId]
        );
        isOwner = rows.length > 0 && rows[0].usuario_id === req.user.id;
      } else if (resourceType === 'reserva') {
        // Verificar que la reserva pertenezca a una mascota del usuario
        const [rows] = await pool.execute(
          `SELECT c.usuario_id FROM SLOT_RESERVA sr
           JOIN MASCOTA m ON sr.mascota_id = m.id
           JOIN CLIENTE c ON m.cliente_id = c.id
           WHERE sr.id = ?`,
          [resourceId]
        );
        isOwner = rows.length > 0 && rows[0].usuario_id === req.user.id;
      } else if (resourceType === 'ficha_grooming') {
        // Verificar acceso del groomer o del propietario de la mascota
        const [rows] = await pool.execute(
          `SELECT c.usuario_id AS propietario_usuario_id, g.usuario_id AS groomer_usuario_id
           FROM FICHA_GROOMING fg
           JOIN SLOT_RESERVA sr ON fg.reserva_id = sr.id
           JOIN MASCOTA m ON sr.mascota_id = m.id
           JOIN CLIENTE c ON m.cliente_id = c.id
           LEFT JOIN GROOMER g ON sr.groomer_id = g.id
           WHERE fg.id = ?`,
          [resourceId]
        );
        if (rows.length > 0) {
          const isGroomer = req.user.rol === 'groomer' && rows[0].groomer_usuario_id === req.user.id;
          const isOwner_user = rows[0].propietario_usuario_id === req.user.id;
          isOwner = isGroomer || isOwner_user;
        }
      }

      if (!isOwner) {
        console.warn(`[OWNERSHIP] Usuario ${req.user.id} intentó acceder a ${resourceType} ${resourceId} sin permisos`);
        return res.status(403).json({ 
          error: 'No tiene permiso para acceder a este recurso'
        });
      }

      next();
    } catch (error) {
      console.error('[OWNERSHIP] Error validando propiedad:', error);
      res.status(500).json({ error: 'Error validando acceso al recurso' });
    }
  };
};

/**
 * Almacenamiento en memoria de tokens blacklisted (revocados)
 * En producción, usar Redis
 */
const tokenBlacklist = new Set();

/**
 * Agrega token a blacklist (usado en logout)
 */
const blacklistToken = (token) => {
  // En producción: usar Redis con expiración
  tokenBlacklist.add(token);
  console.log('[BLACKLIST] Token revocado');
};

/**
 * Verifica si token está en blacklist
 */
const isTokenBlacklisted = (token) => {
  // En producción: consultar Redis
  return tokenBlacklist.has(token);
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err && !isTokenBlacklisted(token)) {
        req.user = user;
      }
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  validateOwnershipOrAdmin,
  blacklistToken,
  isTokenBlacklisted
};