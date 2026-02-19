/**
 * US-INV-010: Dashboard de Inventario
 *
 * Dashboard con métricas clave del inventario para gerentes de almacén.
 * Incluye KPIs, gráficos, top productos, movimientos recientes y acciones rápidas.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Skeleton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Alert,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  WarningAmber as WarningIcon,
  ErrorOutline as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  ViewList as ViewListIcon,
  Build as AdjustIcon,
  FileDownload as ExportIcon,
  History as HistoryIcon,
  RemoveShoppingCart as NoStockIcon,
  Category as CategoryIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  SwapVert as SwapVertIcon,
  Tune as TuneIcon,
  Speed as SpeedIcon,
  Inbox as InboxIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import inventoryService from '../../services/inventoryService';

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Última semana' },
  { value: '30d', label: 'Último mes' },
  { value: '90d', label: 'Último trimestre' },
  { value: '365d', label: 'Último año' }
];

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };

const CHART_COLORS = [
  '#2e7d32', '#1565c0', '#e65100', '#6a1b9a',
  '#c62828', '#00838f', '#ef6c00', '#4527a0',
  '#2e7d32', '#ad1457', '#558b2f', '#1a237e'
];

const MOVEMENT_TYPE_CONFIG = {
  'Stock Inicial': { icon: <AddIcon fontSize="small" />, color: '#1565c0' },
  'Entrada': { icon: <AddIcon fontSize="small" />, color: '#2e7d32' },
  'Salida': { icon: <RemoveIcon fontSize="small" />, color: '#c62828' },
  'Ajuste': { icon: <TuneIcon fontSize="small" />, color: '#e65100' },
  'Devolución': { icon: <SwapVertIcon fontSize="small" />, color: '#6a1b9a' }
};

const InventoryDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Data
  const [kpis, setKpis] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [valueEvolution, setValueEvolution] = useState([]);
  const [additionalStats, setAdditionalStats] = useState(null);

  // Polling ref
  const pollingRef = useRef(null);

  // CA-8: Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const [
        kpisRes,
        categoryRes,
        lowStockRes,
        movementsRes,
        evolutionRes,
        statsRes
      ] = await Promise.all([
        inventoryService.getDashboardKPIs(),
        inventoryService.getValueByCategory(),
        inventoryService.getDashboardLowStockProducts(10),
        inventoryService.getRecentMovements(10),
        inventoryService.getValueEvolution(period),
        inventoryService.getDashboardAdditionalStats(PERIOD_DAYS[period] || 30)
      ]);

      if (kpisRes?.success) setKpis(kpisRes.data);
      if (categoryRes?.success) setCategoryData(categoryRes.data || []);
      if (lowStockRes?.success) setLowStockProducts(lowStockRes.data || []);
      if (movementsRes?.success) setRecentMovements(movementsRes.data || []);
      if (evolutionRes?.success) setValueEvolution(evolutionRes.data || []);
      if (statsRes?.success) setAdditionalStats(statsRes.data);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Initial load and polling setup
  useEffect(() => {
    fetchDashboardData(true);

    // CA-8: Polling cada 30 segundos
    pollingRef.current = setInterval(() => {
      fetchDashboardData(false);
    }, 30000);

    // CA-8: Pause polling when tab is hidden
    const handleVisibility = () => {
      if (!document.hidden) {
        fetchDashboardData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchDashboardData]);

  // Format time ago
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value || 0);
  };

  // CA-1: KPI Card component
  const KPICard = ({ title, value, subtitle, icon, color, onClick, badge }) => (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: 4
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={40} />
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
                {value}
              </Typography>
            )}
            {subtitle && !loading && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}20`,
              color: color,
              width: 48,
              height: 48
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {badge && !loading && (
          <Chip
            label={badge.label}
            size="small"
            sx={{
              mt: 1,
              bgcolor: badge.color + '20',
              color: badge.color,
              fontWeight: 'bold'
            }}
          />
        )}
      </CardContent>
    </Card>
  );

  // Render loading state
  if (loading && !kpis) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ p: 3, mt: 4 }}>
          <Skeleton width={300} height={40} />
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {[1, 2, 3, 4].map(i => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1 }} />
              </Grid>
            ))}
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 1 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 1 }} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: 3, mt: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 3, flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Dashboard de Inventario
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vista general del estado del inventario
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* CA-5: Selector de período */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {PERIOD_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* CA-8: Refresh manual + indicador */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {lastUpdated && (
                <Tooltip title={`Última actualización: ${lastUpdated.toLocaleTimeString('es-ES')}`}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    {formatTimeAgo(lastUpdated.toISOString())}
                  </Typography>
                </Tooltip>
              )}
              <Tooltip title="Actualizar datos">
                <IconButton onClick={() => fetchDashboardData(false)} size="small" color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* CA-1: KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Total de Productos"
              value={kpis?.total_products || 0}
              subtitle={kpis?.new_products_30d > 0 ? `+${kpis.new_products_30d} nuevos (30d)` : 'SKUs activos'}
              icon={<InventoryIcon />}
              color={theme.palette.primary.main}
              badge={kpis?.new_products_30d > 0 ? {
                label: `+${kpis.new_products_30d} este mes`,
                color: theme.palette.primary.main
              } : null}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Valor del Inventario"
              value={kpis?.formatted_value || 'COP 0'}
              subtitle={`${kpis?.total_units || 0} unidades totales`}
              icon={<MoneyIcon />}
              color='#1565c0'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Productos Stock Bajo"
              value={kpis?.low_stock_count || 0}
              subtitle="Por debajo del punto de reorden"
              icon={<WarningIcon />}
              color='#ed6c02'
              onClick={() => navigate('/products/low-stock')}
              badge={kpis?.low_stock_count > 0 ? {
                label: 'Requiere atención',
                color: '#ed6c02'
              } : null}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Productos Sin Stock"
              value={kpis?.out_of_stock_count || 0}
              subtitle="Stock agotado"
              icon={<ErrorIcon />}
              color='#d32f2f'
              onClick={() => navigate('/inventory/out-of-stock')}
              badge={kpis?.out_of_stock_count > 0 ? {
                label: 'Crítico',
                color: '#d32f2f'
              } : null}
            />
          </Grid>
        </Grid>

        {/* CA-6 & CA-2: Charts row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* CA-6: Gráfico de Evolución del Valor */}
          <Grid item xs={12} lg={7}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Evolución del Valor del Inventario"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<TimelineIcon color="primary" />}
              />
              <CardContent>
                {valueEvolution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={valueEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                        }}
                        fontSize={12}
                      />
                      <YAxis
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k COP`}
                        fontSize={12}
                      />
                      <RechartsTooltip
                        formatter={(value) => [formatCurrency(value), 'Valor']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                      />
                      <Line
                        type="monotone"
                        dataKey="total_value"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                    <Typography color="text.secondary">
                      No hay datos de evolución disponibles para este período
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* CA-2: Distribución por Categoría */}
          <Grid item xs={12} lg={5}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Distribución por Categoría"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<CategoryIcon color="primary" />}
              />
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="total_value"
                        nameKey="category_name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        label={({ category_name, percentage }) =>
                          `${category_name} (${percentage?.toFixed(1) || 0}%)`
                        }
                        labelLine={!isMobile}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.category_color || CHART_COLORS[index % CHART_COLORS.length]}
                            cursor="pointer"
                            onClick={() => navigate('/inventory/by-category')}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [formatCurrency(value), name]}
                      />
                      {!isMobile && <Legend />}
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                    <Typography color="text.secondary">Sin datos de categorías</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CA-3 & CA-4: Products and Movements row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* CA-3: Top 10 Productos con Menor Stock */}
          <Grid item xs={12} lg={7}>
            <Card>
              <CardHeader
                title="Top 10 - Productos con Menor Stock"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<WarningIcon sx={{ color: '#ed6c02' }} />}
                action={
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/products/low-stock')}
                  >
                    Ver todos
                  </Button>
                }
              />
              <CardContent sx={{ p: 0 }}>
                {lowStockProducts.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Producto</TableCell>
                          <TableCell align="center">Stock</TableCell>
                          <TableCell align="center">Pto. Reorden</TableCell>
                          <TableCell align="center">Estado</TableCell>
                          {!isMobile && <TableCell>Categoría</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lowStockProducts.map((product) => (
                          <TableRow
                            key={product.id}
                            hover
                            sx={{
                              cursor: 'pointer',
                              bgcolor: product.stock_status === 'low_stock' ? '#fff3e0' : 'inherit'
                            }}
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {product.image_url ? (
                                  <Avatar
                                    src={product.image_url}
                                    variant="rounded"
                                    sx={{ width: 32, height: 32 }}
                                  />
                                ) : (
                                  <Avatar variant="rounded" sx={{ width: 32, height: 32, bgcolor: '#e0e0e0' }}>
                                    <InventoryIcon sx={{ fontSize: 16 }} />
                                  </Avatar>
                                )}
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {product.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {product.sku}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 'bold',
                                  color: product.stock_quantity <= product.reorder_point ? '#d32f2f' : 'inherit'
                                }}
                              >
                                {product.stock_quantity}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {product.reorder_point}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={product.stock_status === 'low_stock' ? 'Bajo' : 'Normal'}
                                size="small"
                                color={product.stock_status === 'low_stock' ? 'warning' : 'success'}
                                variant="outlined"
                              />
                            </TableCell>
                            {!isMobile && (
                              <TableCell>
                                <Typography variant="caption">{product.category_name}</Typography>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      Todos los productos tienen stock suficiente
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* CA-4: Últimos Movimientos de Inventario */}
          <Grid item xs={12} lg={5}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Últimos Movimientos"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<HistoryIcon color="primary" />}
                action={
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/inventory/history')}
                  >
                    Ver historial
                  </Button>
                }
              />
              <CardContent sx={{ p: 0 }}>
                {recentMovements.length > 0 ? (
                  <List dense disablePadding>
                    {recentMovements.map((movement, index) => {
                      const config = MOVEMENT_TYPE_CONFIG[movement.movement_type] || {
                        icon: <SwapVertIcon fontSize="small" />,
                        color: '#757575'
                      };
                      return (
                        <Box key={movement.id || index}>
                          <ListItem sx={{ py: 1.5, px: 2 }}>
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  bgcolor: config.color + '20',
                                  color: config.color,
                                  width: 36,
                                  height: 36
                                }}
                              >
                                {config.icon}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {movement.product_name || 'Producto'}
                                </Typography>
                              }
                              secondary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Chip
                                    label={movement.movement_type}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.65rem',
                                      bgcolor: config.color + '15',
                                      color: config.color
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {movement.user_name && `por ${movement.user_name}`}
                                  </Typography>
                                </Box>
                              }
                            />
                            <Box sx={{ textAlign: 'right', ml: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 'bold',
                                  color: movement.quantity > 0 ? '#2e7d32' : '#c62828'
                                }}
                              >
                                {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                              </Typography>
                              <Tooltip title={movement.created_at ? new Date(movement.created_at).toLocaleString('es-ES') : ''}>
                                <Typography variant="caption" color="text.secondary">
                                  {formatTimeAgo(movement.created_at)}
                                </Typography>
                              </Tooltip>
                            </Box>
                          </ListItem>
                          {index < recentMovements.length - 1 && <Divider variant="inset" component="li" />}
                        </Box>
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      No hay movimientos recientes
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CA-7: Estadísticas Adicionales */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Estadísticas del Período"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<BarChartIcon color="primary" />}
                subheader={`Datos de los últimos ${PERIOD_DAYS[period] || 30} días`}
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                        {additionalStats?.movements_total || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Movimientos Totales
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                        {additionalStats?.avg_daily_movements || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Promedio Diario
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                        {additionalStats?.inactive_products_90d || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Productos Inactivos (90d)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                        {additionalStats?.movements_by_type?.['Entrada']?.count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Entradas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#c62828' }}>
                        {additionalStats?.movements_by_type?.['Salida']?.count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Salidas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#6a1b9a' }}>
                        {additionalStats?.movements_by_type?.['Ajuste']?.count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ajustes
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CA-9: Acciones Rápidas */}
        <Card>
          <CardHeader
            title="Acciones Rápidas"
            titleTypographyProps={{ variant: 'h6' }}
            avatar={<SpeedIcon color="primary" />}
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2.4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ViewListIcon />}
                  onClick={() => navigate('/products')}
                  sx={{ py: 1.5, textTransform: 'none' }}
                >
                  Ver Inventario
                </Button>
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<NoStockIcon />}
                  onClick={() => navigate('/inventory/out-of-stock')}
                  color="error"
                  sx={{ py: 1.5, textTransform: 'none' }}
                >
                  Sin Stock
                </Button>
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AdjustIcon />}
                  onClick={() => navigate('/inventory/adjustments')}
                  sx={{ py: 1.5, textTransform: 'none' }}
                >
                  Ajustar Inventario
                </Button>
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ExportIcon />}
                  onClick={() => {
                    inventoryService.exportInventoryData({ format: 'excel' });
                  }}
                  sx={{ py: 1.5, textTransform: 'none' }}
                >
                  Exportar Reporte
                </Button>
              </Grid>
              <Grid item xs={6} sm={4} md={2.4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<HistoryIcon />}
                  onClick={() => navigate('/inventory/history')}
                  sx={{ py: 1.5, textTransform: 'none' }}
                >
                  Historial
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default InventoryDashboard;
