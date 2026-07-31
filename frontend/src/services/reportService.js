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
};

export default reportService;
