/**
 * SalesBySellerReport – Desempeño de Ventas por Vendedor
 * US-REP-009: Reporte de Desempeño de Ventas por Vendedor
 *
 * CA-1: Cantidad de pedidos, monto total vendido, ticket promedio por vendedor
 * CA-2: Filtro por período de tiempo
 * CA-3: Porcentaje de participación de cada vendedor en las ventas totales
 * CA-4: Gráfico comparativo entre vendedores
 * CA-5: Top productos vendidos por cada vendedor
 * CA-6: Detalle de pedidos por vendedor
 * CA-7: Tasa de conversión (pedidos confirmados vs pendientes)
 * CA-8: Exportación a PDF/Excel
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
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  Home as HomeIcon,
  Assessment as ReportIcon,
  AttachMoney as RevenueIcon,
  ShoppingCart as OrdersIcon,
  Receipt as TicketIcon,
  TrendingUp as ConversionIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import reportService from '../../services/reportService';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Histórico' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'custom', label: 'Personalizado' },
];

const STATUS_COLORS = {
  Pendiente: 'warning',
  Confirmado: 'info',
  Procesando: 'info',
  Enviado: 'primary',
  Entregado: 'success',
  Cancelado: 'error',
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

function MetricCard({ icon, value, label, color = 'primary' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
        <Box sx={{ color: `${color}.main`, mb: 1 }}>{icon}</Box>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
}

function SellerRow({ seller, navigate }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen((v) => !v)}>
            {open ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>{seller.seller_name}</TableCell>
        <TableCell align="right">{seller.order_count}</TableCell>
        <TableCell align="right">{formatCurrency(seller.total_sales)}</TableCell>
        <TableCell align="right">{formatCurrency(seller.average_ticket)}</TableCell>
        <TableCell align="right">{seller.sales_percentage}%</TableCell>
        <TableCell align="right">
          {seller.conversion_rate !== null ? `${seller.conversion_rate}%` : '—'}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              {/* CA-5: Top productos vendidos por este vendedor */}
              <Typography variant="subtitle2" gutterBottom>Top Productos Vendidos</Typography>
              {seller.top_products.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Sin ventas de productos</Typography>
              ) : (
                <Table size="small" sx={{ mb: 2, bgcolor: 'background.paper' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Ingresos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {seller.top_products.map((p) => (
                      <TableRow key={p.product_id}>
                        <TableCell>{p.product_name}</TableCell>
                        <TableCell align="right">{p.quantity_sold}</TableCell>
                        <TableCell align="right">{formatCurrency(p.total_revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* CA-6: Detalle de pedidos del vendedor */}
              <Typography variant="subtitle2" gutterBottom>Pedidos ({seller.orders.length})</Typography>
              <Table size="small" sx={{ bgcolor: 'background.paper' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seller.orders.map((o) => (
                    <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${o.id}`)}>
                      <TableCell>
                        <Typography variant="body2" color="primary">{o.order_number}</Typography>
                      </TableCell>
                      <TableCell>{o.customer_name || '-'}</TableCell>
                      <TableCell>{new Date(o.created_at).toLocaleDateString('es-CO')}</TableCell>
                      <TableCell align="right">{formatCurrency(o.total)}</TableCell>
                      <TableCell>
                        <Chip label={o.status} size="small" color={STATUS_COLORS[o.status] || 'default'} variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

const SalesBySellerReport = () => {
  const navigate = useNavigate();

  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState(daysAgo(29));
  const [endDate, setEndDate] = useState(today());

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const buildParams = useCallback(() => {
    const params = { period };
    if (period === 'custom') {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    return params;
  }, [period, startDate, endDate]);

  const fetchReport = useCallback(async () => {
    if (period === 'custom' && (!startDate || !endDate)) return;
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getSalesBySellerReport(buildParams());
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el reporte de desempeño por vendedor');
    } finally {
      setLoading(false);
    }
  }, [buildParams, period, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportService.exportSalesBySellerReport(buildParams());
    } catch (err) {
      setError(err?.error?.message || 'Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  const bestConversion = (report?.sellers || []).reduce(
    (best, s) => (s.conversion_rate !== null && (best === null || s.conversion_rate > best) ? s.conversion_rate : best),
    null
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/dashboard')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          Inicio
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ReportIcon fontSize="small" />
          Desempeño de Ventas por Vendedor
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Desempeño de Ventas por Vendedor</Typography>
          <Typography variant="body2" color="text.secondary">
            {report?.period === 'all'
              ? 'Histórico completo'
              : report?.start_date && report?.end_date
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
            onClick={handleExport}
            disabled={exporting || !report?.sellers?.length}
          >
            Exportar a Excel
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* CA-2: Filtro de período */}
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
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<RevenueIcon sx={{ fontSize: 28 }} />}
            value={formatCurrency(report?.total_sales)}
            label="Ventas Totales del Equipo"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<OrdersIcon sx={{ fontSize: 28 }} />}
            value={report?.sellers?.length ?? 0}
            label="Vendedores con Actividad"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<ConversionIcon sx={{ fontSize: 28 }} />}
            value={bestConversion !== null ? `${bestConversion}%` : '—'}
            label="Mejor Tasa de Conversión"
            color="info"
          />
        </Grid>
      </Grid>

      {/* CA-4: Gráfico comparativo entre vendedores */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Comparativo de Ventas por Vendedor</Typography>
        <Divider sx={{ mb: 2 }} />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={report?.sellers || []} margin={{ top: 4, right: 8, left: 8, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="seller_name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip formatter={(value) => formatCurrency(value)} />
            <Bar dataKey="total_sales" name="Ventas" fill="#1976d2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* CA-1/CA-3/CA-5/CA-6/CA-7: Tabla de desempeño por vendedor */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Vendedores
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({report?.sellers?.length ?? 0})
            </Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <TicketIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
            Haz clic en una fila para ver el detalle de productos y pedidos
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell />
                <TableCell sx={{ fontWeight: 'bold' }}>Vendedor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Pedidos</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total Vendido</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Ticket Promedio</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">% Participación</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Tasa de Conversión</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (report?.sellers?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay ventas registradas en este período</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.sellers.map((s) => (
                  <SellerRow key={s.seller_id} seller={s} navigate={navigate} />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default SalesBySellerReport;
