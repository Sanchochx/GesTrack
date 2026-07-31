/**
 * ProfitMarginReport – Análisis de Márgenes de Ganancia
 * US-REP-005: Análisis de Márgenes de Ganancia
 *
 * CA-1: Precio costo, precio venta, margen (% y $), unidades vendidas por producto
 * CA-2: Ganancia total por producto (margen $ × unidades vendidas)
 * CA-3: Ordenar por margen %, margen $ o ganancia total
 * CA-4: Código de colores: verde (alto), amarillo (medio), rojo (bajo)
 * CA-5: Gráfico de distribución de productos por rango de margen
 * CA-6: Filtro por categoría
 * CA-7: Filtro por rango de fechas (unidades vendidas del período)
 * CA-8: Margen promedio general
 * CA-9: Exportación a Excel
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
} from '@mui/material';
import {
  Home as HomeIcon,
  Assessment as ReportIcon,
  Percent as MarginIcon,
  AttachMoney as ProfitIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import reportService from '../../services/reportService';
import categoryService from '../../services/categoryService';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Histórico' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'custom', label: 'Personalizado' },
];

const SORT_OPTIONS = [
  { value: 'margin_pct', label: 'Margen %' },
  { value: 'margin_dollar', label: 'Margen $' },
  { value: 'total_profit', label: 'Ganancia Total' },
];

const COLOR_MAP = {
  rojo: { hex: '#d32f2f', chip: 'error', label: 'Bajo' },
  amarillo: { hex: '#ed6c02', chip: 'warning', label: 'Medio' },
  verde: { hex: '#2e7d32', chip: 'success', label: 'Alto' },
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

const ProfitMarginReport = () => {
  const navigate = useNavigate();

  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState(daysAgo(29));
  const [endDate, setEndDate] = useState(today());
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState('margin_pct');

  const [categories, setCategories] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

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
    return params;
  }, [period, sortBy, startDate, endDate, categoryId]);

  const fetchReport = useCallback(async () => {
    if (period === 'custom' && (!startDate || !endDate)) return;
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getProfitMarginReport(buildParams());
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el análisis de márgenes');
    } finally {
      setLoading(false);
    }
  }, [buildParams, period, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportService.exportProfitMarginReport(buildParams());
    } catch (err) {
      setError(err?.error?.message || 'Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  const distributionData = (report?.margin_distribution || []).map((d) => ({
    name: d.range,
    value: d.count,
    color: COLOR_MAP[d.color]?.hex || '#999',
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/dashboard')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          Inicio
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ReportIcon fontSize="small" />
          Análisis de Márgenes de Ganancia
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Análisis de Márgenes de Ganancia</Typography>
          <Typography variant="body2" color="text.secondary">
            {report?.period === 'all'
              ? 'Catálogo completo de productos activos'
              : report?.start_date && report?.end_date
                ? `Unidades vendidas: ${new Date(`${report.start_date}T00:00:00`).toLocaleDateString('es-CO')} - ${new Date(`${report.end_date}T00:00:00`).toLocaleDateString('es-CO')}`
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
            disabled={exporting || !report?.products?.length}
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

      {/* CA-6/CA-7: Filtros de período, categoría y orden */}
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
              sx={{ minWidth: 160 }}
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
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<MarginIcon sx={{ fontSize: 28 }} />}
            value={`${report?.average_margin_pct ?? 0}%`}
            label="Margen Promedio General"
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<ProfitIcon sx={{ fontSize: 28 }} />}
            value={formatCurrency((report?.products || []).reduce((sum, p) => sum + p.total_profit, 0))}
            label="Ganancia Total"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            icon={<ReportIcon sx={{ fontSize: 28 }} />}
            value={report?.products?.length ?? 0}
            label="Productos Analizados"
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* CA-5: Distribución de productos por rango de margen */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Distribución de Productos por Rango de Margen</Typography>
        <Divider sx={{ mb: 2 }} />
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={distributionData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(entry) => `${entry.name}: ${entry.value}`}
            >
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* CA-1/CA-2/CA-3/CA-4: Tabla de productos con margen */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Márgenes por Producto
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
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio Costo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio Venta</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Margen</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Unidades Vendidas</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Ganancia Total</TableCell>
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
                    <Typography color="text.secondary">No hay productos para analizar</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.products.map((p) => (
                  <TableRow key={p.product_id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${p.product_id}`)}>
                    <TableCell>{p.product_name}</TableCell>
                    <TableCell>{p.product_sku}</TableCell>
                    <TableCell>{p.category_name || '-'}</TableCell>
                    <TableCell align="right">{formatCurrency(p.cost_price)}</TableCell>
                    <TableCell align="right">{formatCurrency(p.sale_price)}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${p.margin_pct}% (${formatCurrency(p.margin_dollar)})`}
                        size="small"
                        color={COLOR_MAP[p.margin_color]?.chip || 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">{p.units_sold}</TableCell>
                    <TableCell align="right">{formatCurrency(p.total_profit)}</TableCell>
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

export default ProfitMarginReport;
