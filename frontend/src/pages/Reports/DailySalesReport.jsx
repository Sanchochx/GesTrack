/**
 * DailySalesReport – Reporte de Ventas Diarias
 * US-REP-002: Reporte de Ventas Diarias
 *
 * CA-1: Total de ventas del día, cantidad de pedidos, ticket promedio
 * CA-2: Detalle de pedidos del día (número, cliente, total, estado)
 * CA-3: Comparación con promedio diario del mes
 * CA-4: Gráfico de ventas por hora del día
 * CA-5: Filtro por estado de pedido
 * CA-6: Exportación a PDF/Excel
 * CA-7: Actualización automática cada 5 minutos
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
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  Remove as FlatIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import reportService from '../../services/reportService';
import usePolling from '../../hooks/usePolling';

const ORDER_STATUSES = ['Pendiente', 'Confirmado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];

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

const formatTime = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

function MetricCard({ icon, value, label, color = 'primary', trend }) {
  const trendPositive = trend > 0;
  const trendNeutral = trend === null || trend === undefined || trend === 0;
  const trendIcon = trendNeutral ? <FlatIcon sx={{ fontSize: 14 }} /> :
    trendPositive ? <UpIcon sx={{ fontSize: 14 }} /> : <DownIcon sx={{ fontSize: 14 }} />;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
        <Box sx={{ color: `${color}.main`, mb: 1 }}>{icon}</Box>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: trend !== undefined ? 1 : 0 }}>
          {label}
        </Typography>
        {trend !== undefined && trend !== null && (
          <Chip
            icon={trendIcon}
            label={`${trend >= 0 ? '+' : ''}${trend}% vs promedio mensual`}
            size="small"
            color={trendNeutral ? 'default' : trendPositive ? 'success' : 'error'}
            sx={{ fontWeight: 600, fontSize: 11 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

const DailySalesReport = () => {
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (status) params.status = status;
      const response = await reportService.getDailySalesReport(params);
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el reporte de ventas diarias');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchReport(); }, [fetchReport]);
  // CA-7: Actualización automática cada 5 minutos
  usePolling(fetchReport, 5 * 60 * 1000);

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      const filters = { date: report?.date };
      if (status) filters.status = status;
      await reportService.exportDailySalesReport(filters, format);
    } catch (err) {
      setError(err?.error?.message || 'Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
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
          Reporte de Ventas Diarias
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Ventas del Día</Typography>
          <Typography variant="body2" color="text.secondary">
            {report?.date ? new Date(`${report.date}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
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

      {/* CA-1/CA-3: Métricas principales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<RevenueIcon sx={{ fontSize: 28 }} />}
            value={formatCurrency(report?.total_sales)}
            label="Total de Ventas"
            color="success"
            trend={report?.comparison_vs_monthly_average_pct}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<OrdersIcon sx={{ fontSize: 28 }} />}
            value={report?.order_count ?? 0}
            label="Cantidad de Pedidos"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<TicketIcon sx={{ fontSize: 28 }} />}
            value={formatCurrency(report?.average_ticket)}
            label="Ticket Promedio"
            color="info"
          />
        </Grid>
      </Grid>

      {/* CA-5: Filtro por estado */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          select
          label="Filtrar por estado"
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todos (excepto Cancelado)</MenuItem>
          {ORDER_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
      </Paper>

      {/* CA-4: Ventas por hora */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Ventas por Hora</Typography>
        <Divider sx={{ mb: 2 }} />
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={report?.hourly_breakdown || []} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip
              formatter={(value, name) => [name === 'total' ? formatCurrency(value) : value, name === 'total' ? 'Ventas' : 'Pedidos']}
              labelFormatter={(h) => `${h}:00 - ${h}:59`}
            />
            <Bar dataKey="total" fill="#2e7d32" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* CA-2: Detalle de pedidos del día */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Pedidos del Día
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
                <TableCell sx={{ fontWeight: 'bold' }}>Hora</TableCell>
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
                    <Typography color="text.secondary">No hay pedidos registrados para este día</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.orders.map((order) => (
                  <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order.id}`)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary">{order.order_number}</Typography>
                    </TableCell>
                    <TableCell>{order.customer_name || '-'}</TableCell>
                    <TableCell>{formatTime(order.created_at)}</TableCell>
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

export default DailySalesReport;
