import api from './api';

/**
 * Servicio de clientes
 * US-CUST-001: Registrar Nuevo Cliente
 */
const customerService = {
  /**
   * Crea un nuevo cliente
   * CA-9: Guardado y confirmación
   * @param {Object} customerData - Datos del cliente
   * @returns {Promise} - Respuesta del servidor
   */
  async createCustomer(customerData) {
    try {
      const response = await api.post('/customers', customerData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Verifica si un email ya está registrado
   * CA-5: Validación de email único
   * @param {string} email - Email a verificar
   * @param {string} excludeId - ID de cliente a excluir (para edición)
   * @returns {Promise} - { available: boolean, existing_customer?: {...} }
   */
  async checkEmail(email, excludeId = null) {
    try {
      const params = { email };
      if (excludeId) params.exclude_id = excludeId;
      const response = await api.get('/customers/check-email', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Obtiene la lista de clientes con filtros opcionales
   * @param {Object} filters - Filtros (search, page, limit, is_active, sort_by, order)
   * @returns {Promise} - Lista de clientes con paginación
   */
  async getCustomers(filters = {}) {
    try {
      const response = await api.get('/customers', { params: filters });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Obtiene un cliente por ID
   * @param {string} customerId - ID del cliente
   * @returns {Promise} - Datos del cliente
   */
  async getCustomer(customerId) {
    try {
      const response = await api.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },
};

export default customerService;
