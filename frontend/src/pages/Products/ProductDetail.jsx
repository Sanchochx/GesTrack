import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  LinearProgress,
  Breadcrumbs,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  ShoppingCart as ShoppingCartIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  Inventory2 as Inventory2Icon,
  ImageNotSupported as ImageNotSupportedIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale/es';
import StockBadge from '../../components/products/StockBadge';
import ImageZoomModal from '../../components/common/ImageZoomModal';
import productService from '../../services/productService';

/**
 * US-PROD-004: ProductDetail - Página de detalles completos del producto
 *
 * Criterios de Aceptación implementados:
 * - CA-1: Información básica del producto (imagen, nombre, SKU, descripción, categoría, estado)
 * - CA-2: Información de precios con margen de ganancia y códigos de colores
 * - CA-3: Información de inventario con estado de stock e indicador visual
 * - CA-4: Alertas y notificaciones de stock bajo
 * - CA-5: Metadatos (fechas de creación/actualización con formato relativo)
 * - CA-6: Botones de acción con permisos
 * - CA-7: Enlaces relacionados (categoría, productos similares, movimientos recientes)
 * - CA-8: Vista responsive (desktop, tablet, móvil)
 * - CA-9: Manejo de imagen no disponible con placeholder
 */
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [zoomModalOpen, setZoomModalOpen] = useState(false); // US-PROD-009 CA-11: Zoom modal state

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await productService.getProduct(id);

      if (response.success) {
        setProduct(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el producto');
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError(err.error?.message || 'Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/products');
  };

  const handleEdit = () => {
    navigate(`/products/${id}/edit`);
  };

  const handleDelete = () => {
    // TODO: Implementar en US-PROD-006
    console.log('Delete product:', id);
  };

  const handleCreateOrder = () => {
    // TODO: Implementar en US-ORD-001
    console.log('Create order with product:', id);
  };

  const handleViewMovements = () => {
    // TODO: Implementar en US-INV-003
    console.log('View inventory movements for product:', id);
  };

  const handleCategoryClick = () => {
    if (product?.category?.id) {
      navigate(`/products?category_id=${product.category.id}`);
    }
  };

  // CA-2: Formatear precios
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // CA-5: Formatear fechas
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // CA-5: Formatear fecha relativa
  const formatRelativeDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      });
    } catch {
      return formatDate(dateString);
    }
  };

  // CA-2: Determinar color del margen de ganancia
  const getProfitMarginColor = (margin) => {
    if (margin > 30) return 'success';
    if (margin >= 15) return 'warning';
    return 'error';
  };

  // CA-3: Obtener texto del estado de stock
  const getStockStatusText = () => {
    if (!product) return '';
    if (product.stock_quantity === 0) return 'Sin Stock';
    if (product.stock_quantity <= product.min_stock_level) return 'Stock Bajo';
    return 'Stock Normal';
  };

  // CA-3: Obtener color del estado de stock
  const getStockStatusColor = () => {
    if (!product) return 'default';
    if (product.stock_quantity === 0) return 'error';
    if (product.stock_quantity <= product.min_stock_level) return 'warning';
    return 'success';
  };

  // CA-7: Traducir tipo de movimiento
  const translateMovementType = (type) => {
    const types = {
      'Venta': 'Venta',
      'Compra': 'Compra',
      'Ajuste Manual': 'Ajuste Manual',
      'Devolución': 'Devolución',
      'Stock Inicial': 'Stock Inicial'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Volver a Productos
        </Button>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Producto no encontrado
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Volver a Productos
        </Button>
      </Container>
    );
  }

  const profitMargin = product.profit_margin || 0;
  const profitPerUnit = product.profit_per_unit || (product.sale_price - product.cost_price);
  const stockPercentage = product.stock_status?.stock_percentage || 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* CA-1: Breadcrumbs de navegación */}
      <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Inicio
        </Link>
        <Link
          to="/products"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
        >
          <Inventory2Icon sx={{ mr: 0.5 }} fontSize="small" />
          Productos
        </Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      {/* US-PROD-008 CA-6: Alertas de Stock Bajo/Sin Stock */}
      {product.stock_quantity === 0 && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          icon={<BlockIcon fontSize="inherit" />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleCreateOrder}
            >
              Reabastecer Urgente
            </Button>
          }
        >
          <Typography variant="body1" fontWeight="bold">
            Este producto NO tiene stock disponible
          </Typography>
          <Typography variant="body2">
            Considera crear una orden de compra urgente para reabastecer
          </Typography>
        </Alert>
      )}

      {product.stock_quantity > 0 && product.stock_quantity <= (product.reorder_point || product.min_stock_level || 10) && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          icon={<WarningIcon fontSize="inherit" />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleCreateOrder}
            >
              Crear Pedido de Compra
            </Button>
          }
        >
          <Typography variant="body1" fontWeight="bold">
            Este producto tiene stock bajo
          </Typography>
          <Typography variant="body2">
            Stock actual: {product.stock_quantity} unidades | Punto de reorden: {product.reorder_point || product.min_stock_level || 10} unidades
          </Typography>
        </Alert>
      )}

      {/* CA-1: Header con título y acciones */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 2 }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
            {product.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary" fontFamily="monospace">
              SKU: {product.sku}
            </Typography>
            <Chip
              label={product.is_active ? 'Activo' : 'Inactivo'}
              color={product.is_active ? 'success' : 'default'}
              size="small"
            />
          </Stack>
        </Box>

        {/* CA-6: Botones de acción */}
        <Stack direction={isMobile ? "column" : "row"} spacing={1} sx={{ width: isMobile ? '100%' : 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            fullWidth={isMobile}
          >
            Volver
          </Button>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={handleViewMovements}
            fullWidth={isMobile}
          >
            Ver Historial
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            onClick={handleCreateOrder}
            fullWidth={isMobile}
          >
            Crear Pedido
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            fullWidth={isMobile}
          >
            Editar
          </Button>
          <Tooltip title="Eliminar producto">
            <IconButton
              color="error"
              onClick={handleDelete}
              sx={{ display: isMobile ? 'none' : 'inline-flex' }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* CA-8: Layout responsive */}
      <Grid container spacing={3}>
        {/* CA-1 & CA-9: Columna Izquierda - Imagen del producto */}
        <Grid item xs={12} md={5}>
          <Card>
            {!imageError && product.image_url ? (
              <Box
                onClick={() => setZoomModalOpen(true)}
                sx={{
                  cursor: 'zoom-in',
                  position: 'relative',
                  '&:hover': {
                    opacity: 0.9,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  image={product.image_url}
                  alt={product.name}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 500,
                    objectFit: 'contain',
                    backgroundColor: '#f5f5f5',
                    p: 2,
                  }}
                  onError={() => setImageError(true)}
                />
                {/* US-PROD-009 CA-11: Hint de zoom */}
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  Click para ampliar
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#f5f5f5',
                  p: 2,
                }}
              >
                <ImageNotSupportedIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Sin imagen disponible
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ mt: 1 }}
                >
                  Agregar imagen
                </Button>
              </Box>
            )}
          </Card>

          {/* CA-3: Card de Estado de Stock */}
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <InventoryIcon sx={{ mr: 1 }} />
              Estado del Inventario
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Stock Actual
                </Typography>
                <Chip
                  label={getStockStatusText()}
                  color={getStockStatusColor()}
                  size="small"
                />
              </Box>
              <Typography variant="h3" sx={{ textAlign: 'center', my: 2, fontWeight: 'bold' }}>
                {product.stock_quantity}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                unidades disponibles
              </Typography>

              {/* CA-3: Barra de progreso visual de stock */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Nivel de Stock
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stockPercentage.toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, stockPercentage)}
                  color={
                    product.stock_quantity === 0 ? 'error' :
                    product.stock_quantity <= product.min_stock_level ? 'warning' :
                    'success'
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Punto de Reorden:
                </Typography>
                <Chip label={`${product.min_stock_level} unidades`} size="small" variant="outlined" />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Columna Derecha - Información Detallada */}
        <Grid item xs={12} md={7}>
          {/* CA-1: Información General */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información General
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {product.description ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Descripción:
                </Typography>
                <Typography variant="body1">
                  {product.description}
                </Typography>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                Este producto no tiene descripción
              </Alert>
            )}

            {/* CA-1: Categoría con enlace */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Categoría
                </Typography>
                <Chip
                  label={product.category?.name || 'Sin categoría'}
                  size="small"
                  clickable
                  onClick={handleCategoryClick}
                  sx={{
                    mt: 0.5,
                    backgroundColor: product.category?.color || undefined,
                    color: '#fff'
                  }}
                  icon={product.category?.icon ? <span>{product.category.icon}</span> : undefined}
                />
              </Box>
            </Box>
          </Paper>

          {/* CA-2: Información de Precios */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <MoneyIcon sx={{ mr: 1 }} />
              Información de Precios
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Precio de Costo
                  </Typography>
                  <Typography variant="h5" color="text.primary" sx={{ mt: 1 }}>
                    {formatPrice(product.cost_price)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: '#e3f2fd',
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Precio de Venta
                  </Typography>
                  <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                    {formatPrice(product.sale_price)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* CA-2: Margen de ganancia con código de colores */}
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: profitMargin > 30 ? '#f1f8e9' : profitMargin >= 15 ? '#fff8e1' : '#ffebee',
                borderRadius: 1,
                border: '1px solid',
                borderColor: profitMargin > 30 ? 'success.light' : profitMargin >= 15 ? 'warning.light' : 'error.light'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Margen de Ganancia
                  </Typography>
                  <Typography
                    variant="h6"
                    color={`${getProfitMarginColor(profitMargin)}.main`}
                    sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                  >
                    <TrendingUpIcon sx={{ mr: 0.5 }} />
                    {profitMargin.toFixed(2)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {profitMargin > 30 ? 'Excelente margen' : profitMargin >= 15 ? 'Margen aceptable' : 'Margen bajo'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    Ganancia por Unidad
                  </Typography>
                  <Typography
                    variant="h6"
                    color={`${getProfitMarginColor(profitMargin)}.main`}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {formatPrice(profitPerUnit)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* CA-7: Movimientos Recientes de Inventario */}
          {product.recent_movements && product.recent_movements.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ mr: 1 }} />
                Movimientos Recientes
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Stock Anterior</TableCell>
                    <TableCell align="right">Stock Nuevo</TableCell>
                    <TableCell align="right">Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {product.recent_movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <Chip
                          label={translateMovementType(movement.movement_type)}
                          size="small"
                          color={
                            movement.quantity > 0 ? 'success' :
                            movement.quantity < 0 ? 'error' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={movement.quantity > 0 ? 'success.main' : movement.quantity < 0 ? 'error.main' : 'text.primary'}
                          fontWeight="bold"
                        >
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{movement.previous_stock}</TableCell>
                      <TableCell align="right">{movement.new_stock}</TableCell>
                      <TableCell align="right">
                        <Tooltip title={formatDate(movement.created_at)}>
                          <Typography variant="caption" color="text.secondary">
                            {formatRelativeDate(movement.created_at)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<HistoryIcon />}
                  onClick={handleViewMovements}
                >
                  Ver historial completo
                </Button>
              </Box>
            </Paper>
          )}

          {/* CA-5: Metadatos del Sistema */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información del Sistema
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de Creación
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={formatDate(product.created_at)}>
                      <Typography variant="body2">
                        {formatRelativeDate(product.created_at)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      Última Actualización
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={formatDate(product.updated_at)}>
                      <Typography variant="body2">
                        {formatRelativeDate(product.updated_at)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          {/* CA-7: Productos Similares */}
          {product.similar_products && product.similar_products.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Productos Similares
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {product.similar_products.map((similarProduct) => (
                  <Grid item xs={12} sm={6} key={similarProduct.id}>
                    <Card sx={{ display: 'flex', height: '100%' }}>
                      <CardActionArea
                        onClick={() => navigate(`/products/${similarProduct.id}`)}
                        sx={{ display: 'flex', justifyContent: 'flex-start' }}
                      >
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f5f5f5',
                          }}
                        >
                          {similarProduct.image_url ? (
                            <img
                              src={similarProduct.image_url}
                              alt={similarProduct.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <ImageNotSupportedIcon color="disabled" />
                          )}
                        </Box>
                        <CardContent sx={{ flex: 1, py: 1 }}>
                          <Typography variant="body2" fontWeight="bold" noWrap>
                            {similarProduct.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            SKU: {similarProduct.sku}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              {formatPrice(similarProduct.sale_price)}
                            </Typography>
                            <Chip
                              label={`Stock: ${similarProduct.stock_quantity}`}
                              size="small"
                              color={similarProduct.stock_quantity > 0 ? 'success' : 'error'}
                              sx={{ height: 20 }}
                            />
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* US-PROD-009 CA-11: Modal de zoom de imagen */}
      {product && !imageError && product.image_url && (
        <ImageZoomModal
          open={zoomModalOpen}
          onClose={() => setZoomModalOpen(false)}
          imageUrl={product.image_url}
          alt={product.name}
        />
      )}
    </Container>
  );
};

export default ProductDetail;
