/**
 * ReturnsReport – Reporte de Devoluciones
 * US-REP-015: Reporte de Devoluciones
 *
 * CA-1: Fecha, pedido, cliente, productos devueltos, motivo por devolución
 * CA-2: Filtro por rango de fechas
 * CA-3: Tasa de devolución (% de pedidos con devolución)
 * CA-4: Productos con más devoluciones
 * CA-5: Agrupación de devoluciones por motivo
 * CA-6: Impacto económico de devoluciones
 * CA-7: Gráfico de devoluciones por mes
 * CA-8: Exportación a Excel/CSV
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
  AssignmentReturn as ReturnsIcon,
  Percent as RateIcon,
  AttachMoney as ImpactIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import reportService from '../../services/reportService';

const RETURN_STATUSES = ['Pendiente', 'Aprobada', 'Rechazada'];

const STATUS_COLORS = { Pendiente: 'warning', Aprobada: 'success', Rechazada: 'error' };

const REASON_COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1', '#d32f2f'];

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

const today = () => new Date().toISOString().slice(0, 10);
const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
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

const ReturnsReport = () => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(monthsAgo(11));
  const [endDate, setEndDate] = useState(today());
  const [status, setStatus] = useState('');

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  const buildParams = useCallback(() => {
    const params = { start_date: startDate, end_date: endDate };
    if (status) params.status = status;
    return params;
  }, [startDate, endDate, status]);

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getReturnsReport(buildParams());
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el reporte de devoluciones');
    } finally {
      setLoading(false);
    }
  }, [buildParams, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      await reportService.exportReturnsReport(buildParams(), format);
    } catch (err) {
      setError(err?.error?.message || 'Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/dashboard')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          Inicio
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ReportIcon fontSize="small" />
          Reporte de Devoluciones
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Reporte de Devoluciones</Typography>
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
            disabled={exporting || !report?.returns?.length}
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

      {/* CA-2: Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={4} md="auto">
            <TextField
              label="Fecha inicio"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md="auto">
            <TextField
              label="Fecha fin"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md="auto">
            <TextField
              select
              label="Estado"
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos (excepto Rechazada en métricas)</MenuItem>
              {RETURN_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* CA-3/CA-6: Métricas principales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<ReturnsIcon sx={{ fontSize: 28 }} />}
            value={report?.total_returns ?? 0}
            label="Total de Devoluciones"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<RateIcon sx={{ fontSize: 28 }} />}
            value={`${report?.return_rate ?? 0}%`}
            label="Tasa de Devolución"
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<ImpactIcon sx={{ fontSize: 28 }} />}
            value={formatCurrency(report?.total_economic_impact)}
            label="Impacto Económico"
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* CA-7: Gráfico de devoluciones por mes */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Devoluciones por Mes</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={report?.monthly_returns || []} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip formatter={(value, name) => [name === 'count' ? value : formatCurrency(value), name === 'count' ? 'Devoluciones' : 'Monto']} />
                <Bar dataKey="count" name="Devoluciones" fill="#d32f2f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* CA-5: Devoluciones por motivo */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Devoluciones por Motivo</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={report?.returns_by_reason || []}
                  dataKey="count"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.reason}: ${entry.count}`}
                >
                  {(report?.returns_by_reason || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* CA-4: Productos con más devoluciones */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Productos con Más Devoluciones</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Cantidad Devuelta</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Monto</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(report?.top_returned_products?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No hay productos devueltos en este período</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.top_returned_products.map((p, index) => (
                  <TableRow key={p.product_id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${p.product_id}`)}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{p.product_name}</TableCell>
                    <TableCell>{p.product_sku}</TableCell>
                    <TableCell align="right">{p.quantity_returned}</TableCell>
                    <TableCell align="right">{formatCurrency(p.total_amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* CA-1: Listado de devoluciones */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Devoluciones
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({report?.returns?.length ?? 0})
            </Typography>
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pedido</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Productos</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Motivo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Monto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (report?.returns?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay devoluciones registradas en este período</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.returns.map((r) => (
                  <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${r.order_id}`)}>
                    <TableCell>{new Date(r.return_date).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary">{r.order_number}</Typography>
                    </TableCell>
                    <TableCell>{r.customer_name || '-'}</TableCell>
                    <TableCell>{r.products.map((p) => `${p.product_name} x${p.quantity}`).join(', ')}</TableCell>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell align="right">{formatCurrency(r.total_amount)}</TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small" color={STATUS_COLORS[r.status] || 'default'} variant="outlined" />
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

export default ReturnsReport;
