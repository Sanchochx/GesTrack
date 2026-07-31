import api from './api';

/**
 * Servicio de preferencias de dashboard personalizable
 * US-REP-014: Dashboard Personalizable
 */
const dashboardPreferenceService = {
  async getWidgetCatalog() {
    try {
      const response = await api.get('/dashboard/preferences/widget-catalog');
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  async getPreferences() {
    try {
      const response = await api.get('/dashboard/preferences');
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  async savePreferences(widgets) {
    try {
      const response = await api.put('/dashboard/preferences', { widgets });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  async resetPreferences() {
    try {
      const response = await api.post('/dashboard/preferences/reset');
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },
};

export default dashboardPreferenceService;
