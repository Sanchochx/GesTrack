import api from './api';

/**
 * Servicio de autenticación
 * Maneja las llamadas al API para registro, login, etc.
 */
const authService = {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario (full_name, email, password, role)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);

      if (response.data.success && response.data.data.token) {
        // Guardar token y usuario en localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Inicia sesión de un usuario
   * US-AUTH-002 - CA-5: Session persistence
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @param {boolean} rememberMe - Si mantener sesión por 30 días (default: false = 24 horas)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async login(email, password, rememberMe = false) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        remember_me: rememberMe
      });

      if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Cierra la sesión del usuario actual
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Obtiene el usuario actual desde localStorage
   * @returns {Object|null} - Usuario actual o null
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Verifica si hay un usuario autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Obtiene la lista de todos los usuarios
   * @returns {Promise} - Promesa con la lista de usuarios
   */
  async getUsers() {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Actualiza el perfil del usuario actual
   * US-AUTH-004 - CA-3, CA-4: Profile update with validations
   * @param {string} userId - ID del usuario
   * @param {Object} profileData - Datos a actualizar (full_name, email)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async updateProfile(userId, profileData) {
    try {
      const response = await api.patch(`/auth/users/${userId}`, profileData);

      if (response.data.success && response.data.data.user) {
        // Actualizar usuario en localStorage
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Cambia la contraseña del usuario actual
   * US-AUTH-004 - CA-5: Password change functionality
   * @param {string} userId - ID del usuario
   * @param {Object} passwordData - Datos de contraseñas (current_password, new_password, confirm_password)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async changePassword(userId, passwordData) {
    try {
      const response = await api.put(`/auth/users/${userId}/password`, passwordData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Solicita el enlace de recuperación de contraseña
   * US-AUTH-006 - CA-2, CA-3: Request password reset
   * @param {string} email - Email del usuario
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async requestPasswordReset(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Resetea la contraseña usando el token
   * US-AUTH-006 - CA-6, CA-7, CA-8: Reset password with token
   * @param {string} token - Token de recuperación
   * @param {string} newPassword - Nueva contraseña
   * @param {string} confirmPassword - Confirmación de contraseña
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async resetPassword(token, newPassword, confirmPassword) {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },
};

export default authService;
