import api from './api';

/**
 * Servicio de órdenes de compra
 * US-SUPP-005: Crear Orden de Compra
 * US-SUPP-006: Listar Órdenes de Compra
 * US-SUPP-007: Gestionar Estados de Orden de Compra
 * US-SUPP-008: Recibir Mercancía (Actualizar Inventario)
 * US-SUPP-010: Editar Orden de Compra
 */
const purchaseOrderService = {
  /**
   * Crea una nueva orden de compra
   * @param {Object} purchaseOrderData - Datos de la orden de compra
   * @returns {Promise} - Respuesta del servidor
   */
  async createPurchaseOrder(purchaseOrderData) {
    try {
      const response = await api.post('/purchase-orders', purchaseOrderData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Obtiene una orden de compra con sus items
   * @param {string} id - ID de la orden de compra
   * @returns {Promise} - Respuesta del servidor
   */
  async getPurchaseOrder(id) {
    try {
      const response = await api.get(`/purchase-orders/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Lista órdenes de compra paginadas y ordenadas
   * @param {Object} params - { page, per_page, sort_by, sort_order }
   * @returns {Promise} - Respuesta del servidor
   */
  async getPurchaseOrders(params = {}) {
    try {
      const response = await api.get('/purchase-orders', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Actualiza una orden de compra existente
   * @param {string} id - ID de la orden de compra
   * @param {Object} purchaseOrderData - Datos actualizados de la orden de compra
   * @returns {Promise} - Respuesta del servidor
   */
  async updatePurchaseOrder(id, purchaseOrderData) {
    try {
      const response = await api.put(`/purchase-orders/${id}`, purchaseOrderData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Actualiza el estado de una orden de compra
   * @param {string} id - ID de la orden de compra
   * @param {string} status - Nuevo estado
   * @param {string} notes - Notas opcionales del cambio
   * @returns {Promise} - Respuesta del servidor
   */
  async updateStatus(id, status, notes) {
    try {
      const response = await api.patch(`/purchase-orders/${id}/status`, { status, notes });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Cancela una orden de compra
   * @param {string} id - ID de la orden de compra
   * @param {string} reason - Motivo de la cancelación
   * @returns {Promise} - Respuesta del servidor
   */
  async cancelPurchaseOrder(id, reason) {
    try {
      const response = await api.post(`/purchase-orders/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Registra la recepción de mercancía de una orden de compra
   * @param {string} id - ID de la orden de compra
   * @param {Array} items - [{ item_id, quantity_received, discrepancy_reason, discrepancy_notes }]
   * @returns {Promise} - Respuesta del servidor
   */
  async receivePurchaseOrder(id, items) {
    try {
      const response = await api.post(`/purchase-orders/${id}/receive`, { items });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },
};

export default purchaseOrderService;
