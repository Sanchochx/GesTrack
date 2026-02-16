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
  },

  // ===================================================================
  // US-INV-004: Configuración de Puntos de Reorden
  // ===================================================================

  /**
   * US-INV-004 CA-5: Obtiene sugerencia inteligente de punto de reorden
   *
   * @param {string} productId - ID del producto
   * @param {number} leadTimeDays - Días de reabastecimiento (default: 7)
   * @param {number} safetyStockDays - Días de stock de seguridad (default: 3)
   */
  getReorderPointSuggestion: async (productId, leadTimeDays = 7, safetyStockDays = 3) => {
    try {
      const response = await api.get(`/inventory/reorder-point/suggest/${productId}`, {
        params: { lead_time_days: leadTimeDays, safety_stock_days: safetyStockDays }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching reorder point suggestion:', error);
      throw error.response?.data || { error: { message: 'Error al obtener sugerencia' } };
    }
  },

  /**
   * US-INV-004 CA-4: Actualiza puntos de reorden masivamente por categoría
   *
   * @param {string} categoryId - ID de la categoría
   * @param {number} reorderPoint - Nuevo punto de reorden
   * @param {boolean} overwriteExisting - Sobrescribir existentes (default: true)
   */
  bulkUpdateReorderPoints: async (categoryId, reorderPoint, overwriteExisting = true) => {
    try {
      const response = await api.post('/inventory/reorder-point/bulk-update', {
        category_id: categoryId,
        reorder_point: reorderPoint,
        overwrite_existing: overwriteExisting
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating reorder points:', error);
      throw error.response?.data || { error: { message: 'Error al actualizar puntos de reorden' } };
    }
  },

  /**
   * US-INV-004 CA-4: Obtiene preview de productos de una categoría
   *
   * @param {string} categoryId - ID de la categoría
   */
  getReorderPointPreview: async (categoryId) => {
    try {
      const response = await api.get(`/inventory/reorder-point/preview/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reorder point preview:', error);
      throw error.response?.data || { error: { message: 'Error al obtener preview' } };
    }
  },

  /**
   * US-INV-004 CA-6: Valida un punto de reorden
   *
   * @param {number} reorderPoint - Punto de reorden a validar
   * @param {number} stockQuantity - Stock actual (opcional)
   */
  validateReorderPoint: async (reorderPoint, stockQuantity = null) => {
    try {
      const response = await api.post('/inventory/reorder-point/validate', {
        reorder_point: reorderPoint,
        stock_quantity: stockQuantity
      });
      return response.data;
    } catch (error) {
      console.error('Error validating reorder point:', error);
      throw error.response?.data || { error: { message: 'Error al validar' } };
    }
  },

  /**
   * US-INV-004 CA-3, CA-7: Obtiene productos en o debajo del punto de reorden
   */
  getProductsBelowReorderPoint: async () => {
    try {
      const response = await api.get('/inventory/reorder-point/products-below');
      return response.data;
    } catch (error) {
      console.error('Error fetching products below reorder point:', error);
      throw error.response?.data || { error: { message: 'Error al obtener productos' } };
    }
  },

  // ===================================================================
  // US-INV-005: Valor Total del Inventario
  // ===================================================================

  /**
   * US-INV-005 CA-1: Obtiene el valor total del inventario
   */
  getTotalInventoryValue: async () => {
    try {
      const response = await api.get('/inventory/value/total');
      return response.data;
    } catch (error) {
      console.error('Error fetching total inventory value:', error);
      throw error.response?.data || { error: { message: 'Error al obtener valor del inventario' } };
    }
  },

  /**
   * US-INV-005 CA-3: Obtiene desglose del valor por categoría
   */
  getValueByCategory: async () => {
    try {
      const response = await api.get('/inventory/value/by-category');
      return response.data;
    } catch (error) {
      console.error('Error fetching value by category:', error);
      throw error.response?.data || { error: { message: 'Error al obtener desglose por categoría' } };
    }
  },

  /**
   * US-INV-005 CA-4: Obtiene evolución temporal del valor
   *
   * @param {string} period - '7d', '30d', '3m', '1y', 'custom'
   * @param {string} dateFrom - Fecha inicial (para period='custom')
   * @param {string} dateTo - Fecha final (para period='custom')
   */
  getValueEvolution: async (period = '7d', dateFrom = null, dateTo = null) => {
    try {
      const params = { period };
      if (period === 'custom' && dateFrom && dateTo) {
        params.date_from = dateFrom;
        params.date_to = dateTo;
      }
      const response = await api.get('/inventory/value/evolution', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching value evolution:', error);
      throw error.response?.data || { error: { message: 'Error al obtener evolución de valor' } };
    }
  },

  /**
   * US-INV-005 CA-5: Obtiene métricas adicionales del inventario
   */
  getInventoryMetrics: async () => {
    try {
      const response = await api.get('/inventory/value/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory metrics:', error);
      throw error.response?.data || { error: { message: 'Error al obtener métricas' } };
    }
  },

  /**
   * US-INV-005 CA-5: Obtiene top productos por valor
   *
   * @param {number} limit - Número de productos (default: 10, max: 50)
   */
  getTopProductsByValue: async (limit = 10) => {
    try {
      const response = await api.get('/inventory/value/top-products', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching top products by value:', error);
      throw error.response?.data || { error: { message: 'Error al obtener top productos' } };
    }
  },

  /**
   * US-INV-005 CA-2: Obtiene cambio de valor vs período anterior
   *
   * @param {string} period - '7d', '30d', '3m', '1y'
   */
  getValueChange: async (period = '7d') => {
    try {
      const response = await api.get('/inventory/value/change', { params: { period } });
      return response.data;
    } catch (error) {
      console.error('Error fetching value change:', error);
      throw error.response?.data || { error: { message: 'Error al calcular cambio de valor' } };
    }
  },

  /**
   * US-INV-005 CA-4: Crea snapshot manual del valor del inventario
   *
   * @param {string} triggerReason - Razón del snapshot (default: 'manual')
   */
  createValueSnapshot: async (triggerReason = 'manual') => {
    try {
      const response = await api.post('/inventory/value/snapshot', { trigger_reason: triggerReason });
      return response.data;
    } catch (error) {
      console.error('Error creating value snapshot:', error);
      throw error.response?.data || { error: { message: 'Error al crear snapshot' } };
    }
  },

  /**
   * US-INV-005 CA-7: Exporta reporte de valor del inventario
   *
   * @param {string} format - 'excel' o 'pdf' (default: 'excel')
   * @param {string} period - '7d', '30d', '3m', '1y' (default: '30d')
   */
  exportValueReport: async (format = 'excel', period = '30d') => {
    try {
      const response = await api.get('/inventory/value/export', {
        params: { format, period },
        responseType: 'blob' // Importante para descargar archivos
      });

      // Crear URL y descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Obtener nombre de archivo del header Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      let filename = `reporte_valor_inventario_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
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

      return { success: true, message: 'Reporte descargado exitosamente' };
    } catch (error) {
      console.error('Error exporting value report:', error);
      throw error.response?.data || { error: { message: 'Error al exportar reporte' } };
    }
  },

  // ============================================================================
  // US-INV-006: Vista de Inventario por Categoría
  // ============================================================================

  /**
   * US-INV-006 CA-1, CA-4: Obtiene lista de categorías con estadísticas de inventario
   *
   * @param {Object} filters - Filtros opcionales
   * @param {string} filters.search - Búsqueda por nombre de categoría
   * @param {string} filters.sortBy - Campo de ordenamiento (name, value, products, low_stock)
   * @param {string} filters.sortOrder - Orden (asc, desc)
   * @param {boolean} filters.hasLowStock - Solo categorías con stock bajo
   * @param {boolean} filters.hasOutOfStock - Solo categorías sin stock
   * @returns {Promise} Categorías con estadísticas
   */
  getCategoriesInventory: async (filters = {}) => {
    try {
      const params = {};

      if (filters.search) params.search = filters.search;
      if (filters.sortBy) params.sort_by = filters.sortBy;
      if (filters.sortOrder) params.sort_order = filters.sortOrder;
      if (filters.hasLowStock) params.has_low_stock = 'true';
      if (filters.hasOutOfStock) params.has_out_of_stock = 'true';

      const response = await api.get('/inventory/by-category', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching categories inventory:', error);
      throw error.response?.data || { error: { message: 'Error al obtener inventario por categoría' } };
    }
  },

  /**
   * US-INV-006 CA-3: Obtiene productos de una categoría específica
   *
   * @param {string} categoryId - ID de la categoría
   * @returns {Promise} Lista de productos con detalles de inventario
   */
  getCategoryProducts: async (categoryId) => {
    try {
      const response = await api.get(`/inventory/by-category/${categoryId}/products`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category products:', error);
      throw error.response?.data || { error: { message: 'Error al obtener productos de la categoría' } };
    }
  },

  /**
   * US-INV-006 CA-6: Obtiene métricas generales del inventario por categorías
   *
   * @returns {Promise} Métricas generales
   */
  getCategoryInventoryMetrics: async () => {
    try {
      const response = await api.get('/inventory/by-category/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching category inventory metrics:', error);
      throw error.response?.data || { error: { message: 'Error al obtener métricas' } };
    }
  },

  /**
   * US-INV-006 CA-7: Exporta productos de una categoría a Excel
   *
   * @param {string} categoryId - ID de la categoría
   * @param {string} format - Formato de exportación (excel, csv) - default: excel
   * @returns {Promise} Archivo descargado
   */
  exportCategoryProducts: async (categoryId, format = 'excel') => {
    try {
      const response = await api.get(`/inventory/by-category/${categoryId}/export`, {
        params: { format },
        responseType: 'blob'
      });

      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Obtener nombre de archivo del header Content-Disposition o generar uno
      const contentDisposition = response.headers['content-disposition'];
      let filename = `categoria_${categoryId}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

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

      return { success: true, message: 'Categoría exportada exitosamente' };
    } catch (error) {
      console.error('Error exporting category products:', error);
      throw error.response?.data || { error: { message: 'Error al exportar categoría' } };
    }
  },

  // ============================================================================
  // US-INV-007: Alerta de Stock Crítico
  // ============================================================================

  /**
   * US-INV-007 CA-4: Obtiene lista de productos sin stock
   *
   * @param {Object} params - Parámetros de paginación y ordenamiento
   * @param {number} params.page - Número de página (default: 1)
   * @param {number} params.per_page - Productos por página (default: 20)
   * @param {string} params.sort_by - Campo de ordenamiento (created_at, product_name, category, sku)
   * @param {string} params.sort_order - Orden (asc, desc)
   * @returns {Promise} Lista paginada de productos sin stock
   */
  getOutOfStockProducts: async (params = {}) => {
    try {
      const response = await api.get('/inventory/out-of-stock', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching out of stock products:', error);
      throw error.response?.data || { error: { message: 'Error al obtener productos sin stock' } };
    }
  },

  /**
   * US-INV-007 CA-2: Obtiene el conteo de productos sin stock
   *
   * @returns {Promise} Objeto con count de productos sin stock
   */
  getOutOfStockCount: async () => {
    try {
      const response = await api.get('/inventory/out-of-stock/count');
      return response.data;
    } catch (error) {
      console.error('Error fetching out of stock count:', error);
      throw error.response?.data || { error: { message: 'Error al obtener conteo de productos sin stock' } };
    }
  },

  /**
   * US-INV-007 CA-8: Obtiene estadísticas de alertas de stock crítico
   *
   * @returns {Promise} Estadísticas de alertas (activas, resueltas, tiempo promedio)
   */
  getCriticalAlertStatistics: async () => {
    try {
      const response = await api.get('/inventory/critical-alerts/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching critical alert statistics:', error);
      throw error.response?.data || { error: { message: 'Error al obtener estadísticas de alertas' } };
    }
  },

  /**
   * US-INV-007 CA-8: Obtiene historial de alertas de stock crítico
   *
   * @param {Object} params - Parámetros de paginación
   * @param {number} params.page - Número de página (default: 1)
   * @param {number} params.per_page - Alertas por página (default: 20)
   * @param {boolean} params.include_resolved - Incluir alertas resueltas (default: true)
   * @returns {Promise} Historial paginado de alertas
   */
  getCriticalAlertsHistory: async (params = {}) => {
    try {
      const response = await api.get('/inventory/critical-alerts/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching critical alerts history:', error);
      throw error.response?.data || { error: { message: 'Error al obtener historial de alertas' } };
    }
  },

  // ============================================================================
  // US-INV-009: Exportar Datos de Inventario
  // ============================================================================

  /**
   * US-INV-009: Exporta datos completos del inventario a CSV o Excel
   *
   * @param {Object} options - Opciones de exportación
   * @param {string} options.format - 'csv' o 'excel' (default: 'excel')
   * @param {string} options.stockFilter - 'all', 'in_stock', 'active' (default: 'all')
   * @param {string} options.categoryId - ID de categoría (opcional)
   * @param {string} options.search - Búsqueda por nombre/SKU (opcional)
   * @returns {Promise} Resultado de la descarga
   */
  exportInventoryData: async (options = {}) => {
    try {
      const params = {
        format: options.format || 'excel',
        stock_filter: options.stockFilter || 'all'
      };

      if (options.categoryId) params.category_id = options.categoryId;
      if (options.search) params.search = options.search;

      const response = await api.get('/inventory/export', {
        params,
        responseType: 'blob'
      });

      // Crear URL y descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Obtener nombre de archivo del header Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      const ext = params.format === 'csv' ? 'csv' : 'xlsx';
      let filename = `inventario_${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}.${ext}`;
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

      return { success: true, message: 'Inventario exportado exitosamente' };
    } catch (error) {
      console.error('Error exporting inventory data:', error);
      throw error.response?.data || { error: { message: 'Error al exportar inventario' } };
    }
  },

  /**
   * US-INV-007: Sincroniza alertas para productos existentes sin stock
   *
   * @returns {Promise} Número de alertas creadas
   */
  syncOutOfStockAlerts: async () => {
    try {
      const response = await api.post('/inventory/critical-alerts/sync');
      return response.data;
    } catch (error) {
      console.error('Error syncing out of stock alerts:', error);
      throw error.response?.data || { error: { message: 'Error al sincronizar alertas' } };
    }
  },

  // ==========================================
  // US-INV-010: Dashboard de Inventario
  // ==========================================

  /**
   * US-INV-010 CA-1: Obtiene KPIs principales del dashboard
   */
  getDashboardKPIs: async () => {
    try {
      const response = await api.get('/inventory/dashboard/kpis');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error);
      throw error.response?.data || { error: { message: 'Error al obtener KPIs' } };
    }
  },

  /**
   * US-INV-010 CA-3: Obtiene top productos con menor stock
   */
  getDashboardLowStockProducts: async (limit = 10) => {
    try {
      const response = await api.get('/inventory/dashboard/low-stock-products', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error.response?.data || { error: { message: 'Error al obtener productos con bajo stock' } };
    }
  },

  /**
   * US-INV-010 CA-7: Obtiene estadísticas adicionales
   */
  getDashboardAdditionalStats: async (days = 30) => {
    try {
      const response = await api.get('/inventory/dashboard/additional-stats', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching additional stats:', error);
      throw error.response?.data || { error: { message: 'Error al obtener estadísticas' } };
    }
  }
};

export default inventoryService;
