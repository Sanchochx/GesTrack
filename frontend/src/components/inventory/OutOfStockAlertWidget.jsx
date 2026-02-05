import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Badge,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Skeleton,
  useTheme,
  Alert
} from '@mui/material';
import {
  WarningAmber as WarningIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Inventory as InventoryIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

/**
 * Widget de Alertas de Stock Cero
 * US-INV-007 CA-2: Alerta Visual en Dashboard
 *
 * Muestra:
 * - Contador de productos sin stock (rojo destacado)
 * - Lista de últimos productos que llegaron a stock 0
 * - Navegación a vista dedicada de productos sin stock
 * - Badge de notificación si hay nuevas alertas
 * - Actualización automática cada 5 minutos
 */
const OutOfStockAlertWidget = ({ maxItems = 5, refreshInterval = 300000 }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    count: 0,
    products: [],
    statistics: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Cargar datos
  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }

    try {
      // Ejecutar llamadas en paralelo
      const [countResponse, productsResponse, statsResponse] = await Promise.all([
        inventoryService.getOutOfStockCount(),
        inventoryService.getOutOfStockProducts({ page: 1, per_page: maxItems, sort_by: 'created_at', sort_order: 'desc' }),
        inventoryService.getCriticalAlertStatistics()
      ]);

      setData({
        count: countResponse.data?.count || 0,
        products: productsResponse.data?.products || [],
        statistics: statsResponse.data || null
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching out of stock data:', err);
      setError('Error al cargar datos de productos sin stock');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [maxItems]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling automático
  useEffect(() => {
    const interval = setInterval(() => {
      // Solo actualizar si la pestaña está visible
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }, refreshInterval);

    // Manejar cambios de visibilidad
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, refreshInterval]);

  // Navegar a vista de productos sin stock
  const handleViewAll = () => {
    navigate('/inventory/out-of-stock');
  };

  // Navegar a detalle de producto
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  // Formatear tiempo relativo
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
    if (diffDays < 7) return `hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Renderizar loading
  if (loading) {
    return (
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" height={120} />
        </CardContent>
      </Card>
    );
  }

  // Renderizar error
  if (error) {
    return (
      <Card elevation={3}>
        <CardContent>
          <Alert
            severity="error"
            action={
              <IconButton color="inherit" size="small" onClick={() => fetchData()}>
                <RefreshIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const hasAlerts = data.count > 0;

  return (
    <Card
      elevation={3}
      sx={{
        border: hasAlerts ? `2px solid ${theme.palette.error.main}` : 'none',
        bgcolor: hasAlerts ? 'error.lighter' : 'background.paper',
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent>
        {/* Header con contador */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              badgeContent={hasAlerts ? '!' : null}
              color="error"
              overlap="circular"
              sx={{ mr: 2 }}
            >
              <Avatar
                sx={{
                  bgcolor: hasAlerts ? 'error.main' : 'success.main',
                  width: 48,
                  height: 48
                }}
              >
                {hasAlerts ? <ErrorIcon /> : <CheckCircleIcon />}
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="h4" component="div" color={hasAlerts ? 'error.main' : 'success.main'}>
                {data.count}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.count === 1 ? 'Producto Sin Stock' : 'Productos Sin Stock'}
              </Typography>
            </Box>
          </Box>

          {/* Acciones */}
          <Box>
            <Tooltip title="Actualizar">
              <IconButton
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                size="small"
              >
                {isRefreshing ? (
                  <CircularProgress size={20} />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Estadísticas rápidas */}
        {data.statistics && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              icon={<WarningIcon fontSize="small" />}
              label={`${data.statistics.active_alerts || 0} alertas activas`}
              color={data.statistics.active_alerts > 0 ? 'error' : 'default'}
              variant="outlined"
            />
            {data.statistics.resolved_last_30_days > 0 && (
              <Chip
                size="small"
                icon={<CheckCircleIcon fontSize="small" />}
                label={`${data.statistics.resolved_last_30_days} resueltas (30d)`}
                color="success"
                variant="outlined"
              />
            )}
            {data.statistics.avg_resolution_time_hours > 0 && (
              <Chip
                size="small"
                icon={<AccessTimeIcon fontSize="small" />}
                label={`~${data.statistics.avg_resolution_time_hours}h tiempo promedio`}
                variant="outlined"
              />
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Lista de productos sin stock */}
        {hasAlerts ? (
          <>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Productos Sin Stock Recientes
            </Typography>
            <List dense disablePadding>
              {data.products.slice(0, maxItems).map((product) => (
                <ListItem
                  key={product.id}
                  button
                  onClick={() => handleProductClick(product.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={product.image_url}
                      variant="rounded"
                      sx={{ width: 40, height: 40 }}
                    >
                      <InventoryIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap>
                        {product.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {product.sku}
                        </Typography>
                        {product.out_of_stock_since && (
                          <Chip
                            label={formatTimeAgo(product.out_of_stock_since)}
                            size="small"
                            color="error"
                            variant="filled"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {data.count > maxItems && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                +{data.count - maxItems} productos más sin stock
              </Typography>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="body1" color="success.main">
              Todos los productos tienen stock
            </Typography>
            <Typography variant="caption" color="text.secondary">
              No hay alertas de stock crítico activas
            </Typography>
          </Box>
        )}

        {/* Botón para ver todos */}
        <Box sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant={hasAlerts ? 'contained' : 'outlined'}
            color={hasAlerts ? 'error' : 'primary'}
            endIcon={<ArrowForwardIcon />}
            onClick={handleViewAll}
          >
            Ver Todos los Productos Sin Stock
          </Button>
        </Box>

        {/* Última actualización */}
        {lastUpdated && (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            Actualizado: {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

OutOfStockAlertWidget.propTypes = {
  maxItems: PropTypes.number,
  refreshInterval: PropTypes.number
};

export default OutOfStockAlertWidget;
