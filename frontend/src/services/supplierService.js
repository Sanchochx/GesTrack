import api from './api';

/**
 * Servicio de proveedores
 * US-SUPP-001: Registrar Proveedor
 * US-SUPP-002: Listar Proveedores
 * US-SUPP-003: Ver Perfil del Proveedor
 * US-SUPP-004: Editar Proveedor
 */
const supplierService = {
  /**
   * Registra un nuevo proveedor
   * @param {Object} supplierData - Datos del proveedor
   * @returns {Promise} - Respuesta del servidor
   */
  async createSupplier(supplierData) {
    try {
      const response = await api.post('/suppliers', supplierData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Lista proveedores paginados y ordenados
   * @param {Object} params - { page, per_page, sort_by, order }
   * @returns {Promise} - Respuesta del servidor
   */
  async getSuppliers(params = {}) {
    try {
      const response = await api.get('/suppliers', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Obtiene el perfil detallado de un proveedor
   * @param {string} id - ID del proveedor
   * @returns {Promise} - Respuesta del servidor
   */
  async getSupplier(id) {
    try {
      const response = await api.get(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Actualiza los datos de un proveedor existente
   * @param {string} id - ID del proveedor
   * @param {Object} supplierData - Campos a actualizar
   * @returns {Promise} - Respuesta del servidor
   */
  async updateSupplier(id, supplierData) {
    try {
      const response = await api.put(`/suppliers/${id}`, supplierData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },
};

export default supplierService;
