import api from './api';

/**
 * Servicio de productos
 * Maneja las llamadas al API para gestión de productos
 * US-PROD-001: Create Product
 */
const productService = {
  /**
   * Crea un nuevo producto
   * US-PROD-001 - CA-7: API endpoints for product creation
   * @param {FormData} productData - Datos del producto (incluye imagen)
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async createProduct(productData) {
    try {
      const response = await api.post('/products', productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
   * Valida si un SKU es único
   * US-PROD-001 - CA-2: Unique SKU validation
   * @param {string} sku - SKU a validar
   * @returns {Promise<boolean>} - true si el SKU está disponible
   */
  async validateSKU(sku) {
    try {
      const response = await api.get(`/products/validate-sku/${sku}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Obtiene un producto por ID
   * US-PROD-001 - CA-7: API endpoint for product details
   * @param {string} productId - ID del producto
   * @returns {Promise} - Promesa con los datos del producto
   */
  async getProduct(productId) {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Obtiene la lista de productos con filtros opcionales
   * US-PROD-001 - CA-7: API endpoint for product list
   * @param {Object} filters - Filtros opcionales (search, category_id, etc.)
   * @returns {Promise} - Promesa con la lista de productos
   */
  async getProducts(filters = {}) {
    try {
      const response = await api.get('/products', { params: filters });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },

  /**
   * Actualiza un producto existente
   * @param {string} productId - ID del producto
   * @param {FormData} productData - Datos actualizados del producto
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async updateProduct(productId, productData) {
    try {
      const response = await api.put(`/products/${productId}`, productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
   * Elimina un producto
   * US-PROD-006: Delete product
   * @param {string} productId - ID del producto
   * @param {Object} options - Opciones de eliminación
   * @param {string} options.reason - Razón de eliminación (opcional)
   * @param {boolean} options.force_with_stock - Forzar eliminación con stock
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async deleteProduct(productId, options = {}) {
    try {
      const response = await api.delete(`/products/${productId}`, {
        data: options
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
   * Obtiene la lista de categorías
   * US-PROD-001 - CA-1: Category dropdown
   * @returns {Promise} - Promesa con la lista de categorías
   */
  async getCategories() {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, error: { message: 'Error de conexión con el servidor' } };
    }
  },
};

export default productService;
