/**
 * SupplierPurchaseHistory - Historial de órdenes de compra de un proveedor
 * US-SUPP-012: Historial de Órdenes por Proveedor
 *
 * CA-1: Acceso desde el perfil del proveedor
 * CA-2: Órdenes ordenadas por fecha (más reciente primero)
 * CA-3: Número, fecha, productos, total, estado por orden
 * CA-4: Total de compras al proveedor
 * CA-5: Tasa de cumplimiento (órdenes a tiempo vs total)
 * CA-6: Filtro por rango de fechas
 * CA-7: Filtro por estado
 * CA-8: Exportación a CSV/Excel
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
  Breadcrumbs,
  Link,
  Alert,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Menu,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  LocalShipping as SuppliersIcon,
  ShoppingBag as ShoppingBagIcon,
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  FileDownload as FileDownloadIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import supplierService from '../../services/supplierService';
import { PURCHASE_ORDER_STATUS_COLORS } from '../PurchaseOrders/PurchaseOrderList';

const PURCHASE_ORDER_STATUSES = ['Pendiente', 'Confirmada', 'En Tránsito', 'Recibida', 'Cancelada'];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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

export default function SupplierPurchaseHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplierName, setSupplierName] = useState('');
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  // CA-6: Filtro por rango de fechas
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // CA-7: Filtro por estado
  const [status, setStatus] = useState('');

  const [exporting, setExporting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
        sort_order: 'desc',
      };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (status) params.status = status;

      const [historyResponse, supplierResponse] = await Promise.all([
        supplierService.getSupplierPurchaseHistory(id, params),
        supplierName ? Promise.resolve(null) : supplierService.getSupplier(id),
      ]);

      setOrders(historyResponse.data || []);
      setTotal(historyResponse.pagination?.total || 0);
      setMetrics(historyResponse.metrics || null);
      if (supplierResponse?.success) {
        setSupplierName(supplierResponse.data.company_name);
      }
    } catch (err) {
      setError(err?.error?.message || 'Error al cargar el historial de órdenes');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, rowsPerPage, dateFrom, dateTo, status]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      const filters = {};
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      if (status) filters.status = status;
      await supplierService.exportSupplierPurchaseHistory(id, filters, format);
    } catch (err) {
      setError(err?.error?.message || 'Error al exportar el historial');
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatus('');
    setPage(0);
  };

  if (loading && orders.length === 0 && !metrics) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="text" width={400} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* CA-1: Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Inicio
        </Link>
        <Link component={RouterLink} to="/suppliers" underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
          <SuppliersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Proveedores
        </Link>
        <Link component={RouterLink} to={`/suppliers/${id}`} underline="hover" color="inherit">
          {supplierName || '...'}
        </Link>
        <Typography color="text.primary">Historial de Órdenes</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/suppliers/${id}`)}>
            Volver al perfil
          </Button>
          <Typography variant="h5" fontWeight="bold">
            Historial de Órdenes {supplierName && `— ${supplierName}`}
          </Typography>
        </Box>
        {/* CA-8: Exportar */}
        <Box>
          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={exporting || total === 0}
          >
            Exportar
          </Button>
          <Menu anchorEl={exportMenuAnchor} open={Boolean(exportMenuAnchor)} onClose={() => setExportMenuAnchor(null)}>
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

      {/* CA-4/CA-5: Panel de métricas */}
      {metrics && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <MetricCard
                icon={<ShoppingBagIcon sx={{ fontSize: 28 }} />}
                value={metrics.total_orders}
                label="Total de órdenes"
                color="primary"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard
                icon={<AttachMoneyIcon sx={{ fontSize: 28 }} />}
                value={formatCurrency(metrics.total_purchases)}
                label="Total de compras"
                color="success"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard
                icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
                value={metrics.fulfillment_rate !== null ? `${metrics.fulfillment_rate}%` : 'Sin datos'}
                label="Tasa de cumplimiento"
                color="info"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard
                icon={<AccessTimeIcon sx={{ fontSize: 28 }} />}
                value={metrics.last_order_date ? formatDate(metrics.last_order_date) : 'Sin órdenes'}
                label="Última orden"
                color="warning"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* CA-6/CA-7: Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="primary" />
          Filtros
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              label="Desde"
              type="date"
              size="small"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Hasta"
              type="date"
              size="small"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              label="Estado"
              size="small"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              fullWidth
            >
              <MenuItem value="">Todos</MenuItem>
              {PURCHASE_ORDER_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button onClick={handleClearFilters} disabled={!dateFrom && !dateTo && !status}>
              Limpiar filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* CA-2/CA-3: Tabla de órdenes */}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Productos</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Entrega Estimada</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton animation="wave" height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                      <ShoppingBagIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary" variant="body1">
                        No hay órdenes de compra con los filtros aplicados
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/purchase-orders/${order.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{formatDate(order.created_at)}</Typography>
                    </TableCell>
                    <TableCell align="center">{order.items_count}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.expected_delivery_date)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">{formatCurrency(order.total)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size="small"
                        sx={{
                          bgcolor: PURCHASE_ORDER_STATUS_COLORS[order.status] || '#9E9E9E',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>
    </Container>
  );
}
