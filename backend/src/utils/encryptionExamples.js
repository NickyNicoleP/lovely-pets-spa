/**
 * EJEMPLO DE USO DEL MÓDULO DE CIFRADO
 * Para la tabla CARRITO / PAGO
 */

const encryption = require('./encryption');

/**
 * Función auxiliar para preparar información de pago
 * Cifra los datos sensibles antes de guardar en BD
 */
function encryptPaymentData(paymentData) {
  const { numero_tarjeta, nombre_titular, cvv, fecha_expiracion, ...otherData } = paymentData;

  return {
    ...otherData,
    // Campos cifrados
    numero_tarjeta_encrypted: encryption.encrypt(numero_tarjeta),
    numero_tarjeta_masked: encryption.maskCardNumber(numero_tarjeta),
    nombre_titular_encrypted: encryption.encrypt(nombre_titular),
    cvv_encrypted: encryption.encrypt(cvv),
    fecha_expiracion_encrypted: encryption.encrypt(fecha_expiracion),
    
    // Hash para buscar sin descifrar
    numero_tarjeta_hash: encryption.hashValue(numero_tarjeta),
    
    // Últimos 4 dígitos visible
    numero_tarjeta_last4: encryption.getLastFourDigits(numero_tarjeta)
  };
}

/**
 * Descifra información de pago cuando sea necesario
 */
function decryptPaymentData(paymentDataFromDB) {
  const {
    numero_tarjeta_encrypted,
    nombre_titular_encrypted,
    cvv_encrypted,
    fecha_expiracion_encrypted,
    ...otherData
  } = paymentDataFromDB;

  return {
    ...otherData,
    numero_tarjeta: encryption.decrypt(numero_tarjeta_encrypted),
    nombre_titular: encryption.decrypt(nombre_titular_encrypted),
    cvv: encryption.decrypt(cvv_encrypted),
    fecha_expiracion: encryption.decrypt(fecha_expiracion_encrypted)
  };
}

/**
 * Cifra datos personales sensibles
 * Para tabla USUARIO, CLIENTE, etc.
 */
function encryptPersonalData(userData) {
  return encryption.encryptObject(userData, ['ci', 'telefono', 'direccion', 'email']);
}

/**
 * Descifra datos personales
 */
function decryptPersonalData(userData) {
  return encryption.decryptObject(userData, ['ci', 'telefono', 'direccion', 'email']);
}

module.exports = {
  encryptPaymentData,
  decryptPaymentData,
  encryptPersonalData,
  decryptPersonalData
};
