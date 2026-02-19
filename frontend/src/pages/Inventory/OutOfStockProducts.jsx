import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Alert,
  AlertTitle,
  Skeleton,
  Card,
  CardContent,
  Grid,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  Inventory as InventoryIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  ShoppingCart as OrderIcon,
  Build as AdjustIcon,
  Refresh as RefreshIcon,
  ArrowBack as BackIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Category as CategoryIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';
import StockBadge from '../../components/products/StockBadge';

/**
 * Página de Productos Sin Stock
 * US-INV-007 CA-4: Vista Dedicada de Productos Sin Stock
 *
 * Muestra:
 * - Lista de todos los productos con stock = 0
 * - Información del producto (nombre, SKU, imagen, categoría)
 * - Fecha cuando llegó a stock 0
 * - Último movimiento que causó la falta de stock
 * - Acciones: "Crear Orden de Compra", "Ajustar Stock"
 */
const OutOfStockProducts = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
  });
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statistics, setStatistics] = useState(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsResponse, statsResponse] = await Promise.all([
        inventoryService.getOutOfStockProducts({
          page: pagination.page,
          per_page: pagination.per_page,
          sort_by: sortField,
          sort_order: sortOrder,
        }),
        inventoryService.getCriticalAlertStatistics(),
      ]);

      setProducts(productsResponse.data?.products || []);
      setPagination((prev) => ({
        ...prev,
        total: productsResponse.data?.pagination?.total || 0,
        pages: productsResponse.data?.pagination?.pages || 0,
      }));
      setStatistics(statsResponse.data || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching out of stock products:', err);
      setError('Error al cargar los productos sin stock');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.per_page, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
  };

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination((prev) => ({
      ...prev,
      per_page: parseInt(event.target.value, 10),
      page: 1,
    }));
  };

  const handleViewProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleEditProduct = (productId) => {
    navigate(`/products/${productId}/edit`);
  };

  const handleAdjustStock = (productId) => {
    // Navigate to manual adjustment with product pre-selected
    navigate(`/inventory/adjustments?product=${productId}`);
  };

  const handleCreatePurchaseOrder = (product) => {
    // CA-6: Preparar para crear orden de compra (Epic 05)
    // Por ahora, mostrar mensaje informativo
    alert(`Funcionalidad de "Crear Orden de Compra" disponible en Epic 05.\n\nProducto: ${product.name}\nSKU: ${product.sku}\nCantidad sugerida: ${(product.reorder_point || 10) * 2} unidades`);
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 30) return `hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  // Columns configuration
  const columns = [
    { id: 'product', label: 'Producto', sortable: false },
    { id: 'category', label: 'Categoría', sortable: true },
    { id: 'prices', label: 'Precios', sortable: false },
    { id: 'created_at', label: 'Sin Stock Desde', sortable: true },
    { id: 'last_movement', label: 'Último Movimiento', sortable: false },
    { id: 'actions', label: 'Acciones', sortable: false, align: 'right' },
  ];

  // Render loading skeleton
  if (loading && products.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ p: 3, mt: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rectangular" height={60} sx={{ mt: 2, mb: 3 }} />
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={100} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rectangular" height={400} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: 3, mt: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Inicio
          </Link>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/inventory/by-category');
            }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <InventoryIcon sx={{ mr: 0.5 }} fontSize="small" />
            Inventario
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 0.5, color: 'error.main' }} fontSize="small" />
            Productos Sin Stock
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="error" />
              Productos Sin Stock
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Productos que requieren reorden urgente
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate(-1)}
            >
              Volver
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
            >
              Actualizar
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Card sx={{ bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDownIcon color="error" />
                    <Typography variant="h4" color="error.main">
                      {statistics.out_of_stock_products}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Productos Sin Stock
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    <Typography variant="h4">
                      {statistics.active_alerts}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Alertas Activas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon color="info" />
                    <Typography variant="h4">
                      {statistics.avg_resolution_time_hours || 0}h
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Tiempo Promedio de Resolución
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ bgcolor: 'success.lighter' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon color="success" />
                    <Typography variant="h4" color="success.main">
                      {statistics.resolved_last_30_days}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Resueltas (últimos 30 días)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Info Alert */}
        {products.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Atención Requerida</AlertTitle>
            Hay <strong>{pagination.total}</strong> productos sin stock que necesitan reorden urgente.
            Los productos están ordenados por antigüedad de la alerta (más antiguos primero).
          </Alert>
        )}

        {/* No Products Message */}
        {!loading && products.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              ¡Excelente! No hay productos sin stock
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Todos los productos tienen stock disponible.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/products')}
            >
              Ver Todos los Productos
            </Button>
          </Paper>
        )}

        {/* Products Table */}
        {products.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'error.lighter' }}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {column.sortable ? (
                        <TableSortLabel
                          active={sortField === column.id}
                          direction={sortField === column.id ? sortOrder : 'asc'}
                          onClick={() => handleSort(column.id)}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    hover
                    sx={{
                      bgcolor: 'error.lighter',
                      '&:hover': { bgcolor: 'error.light' },
                    }}
                  >
                    {/* Product Info */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={product.image_url}
                          variant="rounded"
                          sx={{ width: 60, height: 60 }}
                        >
                          <InventoryIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                            {product.sku}
                          </Typography>
                          <StockBadge stock={0} showQuantity={true} size="small" />
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Chip
                        icon={<CategoryIcon fontSize="small" />}
                        label={product.category_name || 'Sin categoría'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>

                    {/* Prices */}
                    <TableCell>
                      <Typography variant="body2">
                        Costo: {formatPrice(product.cost_price)}
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        Venta: {formatPrice(product.sale_price)}
                      </Typography>
                    </TableCell>

                    {/* Out of Stock Since */}
                    <TableCell>
                      <Chip
                        icon={<TimeIcon fontSize="small" />}
                        label={formatTimeAgo(product.out_of_stock_since)}
                        color="error"
                        size="small"
                      />
                      {product.out_of_stock_since && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          {new Date(product.out_of_stock_since).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Last Movement */}
                    <TableCell>
                      {product.last_movement ? (
                        <Box>
                          <Chip
                            label={product.last_movement.movement_type}
                            size="small"
                            variant="outlined"
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="caption" display="block" color="text.secondary">
                            Cantidad: {product.last_movement.quantity}
                          </Typography>
                          {product.last_movement.reason && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {product.last_movement.reason}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin información
                        </Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, flexWrap: 'wrap' }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewProduct(product.id)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar producto">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditProduct(product.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ajustar stock">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleAdjustStock(product.id)}
                          >
                            <AdjustIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Crear Orden de Compra (Epic 05)">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleCreatePurchaseOrder(product)}
                          >
                            <OrderIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page - 1}
              onPageChange={handlePageChange}
              rowsPerPage={pagination.per_page}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default OutOfStockProducts;
