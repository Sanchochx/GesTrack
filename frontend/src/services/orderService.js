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
};

export default orderService;
