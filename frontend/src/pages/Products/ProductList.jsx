import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

  // Data state
  const [products, setProducts] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // UI state
  const [successMessage, setSuccessMessage] = useState(null);

  // Load products on mount and when filters/pagination change
  useEffect(() => {
    loadProducts();
  }, [page, itemsPerPage, searchTerm, selectedCategory, lowStockOnly, sortField, sortOrder]);

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

      if (lowStockOnly) {
        params.low_stock = true;
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
   * Handle low stock filter change
   */
  const handleLowStockChange = (enabled) => {
    setLowStockOnly(enabled);
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
        lowStockOnly={lowStockOnly}
        onLowStockChange={handleLowStockChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
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
