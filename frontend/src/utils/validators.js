/**
 * Validaciones del lado del cliente
 * Coinciden con las validaciones del backend para mejor UX
 */

/**
 * Valida la fortaleza de una contraseña
 * Criterios: mínimo 8 caracteres, una mayúscula, una minúscula, un número
 * @param {string} password - Contraseña a validar
 * @returns {Object} - {isValid: boolean, errors: string[]}
 */
export const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener mínimo 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }

  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calcula el nivel de fortaleza de una contraseña
 * @param {string} password - Contraseña a evaluar
 * @returns {string} - 'debil', 'media', 'fuerte', 'muy_fuerte'
 */
export const calculatePasswordStrength = (password) => {
  let score = 0;

  // Longitud
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Caracteres
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (score <= 2) return 'debil';
  if (score <= 4) return 'media';
  if (score <= 6) return 'fuerte';
  return 'muy_fuerte';
};

/**
 * Obtiene el color asociado al nivel de fortaleza
 * @param {string} strength - Nivel de fortaleza
 * @returns {string} - Color en formato CSS
 */
export const getPasswordStrengthColor = (strength) => {
  const colors = {
    debil: '#f44336', // Rojo
    media: '#ff9800', // Naranja
    fuerte: '#2196f3', // Azul
    muy_fuerte: '#4caf50', // Verde
  };
  return colors[strength] || '#9e9e9e';
};

/**
 * Obtiene el texto de label para el nivel de fortaleza
 * @param {string} strength - Nivel de fortaleza
 * @returns {string} - Texto descriptivo
 */
export const getPasswordStrengthLabel = (strength) => {
  const labels = {
    debil: 'Débil',
    media: 'Media',
    fuerte: 'Fuerte',
    muy_fuerte: 'Muy Fuerte',
  };
  return labels[strength] || '';
};

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si el formato es válido
 */
export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida que un valor no esté vacío
 * @param {string} value - Valor a validar
 * @returns {boolean} - True si no está vacío
 */
export const validateRequired = (value) => {
  return value && value.trim() !== '';
};
