/**
 * Servicio de API para gestión de inventario
 * US-INV-002: Ajustes Manuales de Inventario
 * US-INV-003: Historial de Movimientos de Stock
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
  },

  // ==========================================
  // US-INV-003: Historial de Movimientos
  // ==========================================

  /**
   * Obtiene movimientos de inventario con filtros y paginación (CA-1, CA-3)
   *
   * @param {Object} filters
   * @param {string} filters.date_from - Fecha inicial (ISO format)
   * @param {string} filters.date_to - Fecha final (ISO format)
   * @param {string|Array} filters.movement_type - Tipo(s) de movimiento
   * @param {string} filters.product_id - ID del producto
   * @param {string} filters.user_id - ID del usuario
   * @param {string} filters.category_id - ID de categoría
   * @param {number} filters.page - Número de página (default: 1)
   * @param {number} filters.per_page - Registros por página (default: 50)
   */
  getMovements: async (filters = {}) => {
    try {
      // Si movement_type es array, convertir a string separado por comas
      const params = { ...filters };
      if (Array.isArray(params.movement_type)) {
        params.movement_type = params.movement_type.join(',');
      }

      const response = await api.get('/inventory/movements', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching movements:', error);
      throw error.response?.data || { error: { message: 'Error al obtener movimientos' } };
    }
  },

  /**
   * Obtiene movimientos de un producto específico (CA-4)
   *
   * @param {string} productId - ID del producto
   * @param {Object} pagination
   * @param {number} pagination.page - Número de página
   * @param {number} pagination.per_page - Registros por página
   */
  getMovementsByProduct: async (productId, pagination = {}) => {
    try {
      const response = await api.get(`/inventory/movements/product/${productId}`, { params: pagination });
      return response.data;
    } catch (error) {
      console.error('Error fetching product movements:', error);
      throw error.response?.data || { error: { message: 'Error al obtener movimientos del producto' } };
    }
  },

  /**
   * Obtiene detalles completos de un movimiento (CA-5)
   *
   * @param {string} movementId - ID del movimiento
   */
  getMovementDetails: async (movementId) => {
    try {
      const response = await api.get(`/inventory/movements/${movementId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching movement details:', error);
      throw error.response?.data || { error: { message: 'Error al obtener detalles del movimiento' } };
    }
  },

  /**
   * Obtiene la evolución del stock de un producto para graficar (CA-4)
   *
   * @param {string} productId - ID del producto
   * @param {Object} params
   * @param {string} params.date_from - Fecha inicial
   * @param {string} params.date_to - Fecha final
   * @param {number} params.limit - Máximo de puntos
   */
  getStockEvolution: async (productId, params = {}) => {
    try {
      const response = await api.get(`/inventory/movements/stock-evolution/${productId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stock evolution:', error);
      throw error.response?.data || { error: { message: 'Error al obtener evolución de stock' } };
    }
  },

  /**
   * Exporta movimientos a CSV o Excel (CA-6)
   *
   * @param {Object} filters - Mismos filtros que getMovements
   * @param {string} format - 'csv' o 'excel'
   */
  exportMovements: async (filters = {}, format = 'csv') => {
    try {
      // Si movement_type es array, convertir a string
      const params = { ...filters, format };
      if (Array.isArray(params.movement_type)) {
        params.movement_type = params.movement_type.join(',');
      }

      const response = await api.get('/inventory/movements/export', {
        params,
        responseType: 'blob' // Importante para descargar archivos
      });

      // Crear URL y descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Obtener nombre de archivo del header Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      let filename = `historial_inventario_${new Date().toISOString().split('T')[0]}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Archivo descargado exitosamente' };
    } catch (error) {
      console.error('Error exporting movements:', error);
      throw error.response?.data || { error: { message: 'Error al exportar movimientos' } };
    }
  },

  /**
   * Obtiene estadísticas de movimientos
   *
   * @param {Object} params
   * @param {string} params.date_from - Fecha inicial
   * @param {string} params.date_to - Fecha final
   */
  getMovementStatistics: async (params = {}) => {
    try {
      const response = await api.get('/inventory/movements/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching movement statistics:', error);
      throw error.response?.data || { error: { message: 'Error al obtener estadísticas' } };
    }
  },

  /**
   * Obtiene los movimientos más recientes
   *
   * @param {number} limit - Número de movimientos (max 50)
   */
  getRecentMovements: async (limit = 10) => {
    try {
      const response = await api.get('/inventory/movements/recent', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent movements:', error);
      throw error.response?.data || { error: { message: 'Error al obtener movimientos recientes' } };
    }
  }
};

export default inventoryService;
