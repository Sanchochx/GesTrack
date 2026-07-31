import api from './api';

/**
 * Servicio de reportes programados
 * US-REP-013: Exportación Masiva de Reportes
 */
const scheduledReportService = {
  async getReportTypes() {
    try {
      const response = await api.get('/scheduled-reports/report-types');
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  async getSchedules() {
    try {
      const response = await api.get('/scheduled-reports');
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  async getSchedule(id) {
    try {
      const response = await api.get(`/scheduled-reports/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  async createSchedule(data) {
    try {
      const response = await api.post('/scheduled-reports', data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  async updateSchedule(id, data) {
    try {
      const response = await api.put(`/scheduled-reports/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  async toggleSchedule(id, isActive) {
    try {
      const response = await api.patch(`/scheduled-reports/${id}/toggle`, { is_active: isActive });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  async deleteSchedule(id) {
    try {
      const response = await api.delete(`/scheduled-reports/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  async runNow(id) {
    try {
      const response = await api.post(`/scheduled-reports/${id}/run-now`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },
};

export default scheduledReportService;
