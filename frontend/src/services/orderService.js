import api from './api';

/**
 * Servicio de pedidos
 * US-ORD-001: Crear Pedido
 * US-ORD-003: Gestión de Estados del Pedido
 */
const orderService = {
  /**
   * Lista pedidos con paginación y filtros
   * CA-1/CA-2: Lista con estado y colores
   * @param {Object} params - { page, per_page, status, customer_id, search }
   * @returns {Promise} - { data, pagination }
   */
  async getOrders(params = {}) {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Obtiene un pedido por ID con items e historial
   * CA-3/CA-6: Detalle con historial
   * @param {string} orderId - ID del pedido
   * @returns {Promise} - Pedido completo
   */
  async getOrderById(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

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
   * @param {boolean} [forceDelivery] - Forzar entrega aunque haya saldo pendiente (solo Admin)
   * @returns {Promise} - Pedido actualizado
   */
  async updateOrderStatus(orderId, status, notes = null, forceDelivery = false) {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, {
        status,
        notes,
        force_delivery: forceDelivery,
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Registra un pago para un pedido
   * US-ORD-004 CA-2/CA-4
   * @param {string} orderId - ID del pedido
   * @param {Object} paymentData - { amount, payment_method, payment_date, notes }
   * @returns {Promise} - { data: order, message }
   */
  async registerPayment(orderId, paymentData) {
    try {
      const response = await api.post(`/orders/${orderId}/payments`, paymentData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error al registrar pago' } };
    }
  },
};

export default orderService;
