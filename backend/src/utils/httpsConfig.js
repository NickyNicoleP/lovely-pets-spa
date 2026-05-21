/**
 * Configuración de HTTPS y Seguridad de Transporte
 * Fuerza HTTPS en producción, permite HTTP en desarrollo
 */

require('dotenv').config();

/**
 * Middleware: Fuerza HTTPS en producción
 */
const forceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
  }
  next();
};

/**
 * Middleware: Agrega headers de seguridad HTTP
 */
const securityHeaders = (req, res, next) => {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Habilitar XSS protection del navegador
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Política de seguridad de contenido (CSP)
  // Solo permitir scripts de mismo origen + trusted CDNs
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss: ws:"
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (antes Feature-Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  // HSTS (HTTP Strict Transport Security) - solo en producción
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

/**
 * Configuración de HTTPS con certificados
 * Para desarrollo: usar autofirmados
 * Para producción: usar certificados válidos (Let's Encrypt, etc.)
 */
function getHTTPSOptions() {
  const fs = require('fs');
  const path = require('path');

  if (process.env.NODE_ENV === 'production') {
    // Certificados en producción
    return {
      key: fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8'),
      ca: process.env.SSL_CA_PATH ? fs.readFileSync(process.env.SSL_CA_PATH, 'utf8') : null
    };
  } else {
    // Certificados autofirmados para desarrollo
    const certPath = path.join(__dirname, '../../certs');
    const keyPath = path.join(certPath, 'private.key');
    const certFilePath = path.join(certPath, 'certificate.crt');

    if (fs.existsSync(keyPath) && fs.existsSync(certFilePath)) {
      return {
        key: fs.readFileSync(keyPath, 'utf8'),
        cert: fs.readFileSync(certFilePath, 'utf8')
      };
    } else {
      console.warn('[HTTPS] Certificados autofirmados no encontrados en /certs');
      console.warn('[HTTPS] Ejecuta: npm run generate:ssl');
      return null;
    }
  }
}

/**
 * Script para generar certificados autofirmados (ejecutar en desarrollo)
 */
function generateSelfSignedCert() {
  const { execSync } = require('child_process');
  const fs = require('fs');
  const path = require('path');

  const certPath = path.join(__dirname, '../../certs');

  // Crear carpeta certs si no existe
  if (!fs.existsSync(certPath)) {
    fs.mkdirSync(certPath, { recursive: true });
  }

  console.log('[HTTPS] Generando certificados autofirmados...');

  try {
    execSync(
      `openssl req -x509 -newkey rsa:4096 -keyout ${path.join(certPath, 'private.key')} -out ${path.join(certPath, 'certificate.crt')} -days 365 -nodes -subj "/CN=localhost"`,
      { stdio: 'inherit' }
    );
    console.log('[HTTPS] ✅ Certificados generados en /certs');
  } catch (error) {
    console.error('[HTTPS] Error generando certificados:', error.message);
    console.log('[HTTPS] En Windows, instala OpenSSL: https://slproweb.com/products/Win32OpenSSL.html');
  }
}

/**
 * Instancia HTTPS server
 */
function createHTTPSServer(app) {
  const https = require('https');
  const options = getHTTPSOptions();

  if (!options) {
    console.warn('[HTTPS] No se puede crear servidor HTTPS sin certificados');
    return null;
  }

  return https.createServer(options, app);
}

module.exports = {
  forceHTTPS,
  securityHeaders,
  getHTTPSOptions,
  generateSelfSignedCert,
  createHTTPSServer
};
