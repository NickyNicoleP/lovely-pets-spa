/**
 * Módulo de Cifrado para Datos Sensibles
 * Cifra/descifra información de pago, datos personales y otros datos sensibles
 * Usa AES-256-GCM para mayor seguridad
 */

const crypto = require('crypto');
require('dotenv').config();

// Validar que exista KEY de cifrado en variables de entorno
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error('[ENCRYPTION] ERROR: ENCRYPTION_KEY en .env debe tener al menos 32 caracteres');
  console.error('[ENCRYPTION] Generando una clave de ejemplo (NO usar en producción):');
  console.error('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
}

const ALGORITHM = 'aes-256-gcm';

/**
 * Cifra un valor
 * @param {string} plainText - Texto a cifrar
 * @returns {string} - Texto cifrado en formato: iv:encryptedData:authTag
 */
function encrypt(plainText) {
  if (!plainText) return null;

  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Formato: iv:encryptedData:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('[ENCRYPTION] Error cifrando:', error.message);
    throw new Error('Error cifrando datos sensibles');
  }
}

/**
 * Descifra un valor
 * @param {string} encryptedText - Texto cifrado en formato: iv:encryptedData:authTag
 * @returns {string} - Texto descifrado
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;

  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Formato de texto cifrado inválido');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[ENCRYPTION] Error descifrando:', error.message);
    throw new Error('Error descifrando datos sensibles');
  }
}

/**
 * Cifra objeto (ej: información de tarjeta)
 * @param {object} obj - Objeto con campos a cifrar
 * @param {array} fieldsToEncrypt - Lista de campos a cifrar
 * @returns {object} - Objeto con campos cifrrados
 */
function encryptObject(obj, fieldsToEncrypt) {
  const encrypted = { ...obj };

  fieldsToEncrypt.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  });

  return encrypted;
}

/**
 * Descifra objeto
 * @param {object} obj - Objeto con campos cifrados
 * @param {array} fieldsToDecrypt - Lista de campos a descifrar
 * @returns {object} - Objeto descifrado
 */
function decryptObject(obj, fieldsToDecrypt) {
  const decrypted = { ...obj };

  fieldsToDecrypt.forEach(field => {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  });

  return decrypted;
}

/**
 * Hash de valor (para comparación sin descifrar, ej: últimos 4 dígitos tarjeta)
 * @param {string} value - Valor a hashear
 * @returns {string} - Hash SHA256
 */
function hashValue(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

/**
 * Extrae últimos 4 dígitos de tarjeta
 * @param {string} cardNumber - Número de tarjeta completo
 * @returns {string} - Últimos 4 dígitos
 */
function getLastFourDigits(cardNumber) {
  return cardNumber.slice(-4);
}

/**
 * Enmascara número de tarjeta (ej: "4532-****-****-1234")
 * @param {string} cardNumber - Número de tarjeta
 * @returns {string} - Tarjeta enmascarada
 */
function maskCardNumber(cardNumber) {
  const last4 = getLastFourDigits(cardNumber);
  return `****-****-****-${last4}`;
}

/**
 * Genera clave de cifrado (uso único: para configurar .env)
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hashValue,
  getLastFourDigits,
  maskCardNumber,
  generateEncryptionKey,
  ALGORITHM
};
