import api from './api';

/**
 * Servicio de proveedores
 * US-SUPP-001: Registrar Proveedor
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
};

export default supplierService;
