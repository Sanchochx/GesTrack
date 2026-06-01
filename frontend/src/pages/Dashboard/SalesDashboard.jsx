import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  ShoppingCart as OrdersIcon,
  PendingActions as PendingIcon,
  AttachMoney as RevenueIcon,
  People as CustomersIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as DeliveredIcon,
} from '@mui/icons-material';
import authService from '../../services/authService';
import DashboardHeader from '../../components/common/DashboardHeader';
import StatCard from '../../components/common/StatCard';
import useSalesDashboard from '../../hooks/useSalesDashboard';

const STATUS_CHIP_CONFIG = {
  Pendiente:   { color: 'warning' },
  Confirmado:  { color: 'info' },
  Procesando:  { color: 'info' },
  Enviado:     { color: 'primary' },
  Entregado:   { color: 'success' },
  Cancelado:   { color: 'error' },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (isoString) => {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoString));
};

/**
 * DS-003: Dashboard para Personal de Ventas — Sistema de Diseño Emerald Logic.
 * Muestra KPIs de ventas, pedidos recientes y acciones rápidas.
 */
const SalesDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { loading, error, recentOrders, metrics, totalOrders, activeCustomers, refetch } =
    useSalesDashboard();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) { navigate('/login'); return; }
    if (currentUser.role !== 'Personal de Ventas') { navigate('/dashboard'); return; }
    setUser(currentUser);
  }, [navigate]);

  if (!user) return null;

  const pendingCount = metrics?.status_counts?.['Pendiente'] || 0;
  const deliveredCount = metrics?.status_counts?.['Entregado'] || 0;

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: { xs: 2, md: 3 }, mt: 4 }}>
        {/* DS-001: Cabecera personalizada Emerald Logic */}
        <DashboardHeader role={user.role} userName={user.full_name} />

        {/* Error global */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <IconButton color="inherit" size="small" onClick={refetch}>
                <RefreshIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* ── KPIs ── */}
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: 1.5, display: 'block', mb: 2 }}
        >
          Resumen de Ventas
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Total Pedidos"
              value={loading ? '—' : totalOrders}
              icon={<OrdersIcon />}
              color="primary"
              subtitle="Todos los tiempos"
              loading={loading}
              onClick={() => navigate('/orders')}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Pedidos Pendientes"
              value={loading ? '—' : pendingCount}
              icon={<PendingIcon />}
              color="warning"
              subtitle="Requieren atención"
              loading={loading}
              onClick={() => navigate('/orders?status=Pendiente')}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Ingresos Totales"
              value={loading ? '—' : formatCurrency(metrics?.total_amount)}
              icon={<RevenueIcon />}
              color="success"
              subtitle="Valor acumulado"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Clientes Activos"
              value={loading ? '—' : activeCustomers}
              icon={<CustomersIcon />}
              color="info"
              subtitle="Base de clientes"
              loading={loading}
              onClick={() => navigate('/customers')}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* ── Pedidos Recientes ── */}
          <Grid item xs={12} lg={8}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pedidos Recientes
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Actualizar">
                      <IconButton size="small" onClick={refetch} disabled={loading}>
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/orders')}
                    >
                      Ver todos
                    </Button>
                  </Box>
                </Box>

                {loading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 1 }} />
                    ))}
                  </Box>
                ) : recentOrders.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <OrdersIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No hay pedidos registrados aún
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/orders/new')}
                    >
                      Crear Primer Pedido
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Número</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentOrders.map((order) => {
                          const chipConfig = STATUS_CHIP_CONFIG[order.status] || { color: 'default' };
                          return (
                            <TableRow
                              key={order.id}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                                  {order.order_number}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                                  {order.customer_name || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={order.status}
                                  color={chipConfig.color}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(order.total)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(order.created_at)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ── Panel lateral ── */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
              {/* Acciones Rápidas */}
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Acciones Rápidas
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/orders/new')}
                    >
                      Nuevo Pedido
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CustomersIcon />}
                      onClick={() => navigate('/customers')}
                    >
                      Ver Clientes
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<OrdersIcon />}
                      onClick={() => navigate('/orders')}
                    >
                      Todos los Pedidos
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Distribución de Estados */}
              {!loading && metrics?.status_counts && (
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Distribución de Estados
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {Object.entries(metrics.status_counts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([status, count]) => {
                          const chipConfig = STATUS_CHIP_CONFIG[status] || { color: 'default' };
                          return (
                            <Box
                              key={status}
                              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                              <Chip
                                label={status}
                                color={chipConfig.color}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {count}
                              </Typography>
                            </Box>
                          );
                        })}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DeliveredIcon color="success" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        {deliveredCount} pedidos entregados
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default SalesDashboard;
