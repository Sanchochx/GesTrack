/**
 * US-INV-005 CA-5: Panel de Métricas Adicionales del Inventario
 *
 * Muestra top productos por valor, top categorías, y distribución de stock
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Category as CategoryIcon,
  Inventory2 as ProductIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

/**
 * Componente para mostrar métricas adicionales del inventario
 */
const ValueMetricsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchMetrics();

    // CA-6: Set up polling (every 5 minutes)
    const intervalId = setInterval(() => {
      fetchMetrics();
    }, 5 * 60 * 1000); // 5 minutes

    // CA-6: Page visibility handling - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, fetch fresh data
        fetchMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener top productos y métricas en paralelo
      const [productsResponse, metricsResponse] = await Promise.all([
        inventoryService.getTopProductsByValue(10),
        inventoryService.getInventoryMetrics()
      ]);

      setTopProducts(productsResponse.data || []);
      setMetrics(metricsResponse.data || null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.error?.message || 'Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  const stockDistribution = metrics?.stock_distribution || {};
  const total = stockDistribution.total || 1; // Evitar división por cero

  return (
    <Grid container spacing={3}>
      {/* Top 10 Productos por Valor */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ProductIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Top 10 Productos por Valor
              </Typography>
            </Box>

            <List dense>
              {topProducts.map((product, index) => (
                <React.Fragment key={product.product_id}>
                  <ListItem
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      px: 0
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: index < 3 ? 'primary.main' : 'grey.400',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        mr: 2,
                        mt: 0.5
                      }}
                    >
                      {index + 1}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {product.formatted_value}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip label={product.sku} size="small" variant="outlined" />
                          <Chip label={product.category_name} size="small" />
                          <Chip label={`Stock: ${product.stock_quantity}`} size="small" variant="outlined" />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < topProducts.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>

            {topProducts.length === 0 && (
              <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                No hay productos con stock
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Métricas Adicionales */}
      <Grid item xs={12} md={6}>
        <Grid container spacing={3}>
          {/* Top 5 Categorías */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CategoryIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6">
                    Top 5 Categorías por Inversión
                  </Typography>
                </Box>

                <List dense>
                  {metrics?.top_categories?.slice(0, 5).map((category, index) => (
                    <ListItem key={category.category_id} sx={{ px: 0 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: category.category_color || 'grey.400',
                          mr: 2
                        }}
                      />
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">
                              {category.category_name}
                            </Typography>
                            <Chip
                              label={`${category.percentage.toFixed(1)}%`}
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                        }
                        secondary={category.formatted_value}
                      />
                    </ListItem>
                  ))}
                </List>

                {(!metrics?.top_categories || metrics.top_categories.length === 0) && (
                  <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                    No hay datos disponibles
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Distribución de Stock */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distribución de Stock
                </Typography>

                {/* Stock Normal */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ fontSize: 18, mr: 1, color: 'success.main' }} />
                      <Typography variant="body2">Stock Normal</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {stockDistribution.normal_stock || 0} ({((stockDistribution.normal_stock || 0) / total * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(stockDistribution.normal_stock || 0) / total * 100}
                    sx={{ height: 8, borderRadius: 1, backgroundColor: 'success.light' }}
                    color="success"
                  />
                </Box>

                {/* Stock Bajo */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon sx={{ fontSize: 18, mr: 1, color: 'warning.main' }} />
                      <Typography variant="body2">Stock Bajo</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {stockDistribution.low_stock || 0} ({((stockDistribution.low_stock || 0) / total * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(stockDistribution.low_stock || 0) / total * 100}
                    sx={{ height: 8, borderRadius: 1, backgroundColor: 'warning.light' }}
                    color="warning"
                  />
                </Box>

                {/* Sin Stock */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ErrorIcon sx={{ fontSize: 18, mr: 1, color: 'error.main' }} />
                      <Typography variant="body2">Sin Stock</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {stockDistribution.out_of_stock || 0} ({((stockDistribution.out_of_stock || 0) / total * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(stockDistribution.out_of_stock || 0) / total * 100}
                    sx={{ height: 8, borderRadius: 1, backgroundColor: 'error.light' }}
                    color="error"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary" align="center">
                  Total de productos: {stockDistribution.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ValueMetricsPanel;
