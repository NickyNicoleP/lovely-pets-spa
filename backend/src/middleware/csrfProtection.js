/**
 * CSRF Protection Middleware
 * Protege contra ataques Cross-Site Request Forgery usando tokens
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Almacenamiento en memoria de CSRF tokens
 * En producción, usar Redis con expiración
 */
const csrfTokens = new Map();

/**
 * Configurable: cuáles métodos requieren CSRF token
 */
const UNSAFE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Endpoints que PUEDEN SALTARSE CSRF (ej: login, register)
 */
const CSRF_EXEMPT_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-2fa',
  '/api/auth/refresh',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/captcha',
  '/api/auth/logout',
  '/api/agenda',
  '/api/health'
];

/**
 * Genera un nuevo CSRF token
 * @param {string} sessionId - Identificador único del cliente (user ID o session ID)
 */
function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(sessionId + token)
    .digest('hex');

  // Almacenar con expiración de 1 hora
  csrfTokens.set(hash, {
    createdAt: Date.now(),
    sessionId,
    expiresAt: Date.now() + 60 * 60 * 1000
  });

  return {
    token,
    hash
  };
}

/**
 * Valida CSRF token
 * @param {string} token - Token enviado en header X-CSRF-Token
 * @param {string} hash - Hash del token almacenado (enviado en cookie)
 * @param {string} sessionId - Session ID del usuario
 */
function validateCSRFToken(token, hash, sessionId) {
  const storedData = csrfTokens.get(hash);

  if (!storedData) {
    return { valid: false, error: 'Token CSRF no encontrado' };
  }

  // Verificar expiración
  if (Date.now() > storedData.expiresAt) {
    csrfTokens.delete(hash);
    return { valid: false, error: 'Token CSRF expirado' };
  }

  // Recalcular hash para verificar
  const calculatedHash = crypto
    .createHash('sha256')
    .update(sessionId + token)
    .digest('hex');

  if (calculatedHash !== hash) {
    console.warn(`[CSRF] Token inválido para sesión ${sessionId}`);
    return { valid: false, error: 'Token CSRF inválido' };
  }

  // Token válido
  return { valid: true };
}

/**
 * Middleware: Validar CSRF token
 */
const validateCSRF = (req, res, next) => {
  // Solo validar métodos inseguros
  if (!UNSAFE_METHODS.includes(req.method)) {
    return next();
  }

  // Saltarse CSRF para endpoints exentos
  if (CSRF_EXEMPT_ENDPOINTS.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }

  // Si la autenticación es por JWT Bearer header, no se requiere CSRF
  // porque el token no se envía automáticamente desde un origen malicioso.
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return next();
  }

  // No requerir CSRF para rutas públicas sin autenticación
  if (!req.user && !UNSAFE_METHODS.includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];
  const csrfHash = req.cookies?.csrf_hash;
  const sessionId = req.user?.id || req.sessionID;

  if (!csrfToken || !csrfHash) {
    console.warn(`[CSRF] Token faltante en ${req.method} ${req.path}`);
    return res.status(403).json({
      error: 'CSRF token faltante. Headers requerido: X-CSRF-Token',
      statusCode: 'CSRF_TOKEN_MISSING'
    });
  }

  const validation = validateCSRFToken(csrfToken, csrfHash, sessionId);

  if (!validation.valid) {
    return res.status(403).json({
      error: `Error CSRF: ${validation.error}`,
      statusCode: 'CSRF_VALIDATION_FAILED'
    });
  }

  // Generar nuevo token para próxima request
  const newTokenData = generateCSRFToken(sessionId);
  res.cookie('csrf_hash', newTokenData.hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000 // 1 hora
  });

  next();
};

/**
 * Middleware: Inyectar CSRF token en response
 * Se ejecuta antes de enviar respuesta para incluir token
 */
const injectCSRFToken = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Si el usuario está autenticado, incluir CSRF token en response
    if (req.user && !CSRF_EXEMPT_ENDPOINTS.some(endpoint => req.path.startsWith(endpoint))) {
      const tokenData = generateCSRFToken(req.user.id);
      
      // Agregar token a la respuesta
      if (typeof data === 'object' && data !== null) {
        data._csrf = {
          token: tokenData.token,
          hash: tokenData.hash
        };
      }

      // También enviar en cookie
      res.cookie('csrf_hash', tokenData.hash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Limpia tokens expirados (limpieza periódica)
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  let cleaned = 0;

  for (const [hash, data] of csrfTokens.entries()) {
    if (now > data.expiresAt) {
      csrfTokens.delete(hash);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[CSRF] Limpieza: ${cleaned} tokens expirados removidos`);
  }
}

// Ejecutar limpieza cada 30 minutos
setInterval(cleanupExpiredTokens, 30 * 60 * 1000);

module.exports = {
  generateCSRFToken,
  validateCSRFToken,
  validateCSRF,
  injectCSRFToken,
  CSRF_EXEMPT_ENDPOINTS
};
