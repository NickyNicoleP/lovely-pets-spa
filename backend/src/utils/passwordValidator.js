/**
 * Validador de contraseña fuerte
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 * - Al menos un símbolo especial
 */

const VALID_SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
const MIN_LENGTH = 8;

function validatePasswordStrength(password) {
  const errors = [];

  if (!password) {
    return {
      isValid: false,
      score: 0,
      errors: ['La contraseña es requerida']
    };
  }

  if (password.length < MIN_LENGTH) {
    errors.push(`Mínimo ${MIN_LENGTH} caracteres`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Al menos una letra mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Al menos una letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Al menos un número');
  }

  if (!VALID_SPECIAL_CHARS.test(password)) {
    errors.push('Al menos un símbolo especial (!@#$%^&*)');
  }

  // Calcular score
  let score = 0;
  if (password.length >= MIN_LENGTH) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (VALID_SPECIAL_CHARS.test(password)) score++;

  return {
    isValid: errors.length === 0,
    score: Math.ceil((score / 6) * 100),
    errors: errors
  };
}

module.exports = {
  validatePasswordStrength
};
