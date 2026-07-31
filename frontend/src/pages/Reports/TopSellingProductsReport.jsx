/**
 * TopSellingProductsReport – Reporte de Productos Más Vendidos
 * US-REP-004: Productos Más Vendidos
 *
 * CA-1: Ranking de productos por cantidad vendida
 * CA-2: Filtro por período de tiempo
 * CA-3: Nombre, cantidad vendida, ingresos generados, margen de ganancia por producto
 * CA-4: Gráfico de barras de top 10 productos
 * CA-5: Ordenar por cantidad vendida, ingresos o margen
 * CA-6: Filtro por categoría
 * CA-7: Porcentaje de participación en ventas totales
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
  LinearProgress,
} from '@mui/material';
import {
  Home as HomeIcon,
  Assessment as ReportIcon,
  AttachMoney as RevenueIcon,
  Inventory as ProductsIcon,
  EmojiEvents as TrophyIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import reportService from '../../services/reportService';
import categoryService from '../../services/categoryService';

const ORDER_STATUSES = ['Pendiente', 'Confirmado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Histórico' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'custom', label: 'Personalizado' },
];

const SORT_OPTIONS = [
  { value: 'quantity', label: 'Cantidad Vendida' },
  { value: 'revenue', label: 'Ingresos' },
  { value: 'margin', label: 'Margen de Ganancia' },
];

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

const TopSellingProductsReport = () => {
  const navigate = useNavigate();

  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState(daysAgo(29));
  const [endDate, setEndDate] = useState(today());
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState('quantity');
  const [status, setStatus] = useState('');

  const [categories, setCategories] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success) setCategories(res.data || []);
    }).catch(() => {});
  }, []);

  const buildParams = useCallback(() => {
    const params = { period, sort_by: sortBy };
    if (period === 'custom') {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    if (categoryId) params.category_id = categoryId;
    if (status) params.status = status;
    return params;
  }, [period, sortBy, startDate, endDate, categoryId, status]);

  const fetchReport = useCallback(async () => {
    if (period === 'custom' && (!startDate || !endDate)) return;
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getTopSellingProductsReport(buildParams());
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el reporte de productos más vendidos');
    } finally {
      setLoading(false);
    }
  }, [buildParams, period, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      await reportService.exportTopSellingProductsReport(buildParams(), format);
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
          Productos Más Vendidos
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Productos Más Vendidos</Typography>
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
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={exporting || !report?.products?.length}
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

      {/* CA-2/CA-5/CA-6: Filtros de período, orden y categoría */}
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
              label="Ordenar por"
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md="auto">
            <TextField
              select
              label="Categoría"
              size="small"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todas las categorías</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
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

      {/* Métricas principales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<ProductsIcon sx={{ fontSize: 28 }} />}
            value={report?.total_quantity_sold ?? 0}
            label="Unidades Vendidas"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<RevenueIcon sx={{ fontSize: 28 }} />}
            value={formatCurrency(report?.total_revenue)}
            label="Ingresos del Filtro Aplicado"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<TrophyIcon sx={{ fontSize: 28 }} />}
            value={report?.products?.length ?? 0}
            label="Productos con Ventas"
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* CA-4: Gráfico de barras de top 10 productos */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Top 10 Productos (por Cantidad Vendida)</Typography>
        <Divider sx={{ mb: 2 }} />
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={report?.top_10_chart || []} margin={{ top: 4, right: 8, left: 8, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="product_name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip
              formatter={(value) => [value, 'Cantidad Vendida']}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="quantity_sold" fill="#2e7d32" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* CA-1/CA-3/CA-5/CA-7: Ranking completo de productos */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Ranking de Productos
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({report?.products?.length ?? 0})
            </Typography>
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Cantidad Vendida</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Ingresos</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Margen</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">% Participación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (report?.products?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay ventas de productos en este período</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.products.map((p, index) => (
                  <TableRow key={p.product_id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${p.product_id}`)}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{p.product_name}</TableCell>
                    <TableCell>{p.product_sku}</TableCell>
                    <TableCell>{p.category_name || '-'}</TableCell>
                    <TableCell align="right">{p.quantity_sold}</TableCell>
                    <TableCell align="right">{formatCurrency(p.total_revenue)}</TableCell>
                    <TableCell align="right">{p.profit_margin}%</TableCell>
                    <TableCell align="right" sx={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(p.sales_percentage, 100)}
                          sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption">{p.sales_percentage}%</Typography>
                      </Box>
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

export default TopSellingProductsReport;
