import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import productService from '../../services/productService';
import ProductTable from '../../components/products/ProductTable';
import EmptyState from '../../components/products/EmptyState';

/**
 * LowStockProducts Page
 * US-PROD-008 CA-4: Vista dedicada de productos con stock bajo
 *
 * Muestra solo productos donde stock_quantity <= reorder_point
 * Con columnas adicionales: Punto de Reorden y Diferencia
 * Ordenamiento por defecto: stock más bajo primero
 * Productos sin stock destacados al inicio
 */
const LowStockProducts = () => {
  const navigate = useNavigate();

  // Data state
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    total_low_stock: 0,
    out_of_stock: 0,
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Sort state - default: ordenar por stock (más bajo primero)
  const [sortField, setSortField] = useState('stock_quantity');
  const [sortOrder, setSortOrder] = useState('asc');

  // UI state
  const [successMessage, setSuccessMessage] = useState(null);

  // Load low stock products on mount and when filters/pagination change
  useEffect(() => {
    loadLowStockProducts();
  }, [page, itemsPerPage, sortField, sortOrder]);

  /**
   * Load low stock products from API
   * US-PROD-008 CA-2: Query products with stock <= reorder_point
   */
  const loadLowStockProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productService.getLowStockProducts({
        page,
        per_page: itemsPerPage,
        sort_by: sortField,
        order: sortOrder,
      });

      if (response.success) {
        setProducts(response.data || []);
        setTotalProducts(response.pagination?.total || 0);
        setStats(response.stats || { total_low_stock: 0, out_of_stock: 0 });
      } else {
        setError('Error al cargar productos con stock bajo');
      }
    } catch (err) {
      console.error('Error loading low stock products:', err);
      setError(err.error?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  /**
   * Handle items per page change
   */
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setPage(1); // Reset to first page
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  };

  /**
   * Handle product deletion success
   */
  const handleProductDeleted = () => {
    setSuccessMessage('Producto eliminado correctamente');
    loadLowStockProducts();
  };

  /**
   * Handle close success message
   */
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  return (
    <Container maxWidth="xl" sx={{ p: 3, py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Productos con Stock Bajo
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Productos que requieren reabastecimiento según el punto de reorden configurado
        </Typography>
      </Box>

      {/* Statistics Cards - US-PROD-008 CA-4 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Stock Bajo
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.total_low_stock}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sin Stock
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.out_of_stock}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert Banner */}
      {stats.out_of_stock > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
          <strong>¡Atención!</strong> Hay {stats.out_of_stock} producto(s) sin stock disponible. Se requiere reabastecimiento urgente.
        </Alert>
      )}

      {stats.total_low_stock > 0 && stats.out_of_stock === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          Hay {stats.total_low_stock} producto(s) con stock bajo. Considera realizar pedidos de compra pronto.
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <EmptyState
          title="¡Excelente! No hay productos con stock bajo"
          subtitle="Todos los productos tienen stock suficiente según el punto de reorden configurado"
          showButton={false}
        />
      )}

      {/* Products Table */}
      {!loading && !error && products.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <ProductTable
            products={products}
            totalProducts={totalProducts}
            page={page}
            itemsPerPage={itemsPerPage}
            sortField={sortField}
            sortOrder={sortOrder}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            onSort={handleSortChange}
            onProductDeleted={handleProductDeleted}
          />
        </Paper>
      )}

      {/* Success Message Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSuccessMessage} severity="success" variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LowStockProducts;
