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

  /**
   * US-SUPP-012: Historial de órdenes de compra de un proveedor
   * @param {string} id - ID del proveedor
   * @param {Object} params - { page, per_page, sort_order, status, date_from, date_to }
   * @returns {Promise} - Respuesta del servidor
   */
  async getSupplierPurchaseHistory(id, params = {}) {
    try {
      const response = await api.get(`/suppliers/${id}/purchase-orders`, { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-SUPP-012 CA-8: Exporta el historial de órdenes de compra de un proveedor
   * @param {string} id - ID del proveedor
   * @param {Object} filters - { status, date_from, date_to }
   * @param {string} format - 'csv' o 'excel'
   */
  async exportSupplierPurchaseHistory(id, filters = {}, format = 'csv') {
    try {
      const response = await api.get(`/suppliers/${id}/purchase-orders/export`, {
        params: { ...filters, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      let filename = `historial_ordenes_proveedor_${new Date().toISOString().split('T')[0]}.${extension}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Archivo descargado exitosamente' };
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-SUPP-014: Lista los productos que provee un proveedor
   * @param {string} id - ID del proveedor
   * @returns {Promise} - Respuesta del servidor
   */
  async getSupplierProducts(id) {
    try {
      const response = await api.get(`/suppliers/${id}/products`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-SUPP-014: Vincula un producto a un proveedor
   * @param {string} id - ID del proveedor
   * @param {Object} data - { product_id, preferential_price, is_preferred }
   * @returns {Promise} - Respuesta del servidor
   */
  async linkSupplierProduct(id, data) {
    try {
      const response = await api.post(`/suppliers/${id}/products`, data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-SUPP-014: Actualiza el precio preferencial / proveedor preferido de un vínculo
   * @param {string} id - ID del proveedor
   * @param {string} productId - ID del producto
   * @param {Object} data - { preferential_price, is_preferred }
   * @returns {Promise} - Respuesta del servidor
   */
  async updateSupplierProduct(id, productId, data) {
    try {
      const response = await api.put(`/suppliers/${id}/products/${productId}`, data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-SUPP-014: Elimina el vínculo entre un proveedor y un producto
   * @param {string} id - ID del proveedor
   * @param {string} productId - ID del producto
   * @returns {Promise} - Respuesta del servidor
   */
  async unlinkSupplierProduct(id, productId) {
    try {
      const response = await api.delete(`/suppliers/${id}/products/${productId}`);
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
