import api from './api';

/**
 * Servicio de reportes
 * US-REP-002: Reporte de Ventas Diarias
 */
const reportService = {
  /**
   * US-REP-002: Obtiene el reporte de ventas de un día
   * @param {Object} params - { date, status }
   * @returns {Promise} - Respuesta del servidor
   */
  async getDailySalesReport(params = {}) {
    try {
      const response = await api.get('/reports/sales-daily', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-002 CA-6: Exporta el reporte de ventas diarias
   * @param {Object} filters - { date, status }
   * @param {string} format - 'csv' o 'excel'
   */
  async exportDailySalesReport(filters = {}, format = 'csv') {
    try {
      const response = await api.get('/reports/sales-daily/export', {
        params: { ...filters, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      let filename = `ventas_diarias_${filters.date || 'hoy'}.${extension}`;
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
   * US-REP-003: Obtiene el reporte de ventas de un período
   * @param {Object} params - { period, start_date, end_date, group_by, status }
   * @returns {Promise} - Respuesta del servidor
   */
  async getSalesByPeriodReport(params = {}) {
    try {
      const response = await api.get('/reports/sales-period', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-003 CA-7: Exporta el reporte de ventas por período
   * @param {Object} filters - { period, start_date, end_date, group_by, status }
   * @param {string} format - 'csv' o 'excel'
   */
  async exportSalesByPeriodReport(filters = {}, format = 'csv') {
    try {
      const response = await api.get('/reports/sales-period/export', {
        params: { ...filters, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      let filename = `ventas_periodo_${filters.start_date || 'inicio'}_a_${filters.end_date || 'fin'}.${extension}`;
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
   * US-REP-004: Obtiene el reporte de productos más vendidos
   * @param {Object} params - { period, start_date, end_date, category_id, sort_by, status }
   * @returns {Promise} - Respuesta del servidor
   */
  async getTopSellingProductsReport(params = {}) {
    try {
      const response = await api.get('/reports/top-products', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-004 CA-8: Exporta el reporte de productos más vendidos
   * @param {Object} filters - { period, start_date, end_date, category_id, sort_by, status }
   * @param {string} format - 'csv' o 'excel'
   */
  async exportTopSellingProductsReport(filters = {}, format = 'csv') {
    try {
      const response = await api.get('/reports/top-products/export', {
        params: { ...filters, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      let filename = `productos_mas_vendidos.${extension}`;
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
   * US-REP-005: Obtiene el análisis de márgenes de ganancia por producto
   * @param {Object} params - { period, start_date, end_date, category_id, sort_by }
   * @returns {Promise} - Respuesta del servidor
   */
  async getProfitMarginReport(params = {}) {
    try {
      const response = await api.get('/reports/profit-margin', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-005 CA-9: Exporta el análisis de márgenes de ganancia a Excel
   * @param {Object} filters - { period, start_date, end_date, category_id, sort_by }
   */
  async exportProfitMarginReport(filters = {}) {
    try {
      const response = await api.get('/reports/profit-margin/export', {
        params: filters,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'analisis_margenes_ganancia.xlsx';
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
   * US-REP-006: Obtiene el reporte del estado actual del inventario
   * @param {Object} params - { category_id, stock_status, sort_by }
   * @returns {Promise} - Respuesta del servidor
   */
  async getCurrentInventoryReport(params = {}) {
    try {
      const response = await api.get('/reports/inventory', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-006 CA-7: Exporta el reporte de inventario actual
   * @param {Object} filters - { category_id, stock_status, sort_by }
   * @param {string} format - 'csv' o 'excel'
   */
  async exportCurrentInventoryReport(filters = {}, format = 'csv') {
    try {
      const response = await api.get('/reports/inventory/export', {
        params: { ...filters, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      let filename = `reporte_inventario.${extension}`;
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
   * US-REP-007: Obtiene el reporte de movimientos de inventario en un período
   * @param {Object} params - { start_date, end_date, product_id, movement_type, user_id, category_id }
   * @returns {Promise} - Respuesta del servidor
   */
  async getInventoryMovementsReport(params = {}) {
    try {
      const response = await api.get('/reports/inventory-movements', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-007 CA-7: Exporta el reporte de movimientos de inventario
   * @param {Object} filters - { start_date, end_date, product_id, movement_type, user_id, category_id }
   * @param {string} format - 'csv' o 'excel'
   */
  async exportInventoryMovementsReport(filters = {}, format = 'csv') {
    try {
      const response = await api.get('/reports/inventory-movements/export', {
        params: { ...filters, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      let filename = `movimientos_inventario.${extension}`;
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
   * US-REP-008: Obtiene el reporte de productos con stock bajo
   * @returns {Promise} - Respuesta del servidor
   */
  async getLowStockReport() {
    try {
      const response = await api.get('/reports/low-stock');
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-008 CA-7: Exporta el reporte de productos con stock bajo
   * @param {string} format - 'csv' o 'excel'
   */
  async exportLowStockReport(format = 'csv') {
    try {
      const response = await api.get('/reports/low-stock/export', {
        params: { format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      let filename = `productos_stock_bajo.${extension}`;
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
   * US-REP-009: Obtiene el reporte de desempeño de ventas por vendedor
   * @param {Object} params - { period, start_date, end_date }
   * @returns {Promise} - Respuesta del servidor
   */
  async getSalesBySellerReport(params = {}) {
    try {
      const response = await api.get('/reports/sales-by-seller', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-009 CA-8: Exporta el reporte de desempeño de ventas por vendedor
   * @param {Object} filters - { period, start_date, end_date }
   */
  async exportSalesBySellerReport(filters = {}) {
    try {
      const response = await api.get('/reports/sales-by-seller/export', {
        params: { ...filters, format: 'excel' },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'desempeno_ventas_vendedores.xlsx';
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
   * US-REP-010: Obtiene el reporte de la base de clientes
   * @param {Object} params - { period, start_date, end_date, at_risk_days }
   * @returns {Promise} - Respuesta del servidor
   */
  async getCustomerReport(params = {}) {
    try {
      const response = await api.get('/reports/customers', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-010 CA-8: Exporta el reporte de clientes
   * @param {Object} filters - { period, start_date, end_date, at_risk_days }
   * @param {string} format - 'csv' o 'excel'
   */
  async exportCustomerReport(filters = {}, format = 'csv') {
    try {
      const response = await api.get('/reports/customers/export', {
        params: { ...filters, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      let filename = `reporte_clientes.${extension}`;
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
   * US-REP-011: Obtiene el análisis de tendencias de ventas (últimos 12 meses)
   * @returns {Promise} - Respuesta del servidor
   */
  async getSalesTrendsReport() {
    try {
      const response = await api.get('/reports/sales-trends');
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-011 CA-8: Exporta el análisis de tendencias de ventas a PDF
   */
  async exportSalesTrendsReport() {
    try {
      const response = await api.get('/reports/sales-trends/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'tendencias_ventas.pdf';
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
   * US-REP-012: Obtiene el reporte de órdenes de compra a proveedores
   * @param {Object} params - { start_date, end_date, supplier_id, status }
   * @returns {Promise} - Respuesta del servidor
   */
  async getPurchaseOrdersReport(params = {}) {
    try {
      const response = await api.get('/reports/purchase-orders', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-012 CA-8: Exporta el reporte de órdenes de compra a proveedores
   * @param {Object} filters - { start_date, end_date, supplier_id, status }
   * @param {string} format - 'csv' o 'excel'
   */
  async exportPurchaseOrdersReport(filters = {}, format = 'csv') {
    try {
      const response = await api.get('/reports/purchase-orders/export', {
        params: { ...filters, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      let filename = `ordenes_compra.${extension}`;
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
   * US-REP-015: Obtiene el reporte de devoluciones
   * @param {Object} params - { start_date, end_date, status }
   * @returns {Promise} - Respuesta del servidor
   */
  async getReturnsReport(params = {}) {
    try {
      const response = await api.get('/reports/returns', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-REP-015 CA-8: Exporta el reporte de devoluciones
   * @param {Object} filters - { start_date, end_date, status }
   * @param {string} format - 'csv' o 'excel'
   */
  async exportReturnsReport(filters = {}, format = 'csv') {
    try {
      const response = await api.get('/reports/returns/export', {
        params: { ...filters, format },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      let filename = `devoluciones.${extension}`;
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
};

export default reportService;
