/**
 * CustomerOrderHistory - Historial de compras del cliente
 * US-CUST-007: Historial de Compras del Cliente
 *
 * CA-1:  Acceso desde perfil del cliente, breadcrumb
 * CA-2:  Lista completa de pedidos con paginación
 * CA-3:  Panel de métricas resumidas
 * CA-4:  Filtro por rango de fechas con shortcuts
 * CA-5:  Filtro por estado de pedido
 * CA-6:  Filtro por estado de pago
 * CA-7:  Detalles expandibles por pedido
 * CA-8:  Productos más comprados
 * CA-9:  Gráfico de compras en el tiempo
 * CA-10: Exportación CSV y Excel
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Menu,
  MenuItem,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FileDownload as FileDownloadIcon,
  ShoppingBag as ShoppingBagIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import customerService from '../../services/customerService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatRelativeDate = (dateString) => {
  if (!dateString) return 'N/A';
  const diffDays = Math.floor((Date.now() - new Date(dateString)) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace ${Math.floor(diffDays / 365)} años`;
};

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};
const startOfYear = () => `${new Date().getFullYear()}-01-01`;
const startOfLastYear = () => `${new Date().getFullYear() - 1}-01-01`;
const endOfLastYear = () => `${new Date().getFullYear() - 1}-12-31`;

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ['Pendiente', 'Confirmado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];
const PAYMENT_STATUSES = ['Pendiente', 'Parcial', 'Pagado', 'Reembolsado'];
const DEFAULT_STATUSES = ORDER_STATUSES.filter((s) => s !== 'Cancelado');

const STATUS_COLORS = {
  Pendiente: 'warning',
  Confirmado: 'info',
  Procesando: 'primary',
  Enviado: 'secondary',
  Entregado: 'success',
  Cancelado: 'error',
};

const PAYMENT_COLORS = {
  Pendiente: 'warning',
  Parcial: 'info',
  Pagado: 'success',
  Reembolsado: 'error',
};

const DATE_SHORTCUTS = [
  { label: 'Último mes', from: monthsAgo(1), to: today() },
  { label: 'Últimos 3 meses', from: monthsAgo(3), to: today() },
  { label: 'Últimos 6 meses', from: monthsAgo(6), to: today() },
  { label: 'Este año', from: startOfYear(), to: today() },
  { label: 'Año pasado', from: startOfLastYear(), to: endOfLastYear() },
  { label: 'Todo el historial', from: '', to: '' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ icon, value, label, color = 'primary' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Box sx={{ color: `${color}.main`, mb: 1 }}>{icon}</Box>
        <Typography variant="h6" fontWeight="bold" noWrap>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function OrderRow({ order, expanded, onToggle }) {
  return (
    <>
      <TableRow
        hover
        onClick={onToggle}
        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
      >
        <TableCell padding="checkbox">
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Tooltip title="Ver detalles del pedido estará disponible en el módulo de pedidos">
            <Typography variant="body2" fontWeight="medium" component="span">
              {order.order_number}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell>{formatDate(order.created_at)}</TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {order.items_count === 1 ? '1 producto' : `${order.items_count} productos`}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(order.total)}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={order.status}
            color={STATUS_COLORS[order.status] || 'default'}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Chip
            label={order.payment_status}
            color={PAYMENT_COLORS[order.payment_status] || 'default'}
            size="small"
            variant="outlined"
          />
        </TableCell>
      </TableRow>

      {/* CA-7: Detalles expandibles */}
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2" gutterBottom>
                    Productos del pedido
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell align="right">Cant.</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {item.product_sku}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Resumen del pedido
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {order.subtotal > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                        <Typography variant="body2">{formatCurrency(order.subtotal)}</Typography>
                      </Box>
                    )}
                    {order.tax_amount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          IVA ({order.tax_percentage}%):
                        </Typography>
                        <Typography variant="body2">{formatCurrency(order.tax_amount)}</Typography>
                      </Box>
                    )}
                    {order.shipping_cost > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Envío:</Typography>
                        <Typography variant="body2">{formatCurrency(order.shipping_cost)}</Typography>
                      </Box>
                    )}
                    {order.discount_amount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Descuento:</Typography>
                        <Typography variant="body2" color="error.main">
                          -{formatCurrency(order.discount_amount)}
                        </Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">Total:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(order.total)}
                      </Typography>
                    </Box>
                    {order.notes && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        Nota: {order.notes}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerOrderHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data state
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, pages: 0 });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  // CA-4: Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // CA-5: Status filter (default: all except Cancelado)
  const [selectedStatuses, setSelectedStatuses] = useState(DEFAULT_STATUSES);

  // CA-6: Payment status filter (default: all)
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState(PAYMENT_STATUSES);

  // Pagination
  const [page, setPage] = useState(0); // MUI is 0-based
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ─── Data loading ───────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedStatuses.length > 0 && selectedStatuses.length < ORDER_STATUSES.length) {
        params.status = selectedStatuses.join(',');
      }
      if (selectedPaymentStatuses.length > 0 && selectedPaymentStatuses.length < PAYMENT_STATUSES.length) {
        params.payment_status = selectedPaymentStatuses.join(',');
      }

      const response = await customerService.getOrdersHistory(id, params);
      if (response.success) {
        const { data, pagination: pag } = response;
        setCustomer(data.customer);
        setOrders(data.orders);
        setMetrics(data.metrics);
        setTopProducts(data.top_products);
        setChartData(data.chart_data);
        setPagination(pag);
        setExpandedRows(new Set()); // collapse all on reload
      } else {
        setError(response.error?.message || 'Error al cargar historial');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar historial de compras');
    } finally {
      setLoading(false);
    }
  }, [id, page, rowsPerPage, dateFrom, dateTo, selectedStatuses, selectedPaymentStatuses]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  // CA-4: Date shortcut
  const handleDateShortcut = (shortcut) => {
    setDateFrom(shortcut.from);
    setDateTo(shortcut.to);
    setPage(0);
  };

  // CA-5: Toggle order status
  const handleStatusToggle = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(0);
  };

  // CA-6: Toggle payment status
  const handlePaymentToggle = (status) => {
    setSelectedPaymentStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(0);
  };

  // CA-7: Toggle row expansion
  const handleRowToggle = (orderId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // CA-10: Export
  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      const params = { format };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedStatuses.length > 0 && selectedStatuses.length < ORDER_STATUSES.length) {
        params.status = selectedStatuses.join(',');
      }
      if (selectedPaymentStatuses.length > 0 && selectedPaymentStatuses.length < PAYMENT_STATUSES.length) {
        params.payment_status = selectedPaymentStatuses.join(',');
      }
      const customerName = customer?.nombre_razon_social || 'cliente';
      await customerService.exportOrdersHistory(id, params, customerName);
    } catch (err) {
      setError('Error al exportar historial');
    } finally {
      setExporting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const customerName = customer?.nombre_razon_social || '...';

  if (loading && !customer) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="text" width={400} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Container>
    );
  }

  if (error && !customer) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/customers/${id}`)}>
          Volver al perfil
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* CA-1: Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">
          Inicio
        </Link>
        <Link component={RouterLink} to="/customers" underline="hover" color="inherit">
          Clientes
        </Link>
        <Link component={RouterLink} to={`/customers/${id}`} underline="hover" color="inherit">
          {customerName}
        </Link>
        <Typography color="text.primary">Historial de Compras</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/customers/${id}`)}>
            Volver al perfil
          </Button>
          <Typography variant="h5" fontWeight="bold">
            Historial de Compras
          </Typography>
          {customerName !== '...' && (
            <Typography variant="h6" color="text.secondary">
              — {customerName}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Recargar datos">
            <IconButton onClick={loadHistory} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          {/* CA-10: Exportar */}
          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={exporting || loading || pagination.total === 0}
          >
            Exportar
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleExport('csv')}>Exportar CSV</MenuItem>
            <MenuItem onClick={() => handleExport('excel')}>Exportar Excel (.xlsx)</MenuItem>
          </Menu>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* CA-3: Panel de métricas */}
      {metrics && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            Estadísticas del Período
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<ShoppingBagIcon sx={{ fontSize: 28 }} />}
                value={metrics.total_orders}
                label="Total de pedidos"
                color="primary"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<AttachMoneyIcon sx={{ fontSize: 28 }} />}
                value={formatCurrency(metrics.total_spent)}
                label="Total gastado"
                color="success"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
                value={formatCurrency(metrics.average_order)}
                label="Promedio de compra"
                color="info"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<ScheduleIcon sx={{ fontSize: 28 }} />}
                value={`${metrics.frequency_per_month.toFixed(1)}/mes`}
                label="Frecuencia de compra"
                color="secondary"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<ArrowUpwardIcon sx={{ fontSize: 28 }} />}
                value={formatCurrency(metrics.highest_ticket)}
                label="Ticket más alto"
                color="warning"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<ArrowDownwardIcon sx={{ fontSize: 28 }} />}
                value={formatCurrency(metrics.lowest_ticket)}
                label="Ticket más bajo"
                color="error"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* CA-4 + CA-5 + CA-6: Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="primary" />
          Filtros
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          {/* CA-4: Rango de fechas */}
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle2" gutterBottom>
              Rango de Fechas
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                label="Desde"
                type="date"
                size="small"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Hasta"
                type="date"
                size="small"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {DATE_SHORTCUTS.map((s) => (
                <Chip
                  key={s.label}
                  label={s.label}
                  size="small"
                  onClick={() => handleDateShortcut(s)}
                  variant={dateFrom === s.from && dateTo === s.to ? 'filled' : 'outlined'}
                  color={dateFrom === s.from && dateTo === s.to ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Grid>

          {/* CA-5: Estado del pedido */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Estado del Pedido
            </Typography>
            <FormGroup row>
              {ORDER_STATUSES.map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                    />
                  }
                  label={
                    <Chip
                      label={status}
                      color={STATUS_COLORS[status] || 'default'}
                      size="small"
                      variant={selectedStatuses.includes(status) ? 'filled' : 'outlined'}
                    />
                  }
                  sx={{ mr: 1 }}
                />
              ))}
            </FormGroup>
          </Grid>

          {/* CA-6: Estado de pago */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              Estado de Pago
            </Typography>
            <FormGroup>
              {PAYMENT_STATUSES.map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedPaymentStatuses.includes(status)}
                      onChange={() => handlePaymentToggle(status)}
                    />
                  }
                  label={status}
                />
              ))}
            </FormGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* CA-2: Tabla de pedidos */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Pedidos
            {!loading && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({pagination.total} {pagination.total === 1 ? 'pedido' : 'pedidos'})
              </Typography>
            )}
          </Typography>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ p: 3 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ShoppingBagIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              No se encontraron pedidos con los filtros aplicados
            </Typography>
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSelectedStatuses(DEFAULT_STATUSES);
                setSelectedPaymentStatuses(PAYMENT_STATUSES);
                setPage(0);
              }}
            >
              Limpiar filtros
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell padding="checkbox" />
                    <TableCell>Número de Pedido</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Productos</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Estado de Pago</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      expanded={expandedRows.has(order.id)}
                      onToggle={() => handleRowToggle(order.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={pagination.total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Pedidos por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
          </>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* CA-8: Productos más comprados */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Productos Más Comprados
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {topProducts.length === 0 ? (
              <Alert severity="info">No hay datos de productos para mostrar</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell align="right">Cant. Total</TableCell>
                    <TableCell align="right">Pedidos</TableCell>
                    <TableCell>Último</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts.map((product, index) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={index === 0 ? 'bold' : 'normal'}>
                          {product.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {product.sku}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={product.total_qty} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{product.times_ordered}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeDate(product.last_ordered)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>

        {/* CA-9: Gráfico de compras en el tiempo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Compras en el Tiempo
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {chartData.length < 3 ? (
              <Alert severity="info">
                Se necesitan al menos 3 períodos de datos para mostrar el gráfico
                {chartData.length > 0 && ` (actualmente ${chartData.length})`}.
              </Alert>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) =>
                      new Intl.NumberFormat('es-CO', {
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(v)
                    }
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    formatter={(value) => [formatCurrency(value), 'Total']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="total" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
