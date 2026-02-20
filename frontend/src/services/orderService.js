import api from './api';

/**
 * Servicio de pedidos
 * US-ORD-001: Crear Pedido
 */
const orderService = {
  /**
   * Crea un nuevo pedido
   * CA-8: Guardado y confirmación
   * @param {Object} orderData - Datos del pedido
   * @returns {Promise} - Respuesta del servidor
   */
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Valida disponibilidad de stock para una lista de items
   * CA-3: Validación de stock en tiempo real
   * @param {Array} items - Lista de {product_id, quantity}
   * @returns {Promise} - { available: bool, items: [...] }
   */
  async validateStock(items) {
    try {
      const response = await api.post('/orders/validate-stock', { items });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Cancela un pedido en estado Pendiente y restaura el stock
   * US-INV-008 CA-3
   * @param {string} orderId - ID del pedido
   * @param {string} [notes] - Motivo de cancelación
   * @returns {Promise} - Pedido cancelado
   */
  async cancelOrder(orderId, notes = null) {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, { notes });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Actualiza el estado de un pedido
   * US-INV-008 CA-4
   * @param {string} orderId - ID del pedido
   * @param {string} status - Nuevo estado
   * @param {string} [notes] - Notas del cambio
   * @returns {Promise} - Pedido actualizado
   */
  async updateOrderStatus(orderId, status, notes = null) {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status, notes });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },
};

export default orderService;
