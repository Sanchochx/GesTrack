import api from './api';

/**
 * Servicio de devoluciones de pedidos
 * US-ORD-011: Procesamiento de Devoluciones
 */
const returnService = {
  /**
   * Lista las devoluciones de un pedido y su elegibilidad para nuevas devoluciones
   * CA-1/CA-10
   * @param {string} orderId - ID del pedido
   * @returns {Promise} - { data: [...], eligibility: {...} }
   */
  async getOrderReturns(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}/returns`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Crea una devolución para un pedido
   * CA-2 a CA-6
   * @param {string} orderId - ID del pedido
   * @param {Object} returnData - { items, reason, reason_detail, notes }
   * @returns {Promise} - Devolución creada
   */
  async createReturn(orderId, returnData) {
    try {
      const response = await api.post(`/orders/${orderId}/returns`, returnData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Aprueba o rechaza una devolución
   * CA-7/CA-8/CA-9
   * @param {string} returnId - ID de la devolución
   * @param {Object} statusData - { status, refund_method, refund_reference }
   * @returns {Promise} - Devolución actualizada
   */
  async updateReturnStatus(returnId, statusData) {
    try {
      const response = await api.patch(`/returns/${returnId}/status`, statusData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Lista global de devoluciones con filtros y paginación
   * CA-11
   * @param {Object} params - { page, per_page, status, customer_id, date_from, date_to }
   * @returns {Promise} - { data, pagination }
   */
  async getReturns(params = {}) {
    try {
      const response = await api.get('/returns', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },
};

export default returnService;
