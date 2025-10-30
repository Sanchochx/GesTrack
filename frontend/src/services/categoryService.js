import api from './api';

/**
 * Servicio de categorías
 * Maneja las llamadas al API para gestión de categorías
 * US-PROD-007: Manage Categories
 */
const categoryService = {
  /**
   * Obtiene la lista de todas las categorías
   * US-PROD-007 - CA-1: List all categories with product count
   * @param {Object} params - Parámetros opcionales (search, etc.)
   * @returns {Promise} - Promesa con la lista de categorías
   */
  async getCategories(params = {}) {
    try {
      const response = await api.get('/categories', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Obtiene una categoría por ID
   * US-PROD-007 - CA-3: Get category details for editing
   * @param {string} categoryId - ID de la categoría
   * @returns {Promise} - Promesa con los datos de la categoría
   */
  async getCategory(categoryId) {
    try {
      const response = await api.get(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Crea una nueva categoría
   * US-PROD-007 - CA-2: Create new category with color and icon
   * @param {Object} categoryData - Datos de la categoría
   * @param {string} categoryData.name - Nombre de la categoría (obligatorio)
   * @param {string} categoryData.description - Descripción (opcional)
   * @param {string} categoryData.color - Color en formato hex (opcional)
   * @param {string} categoryData.icon - Nombre del ícono (opcional)
   * @param {boolean} categoryData.is_default - Si es categoría por defecto (opcional)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async createCategory(categoryData) {
    try {
      const response = await api.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Actualiza una categoría existente
   * US-PROD-007 - CA-3: Edit category information
   * @param {string} categoryId - ID de la categoría
   * @param {Object} categoryData - Datos actualizados de la categoría
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await api.put(`/categories/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Elimina una categoría
   * US-PROD-007 - CA-4: Delete category with validation
   * @param {string} categoryId - ID de la categoría
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async deleteCategory(categoryId) {
    try {
      const response = await api.delete(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },
};

export default categoryService;
