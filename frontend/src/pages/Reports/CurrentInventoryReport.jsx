/**
 * CurrentInventoryReport – Reporte de Inventario Actual
 * US-REP-006: Reporte de Inventario Actual
 *
 * CA-1: SKU, nombre, categoría, stock actual, valor en inventario por producto
 * CA-2: Valor total del inventario
 * CA-3: Filtro por categoría y estado de stock (normal, bajo, sin stock)
 * CA-4: Ordenar por nombre, stock o valor
 * CA-5: Gráfico de distribución de inventario por categoría
 * CA-6: Se destacan productos con stock bajo o sin stock
 * CA-7: Exportación a Excel/CSV con fecha de generación
 * CA-8: Timestamp del reporte
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
import { alpha } from '@mui/material/styles';
import {
  Home as HomeIcon,
  Assessment as ReportIcon,
  AttachMoney as ValueIcon,
  Inventory as ProductsIcon,
  Warning as WarningIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import reportService from '../../services/reportService';
import categoryService from '../../services/categoryService';

const STOCK_STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'normal', label: 'Normal' },
  { value: 'low_stock', label: 'Stock Bajo' },
  { value: 'out_of_stock', label: 'Sin Stock' },
];

const STATUS_LABELS = { normal: 'Normal', low_stock: 'Stock Bajo', out_of_stock: 'Sin Stock' };
const STATUS_COLORS = { normal: 'success', low_stock: 'warning', out_of_stock: 'error' };

const SORT_OPTIONS = [
  { value: 'name', label: 'Nombre' },
  { value: 'stock', label: 'Stock' },
  { value: 'value', label: 'Valor' },
];

const PIE_COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1', '#d32f2f', '#5d4037'];

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

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

const CurrentInventoryReport = () => {
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');

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
    const params = { sort_by: sortBy };
    if (categoryId) params.category_id = categoryId;
    if (stockStatus) params.stock_status = stockStatus;
    return params;
  }, [sortBy, categoryId, stockStatus]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getCurrentInventoryReport(buildParams());
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el reporte de inventario');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      await reportService.exportCurrentInventoryReport(buildParams(), format);
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
          Reporte de Inventario Actual
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Reporte de Inventario Actual</Typography>
          {/* CA-8: Timestamp del reporte */}
          <Typography variant="body2" color="text.secondary">
            {report?.generated_at
              ? `Generado: ${new Date(report.generated_at).toLocaleString('es-CO')}`
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

      {/* CA-3/CA-4: Filtros de categoría, estado de stock y orden */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={4} md="auto">
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
          <Grid item xs={6} sm={4} md="auto">
            <TextField
              select
              label="Estado de stock"
              size="small"
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {STOCK_STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4} md="auto">
            <TextField
              select
              label="Ordenar por"
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* CA-2/CA-6: Métricas principales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<ValueIcon sx={{ fontSize: 28 }} />}
            value={formatCurrency(report?.total_value)}
            label="Valor Total del Inventario"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<ProductsIcon sx={{ fontSize: 28 }} />}
            value={report?.total_products ?? 0}
            label="Productos"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<WarningIcon sx={{ fontSize: 28 }} />}
            value={report?.status_counts?.low_stock ?? 0}
            label="Stock Bajo"
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<WarningIcon sx={{ fontSize: 28 }} />}
            value={report?.status_counts?.out_of_stock ?? 0}
            label="Sin Stock"
            color="error"
          />
        </Grid>
      </Grid>

      {/* CA-5: Distribución de inventario por categoría */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Distribución de Valor por Categoría</Typography>
        <Divider sx={{ mb: 2 }} />
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={report?.category_distribution || []}
              dataKey="total_value"
              nameKey="category_name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(entry) => `${entry.category_name}: ${entry.percentage}%`}
            >
              {(report?.category_distribution || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* CA-1: Tabla de productos */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Productos
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
                <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Stock Actual</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Valor en Inventario</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (report?.products?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay productos que coincidan con los filtros</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.products.map((p) => (
                  <TableRow
                    key={p.product_id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      bgcolor: (theme) => p.stock_status === 'out_of_stock'
                        ? alpha(theme.palette.error.main, 0.08)
                        : p.stock_status === 'low_stock'
                          ? alpha(theme.palette.warning.main, 0.08)
                          : 'inherit',
                    }}
                    onClick={() => navigate(`/products/${p.product_id}`)}
                  >
                    <TableCell>{p.sku}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.category_name}</TableCell>
                    <TableCell align="right">{p.stock_quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(p.item_value)}</TableCell>
                    <TableCell>
                      <Chip label={STATUS_LABELS[p.stock_status]} size="small" color={STATUS_COLORS[p.stock_status]} variant="outlined" />
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

export default CurrentInventoryReport;
