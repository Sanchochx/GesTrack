/**
 * SalesByPeriodReport – Reporte de Ventas por Período
 * US-REP-003: Reporte de Ventas por Período
 *
 * CA-1: Selección de período: diario, semanal, mensual, personalizado (rango de fechas)
 * CA-2: Total de ventas, cantidad de pedidos, ticket promedio, productos vendidos
 * CA-3: Gráfico de evolución de ventas en el período
 * CA-4: Comparación con período anterior
 * CA-5: Agrupación por día, semana o mes
 * CA-6: Top 10 productos más vendidos en el período
 * CA-7: Exportación a PDF/Excel/CSV
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Skeleton,
  Divider,
  TextField,
  MenuItem,
  Menu,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Home as HomeIcon,
  Assessment as ReportIcon,
  AttachMoney as RevenueIcon,
  ShoppingCart as OrdersIcon,
  Receipt as TicketIcon,
  Inventory as ProductsIcon,
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  Remove as FlatIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import reportService from '../../services/reportService';

const ORDER_STATUSES = ['Pendiente', 'Confirmado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];

const STATUS_COLORS = {
  Pendiente: 'warning',
  Confirmado: 'info',
  Procesando: 'info',
  Enviado: 'primary',
  Entregado: 'success',
  Cancelado: 'error',
};

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'custom', label: 'Personalizado' },
];

const GROUP_BY_OPTIONS = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

const formatDateShort = (isoString) => {
  if (!isoString) return '-';
  return new Date(`${isoString}T00:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
};

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

function MetricCard({ icon, value, label, color = 'primary', trend }) {
  const trendNeutral = trend === null || trend === undefined;
  const trendPositive = trend > 0;
  const trendIcon = trendNeutral || trend === 0 ? <FlatIcon sx={{ fontSize: 14 }} /> :
    trendPositive ? <UpIcon sx={{ fontSize: 14 }} /> : <DownIcon sx={{ fontSize: 14 }} />;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
        <Box sx={{ color: `${color}.main`, mb: 1 }}>{icon}</Box>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: trend !== undefined ? 1 : 0 }}>
          {label}
        </Typography>
        {trend !== undefined && (
          <Chip
            icon={trendIcon}
            label={trendNeutral ? 'Sin datos previos' : `${trend >= 0 ? '+' : ''}${trend}% vs período anterior`}
            size="small"
            color={trendNeutral || trend === 0 ? 'default' : trendPositive ? 'success' : 'error'}
            sx={{ fontWeight: 600, fontSize: 11 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

const SalesByPeriodReport = () => {
  const navigate = useNavigate();

  const [period, setPeriod] = useState('weekly');
  const [startDate, setStartDate] = useState(daysAgo(6));
  const [endDate, setEndDate] = useState(today());
  const [groupBy, setGroupBy] = useState('day');
  const [status, setStatus] = useState('');

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  const buildParams = useCallback(() => {
    const params = { period, group_by: groupBy };
    if (period === 'custom') {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    if (status) params.status = status;
    return params;
  }, [period, groupBy, startDate, endDate, status]);

  const fetchReport = useCallback(async () => {
    if (period === 'custom' && (!startDate || !endDate)) return;
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getSalesByPeriodReport(buildParams());
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el reporte de ventas por período');
    } finally {
      setLoading(false);
    }
  }, [buildParams, period, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      await reportService.exportSalesByPeriodReport(buildParams(), format);
    } catch (err) {
      setError(err?.error?.message || 'Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  const evolutionLabel = (p) => {
    if (!p) return '';
    if (groupBy === 'month') return p;
    return formatDateShort(p);
  };

  if (loading && !report) {
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
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/dashboard')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          Inicio
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ReportIcon fontSize="small" />
          Reporte de Ventas por Período
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Ventas por Período</Typography>
          <Typography variant="body2" color="text.secondary">
            {report?.start_date && report?.end_date
              ? `${new Date(`${report.start_date}T00:00:00`).toLocaleDateString('es-CO')} - ${new Date(`${report.end_date}T00:00:00`).toLocaleDateString('es-CO')}`
              : '—'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Actualizar">
            <IconButton onClick={fetchReport} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={exporting || !report?.orders?.length}
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

      {/* CA-1/CA-5: Selección de período, rango, agrupación y filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md="auto">
            <ToggleButtonGroup
              value={period}
              exclusive
              size="small"
              onChange={(e, value) => value && setPeriod(value)}
            >
              {PERIOD_OPTIONS.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value}>{opt.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>
          {period === 'custom' && (
            <>
              <Grid item xs={6} sm={3} md="auto">
                <TextField
                  label="Fecha inicio"
                  type="date"
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3} md="auto">
                <TextField
                  label="Fecha fin"
                  type="date"
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={6} sm={3} md="auto">
            <TextField
              select
              label="Agrupar por"
              size="small"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              {GROUP_BY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md="auto">
            <TextField
              select
              label="Filtrar por estado"
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Todos (excepto Cancelado)</MenuItem>
              {ORDER_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* CA-2/CA-4: Métricas principales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<RevenueIcon sx={{ fontSize: 28 }} />}
            value={formatCurrency(report?.total_sales)}
            label="Total de Ventas"
            color="success"
            trend={report?.comparison_vs_previous_period_pct}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<OrdersIcon sx={{ fontSize: 28 }} />}
            value={report?.order_count ?? 0}
            label="Cantidad de Pedidos"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<TicketIcon sx={{ fontSize: 28 }} />}
            value={formatCurrency(report?.average_ticket)}
            label="Ticket Promedio"
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<ProductsIcon sx={{ fontSize: 28 }} />}
            value={report?.products_sold ?? 0}
            label="Productos Vendidos"
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* CA-3: Evolución de ventas */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Evolución de Ventas</Typography>
        <Divider sx={{ mb: 2 }} />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={report?.evolution || []} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="period" tickFormatter={evolutionLabel} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip
              formatter={(value, name) => [name === 'total' ? formatCurrency(value) : value, name === 'total' ? 'Ventas' : 'Pedidos']}
              labelFormatter={evolutionLabel}
            />
            <Line type="monotone" dataKey="total" stroke="#2e7d32" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* CA-6: Top 10 productos más vendidos */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Top 10 Productos Más Vendidos</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Cantidad Vendida</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Ingresos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (report?.top_products?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay ventas de productos en este período</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.top_products.map((p, index) => (
                  <TableRow key={p.product_id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${p.product_id}`)}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{p.product_name}</TableCell>
                    <TableCell>{p.product_sku}</TableCell>
                    <TableCell align="right">{p.quantity_sold}</TableCell>
                    <TableCell align="right">{formatCurrency(p.total_revenue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Detalle de pedidos del período */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Pedidos del Período
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({report?.orders?.length ?? 0})
            </Typography>
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (report?.orders?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay pedidos registrados en este período</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.orders.map((order) => (
                  <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order.id}`)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary">{order.order_number}</Typography>
                    </TableCell>
                    <TableCell>{order.customer_name || '-'}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Chip label={order.status} size="small" color={STATUS_COLORS[order.status] || 'default'} variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default SalesByPeriodReport;
