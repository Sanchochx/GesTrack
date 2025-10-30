import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import productService from '../../services/productService';
import ProductStats from '../../components/products/ProductStats';
import ProductFilters from '../../components/products/ProductFilters';
import ProductTable from '../../components/products/ProductTable';
import EmptyState from '../../components/products/EmptyState';

/**
 * ProductList Page
 * US-PROD-002: List Products
 *
 * Complete product listing with:
 * - CA-1: Table structure with all columns
 * - CA-2: Pagination (20 items per page, customizable)
 * - CA-3: Stock indicators (low stock, out of stock)
 * - CA-4: Multi-column sorting
 * - CA-5: New product button
 * - CA-6: Product statistics and counters
 * - CA-7: Quick actions (view, edit, delete)
 * - Search and filter functionality
 */
const ProductList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // US-PROD-003 CA-9: Initialize filters from URL query params
  const getInitialSearchTerm = () => searchParams.get('search') || '';
  const getInitialCategory = () => searchParams.get('category') || '';
  const getInitialStockStatus = () => searchParams.get('stock') || '';
  const getInitialPage = () => parseInt(searchParams.get('page') || '1', 10);

  // Data state
  const [products, setProducts] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(getInitialPage());
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter state
  const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm());
  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory());
  const [lowStockOnly, setLowStockOnly] = useState(false); // Legacy - for backward compat
  const [stockStatus, setStockStatus] = useState(getInitialStockStatus()); // US-PROD-003 CA-4: all, normal, low, out

  // Sort state
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // UI state
  const [successMessage, setSuccessMessage] = useState(null);

  // US-PROD-003 CA-9: Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (stockStatus) params.set('stock', stockStatus);
    if (page > 1) params.set('page', page.toString());

    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedCategory, stockStatus, page, setSearchParams]);

  // Load products on mount and when filters/pagination change
  useEffect(() => {
    loadProducts();
  }, [page, itemsPerPage, searchTerm, selectedCategory, stockStatus, sortField, sortOrder]);

  // Show success message if coming from create/edit
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  /**
   * Load products from API
   * US-PROD-002 - CA-2: Server-side pagination
   * US-PROD-002 - CA-4: Server-side sorting
   */
  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = {
        page,
        limit: itemsPerPage,
        sort: sortField,
        order: sortOrder,
      };

      // Add filters if present
      if (searchTerm) {
        params.search = searchTerm;
      }

      if (selectedCategory) {
        params.category_id = selectedCategory;
      }

      // US-PROD-003 CA-4: Stock status filter
      if (stockStatus) {
        params.stock_status = stockStatus;
      }

      const response = await productService.getProducts(params);

      if (response.success) {
        setProducts(response.data || []);
        setStatistics(response.statistics || {});
        setTotalProducts(response.pagination?.total || 0);
      } else {
        setError(response.error?.message || 'Error al cargar productos');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.error?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle create new product
   * CA-5: New product button
   */
  const handleCreateProduct = () => {
    navigate('/products/new');
  };

  /**
   * Handle page change
   * CA-2: Pagination
   */
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  /**
   * Handle items per page change
   * CA-2: Items per page selector
   */
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setPage(1); // Reset to first page
  };

  /**
   * Handle sort change
   * CA-4: Column sorting
   */
  const handleSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  };

  /**
   * Handle search change
   */
  const handleSearchChange = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setPage(1); // Reset to first page
  };

  /**
   * Handle category filter change
   */
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1); // Reset to first page
  };

  /**
   * Handle stock status filter change
   * US-PROD-003 CA-4
   */
  const handleStockStatusChange = (status) => {
    setStockStatus(status);
    setPage(1); // Reset to first page
  };

  /**
   * Handle product deletion success
   * Reload products to reflect changes
   */
  const handleProductDeleted = () => {
    setSuccessMessage('Producto eliminado correctamente');
    loadProducts();
  };

  /**
   * Handle close snackbar
   */
  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  /**
   * Handle clear all filters
   * US-PROD-003 CA-7
   */
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setStockStatus('');
    setPage(1);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Productos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión del catálogo de productos
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateProduct}
        >
          Nuevo Producto
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {!loading && <ProductStats statistics={statistics} />}

      {/* Filters */}
      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        stockStatus={stockStatus}
        onStockStatusChange={handleStockStatusChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Results Counter - US-PROD-003 CA-6 */}
      {!loading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {(searchTerm || selectedCategory || stockStatus) ? (
              `${totalProducts} de ${statistics.total || 0} productos`
            ) : (
              `Se encontraron ${totalProducts} productos`
            )}
          </Typography>
        </Box>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        /* Empty State - US-PROD-003 CA-7 */
        <EmptyState onClearFilters={handleClearAllFilters} />
      ) : (
        /* Product Table */
        <ProductTable
          products={products}
          totalProducts={totalProducts}
          page={page}
          itemsPerPage={itemsPerPage}
          sortField={sortField}
          sortOrder={sortOrder}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onSort={handleSort}
          onProductDeleted={handleProductDeleted}
        />
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductList;
