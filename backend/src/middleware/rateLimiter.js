/**
 * Rate Limiting Middleware para proteger contra ataques de fuerza bruta
 * Limita intentos de login a 5 fallidos por 15 minutos
 */

const loginAttempts = new Map();

/**
 * Configuración de rate limiting
 */
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
  blockDurationMs: 15 * 60 * 1000 // Bloquear por 15 minutos
};

/**
 * Middleware: Valida límite de intentos de login
 * Usa combinación de IP + Email para identificar intentos
 */
const rateLimitLogin = (req, res, next) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
  
  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  const key = `${email}:${ipAddress}`;
  const now = Date.now();
  
  // Obtener historial de intentos
  let attempt = loginAttempts.get(key);
  
  if (!attempt) {
    // Primer intento
    attempt = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
      blockedUntil: null
    };
  }

  // Limpiar historial si expiró la ventana
  if (now - attempt.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
    attempt = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
      blockedUntil: null
    };
  }

  // Verificar si está bloqueado
  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    const remainingSeconds = Math.ceil((attempt.blockedUntil - now) / 1000);
    console.warn(`[RATE_LIMIT] Intento bloqueado para ${key}. Reintentar en ${remainingSeconds}s`);
    
    return res.status(429).json({
      error: 'Demasiados intentos de login fallidos. Por favor, intente más tarde.',
      retryAfter: remainingSeconds
    });
  }

  // Almacenar intento y permitir continuar
  loginAttempts.set(key, attempt);
  req.loginAttemptKey = key; // Para usar en callback de logout/login fallido
  
  next();
};

/**
 * Registra intento de login fallido
 * Se llama desde authService después de fallar validación de contraseña
 */
const recordFailedLoginAttempt = (key) => {
  const now = Date.now();
  let attempt = loginAttempts.get(key) || {
    count: 0,
    firstAttempt: now,
    lastAttempt: now,
    blockedUntil: null
  };

  attempt.count++;
  attempt.lastAttempt = now;

  // Si alcanza el límite, bloquear
  if (attempt.count >= RATE_LIMIT_CONFIG.maxAttempts) {
    attempt.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
    console.warn(`[RATE_LIMIT] Usuario/IP bloqueado por ${RATE_LIMIT_CONFIG.blockDurationMs / 1000}s: ${key}`);
  }

  loginAttempts.set(key, attempt);
};

/**
 * Limpia intentos de login después de éxito
 */
const clearLoginAttempts = (key) => {
  loginAttempts.delete(key);
  console.log(`[RATE_LIMIT] Historial de intentos limpiado: ${key}`);
};

/**
 * Limpia intentos muy antiguos (limpieza periódica)
 */
const cleanupOldAttempts = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, attempt] of loginAttempts.entries()) {
    if (now - attempt.lastAttempt > RATE_LIMIT_CONFIG.windowMs * 2) {
      loginAttempts.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[RATE_LIMIT] Limpieza: ${cleaned} intentos antiguos removidos`);
  }
};

// Ejecutar limpieza cada 30 minutos
setInterval(cleanupOldAttempts, 30 * 60 * 1000);

module.exports = {
  rateLimitLogin,
  recordFailedLoginAttempt,
  clearLoginAttempts,
  RATE_LIMIT_CONFIG
};
