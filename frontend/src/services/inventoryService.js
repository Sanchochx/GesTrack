/**
 * Servicio de API para gestión de inventario
 * US-INV-002: Ajustes Manuales de Inventario
 */
import api from './api';

const inventoryService = {
  /**
   * Obtiene las razones predefinidas para ajustes (CA-2)
   */
  getAdjustmentReasons: async () => {
    try {
      const response = await api.get('/inventory/adjustment-reasons');
      return response.data;
    } catch (error) {
      console.error('Error fetching adjustment reasons:', error);
      throw error.response?.data || { error: { message: 'Error al obtener razones de ajuste' } };
    }
  },

  /**
   * Crea un ajuste manual de inventario (CA-1, CA-3, CA-4, CA-5)
   *
   * @param {Object} adjustmentData
   * @param {string} adjustmentData.product_id - ID del producto
   * @param {string} adjustmentData.adjustment_type - 'increase' o 'decrease'
   * @param {number} adjustmentData.quantity - Cantidad del ajuste
   * @param {string} adjustmentData.reason - Motivo del ajuste
   * @param {boolean} adjustmentData.confirmed - Si ya fue confirmado
   */
  createAdjustment: async (adjustmentData) => {
    try {
      const response = await api.post('/inventory/adjustments', adjustmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating adjustment:', error);
      throw error.response?.data || { error: { message: 'Error al crear ajuste' } };
    }
  },

  /**
   * Obtiene el historial de ajustes manuales
   *
   * @param {Object} params
   * @param {string} params.product_id - Filtrar por producto
   * @param {string} params.user_id - Filtrar por usuario
   * @param {number} params.limit - Límite de resultados
   */
  getAdjustmentHistory: async (params = {}) => {
    try {
      const response = await api.get('/inventory/adjustments/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching adjustment history:', error);
      throw error.response?.data || { error: { message: 'Error al obtener historial' } };
    }
  }
};

export default inventoryService;
