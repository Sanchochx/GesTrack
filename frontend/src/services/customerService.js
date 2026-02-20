import api from './api';

/**
 * Servicio de clientes - Facturación Electrónica Colombia (DIAN)
 * US-CUST-001: Registrar Nuevo Cliente
 */
const customerService = {
  /**
   * Crea un nuevo cliente
   * @param {Object} customerData - Datos del cliente
   * @returns {Promise} - Respuesta del servidor
   */
  async createCustomer(customerData) {
    try {
      const response = await api.post('/customers', customerData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Verifica si un número de documento ya está registrado
   * @param {string} numeroDocumento - Número a verificar
   * @param {string} excludeId - ID de cliente a excluir (para edición)
   * @returns {Promise} - { available: boolean, existing_customer?: {...} }
   */
  async checkDocumento(numeroDocumento, excludeId = null) {
    try {
      const params = { numero_documento: numeroDocumento };
      if (excludeId) params.exclude_id = excludeId;
      const response = await api.get('/customers/check-documento', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Verifica si un correo ya está registrado
   * @param {string} correo - Correo a verificar
   * @param {string} excludeId - ID de cliente a excluir (para edición)
   * @returns {Promise} - { available: boolean, existing_customer?: {...} }
   */
  async checkCorreo(correo, excludeId = null) {
    try {
      const params = { correo };
      if (excludeId) params.exclude_id = excludeId;
      const response = await api.get('/customers/check-correo', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Obtiene la lista de clientes con filtros opcionales
   * @param {Object} filters - Filtros (search, page, limit, is_active, sort_by, order)
   * @returns {Promise} - Lista de clientes con paginación
   */
  async getCustomers(filters = {}) {
    try {
      const response = await api.get('/customers', { params: filters });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-CUST-002 CA-8: Activar/Inactivar cliente
   * @param {string} customerId - ID del cliente
   * @returns {Promise} - Respuesta del servidor
   */
  async toggleActive(customerId) {
    try {
      const response = await api.patch(`/customers/${customerId}/toggle-active`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Obtiene un cliente por ID
   * @param {string} customerId - ID del cliente
   * @returns {Promise} - Datos del cliente
   */
  async getCustomer(customerId) {
    try {
      const response = await api.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-CUST-005: Actualizar información del cliente
   * @param {string} customerId - ID del cliente
   * @param {Object} customerData - Datos actualizados del cliente
   * @returns {Promise} - Respuesta del servidor
   */
  async updateCustomer(customerId, customerData) {
    try {
      const response = await api.put(`/customers/${customerId}`, customerData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-CUST-006 CA-9: Verificar si un cliente puede ser eliminado
   * @param {string} customerId - ID del cliente
   * @returns {Promise} - { can_delete: boolean, reason: string, orders_count: number }
   */
  async canDeleteCustomer(customerId) {
    try {
      const response = await api.get(`/customers/${customerId}/can-delete`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-CUST-006: Eliminar cliente permanentemente
   * @param {string} customerId - ID del cliente
   * @param {string} reason - Razón opcional de eliminación
   * @returns {Promise} - Respuesta del servidor
   */
  async deleteCustomer(customerId, reason = null) {
    try {
      const response = await api.delete(`/customers/${customerId}`, {
        data: reason ? { reason } : undefined,
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
   * US-CUST-007: Obtener historial de compras del cliente
   * @param {string} customerId - ID del cliente
   * @param {Object} filters - { page, limit, date_from, date_to, status, payment_status }
   * @returns {Promise} - Historial con orders, metrics, top_products, chart_data
   */
  async getOrdersHistory(customerId, filters = {}) {
    try {
      const response = await api.get(`/customers/${customerId}/orders-history`, { params: filters });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * US-CUST-007 CA-10: Exportar historial de compras del cliente
   * @param {string} customerId - ID del cliente
   * @param {Object} params - { format: 'csv'|'excel', date_from, date_to, status, payment_status }
   * @param {string} customerName - Nombre del cliente para el archivo
   * @returns {Promise} - Descarga del archivo
   */
  async exportOrdersHistory(customerId, params = {}, customerName = 'cliente') {
    try {
      const response = await api.get(`/customers/${customerId}/orders-history/export`, {
        params,
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      const ext = params.format === 'excel' ? 'xlsx' : 'csv';
      const date = new Date().toISOString().slice(0, 10);
      let filename = `Historial_${customerName}_${date}.${ext}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=([^;]+)/);
        if (match) filename = match[1].trim();
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error al exportar historial' } };
    }
  },
};

export default customerService;
