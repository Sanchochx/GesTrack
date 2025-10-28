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
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });

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
};

export default authService;
