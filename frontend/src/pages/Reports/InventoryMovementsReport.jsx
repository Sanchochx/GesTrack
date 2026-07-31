/**
 * InventoryMovementsReport – Reporte de Movimientos de Inventario
 * US-REP-007: Reporte de Movimientos de Inventario
 *
 * CA-1: Selección de rango de fechas
 * CA-2: Fecha/hora, producto, tipo de movimiento, cantidad, usuario por movimiento
 * CA-3: Filtro por producto, tipo de movimiento, usuario
 * CA-4: Resumen de total de entradas, total de salidas, balance neto
 * CA-5: Filtro por categoría de producto
 * CA-6: Gráfico de entradas vs salidas en el período
 * CA-7: Exportación a Excel/CSV
 * CA-8: Movimientos ordenados cronológicamente
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
  ArrowUpward as InIcon,
  ArrowDownward as OutIcon,
  Balance as BalanceIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import reportService from '../../services/reportService';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';
import authService from '../../services/authService';

const MOVEMENT_TYPES = [
  'Stock Inicial',
  'Entrada',
  'Salida',
  'Venta',
  'Compra',
  'Ajuste Manual',
  'Devolución',
  'Reserva de Orden',
  'Cancelación de Orden',
];

const MOVEMENT_TYPE_COLORS = {
  Entrada: 'success',
  Compra: 'success',
  'Stock Inicial': 'info',
  Salida: 'error',
  Venta: 'error',
  'Ajuste Manual': 'warning',
  Devolución: 'secondary',
};

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

const InventoryMovementsReport = () => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(daysAgo(29));
  const [endDate, setEndDate] = useState(today());
  const [productId, setProductId] = useState('');
  const [movementType, setMovementType] = useState('');
  const [userId, setUserId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  useEffect(() => {
    Promise.all([
      productService.getProducts({ limit: 100 }),
      authService.getUsers(),
      categoryService.getCategories(),
    ]).then(([productsRes, usersRes, categoriesRes]) => {
      if (productsRes.success) setProducts(productsRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
      if (categoriesRes.success) setCategories(categoriesRes.data || []);
    }).catch(() => {});
  }, []);

  const buildParams = useCallback(() => {
    const params = { start_date: startDate, end_date: endDate };
    if (productId) params.product_id = productId;
    if (movementType) params.movement_type = movementType;
    if (userId) params.user_id = userId;
    if (categoryId) params.category_id = categoryId;
    return params;
  }, [startDate, endDate, productId, movementType, userId, categoryId]);

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getInventoryMovementsReport(buildParams());
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el reporte de movimientos');
    } finally {
      setLoading(false);
    }
  }, [buildParams, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      await reportService.exportInventoryMovementsReport(buildParams(), format);
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
          Movimientos de Inventario
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Reporte de Movimientos de Inventario</Typography>
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
            disabled={exporting || !report?.movements?.length}
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

      {/* CA-1/CA-3/CA-5: Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
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
          <Grid item xs={6} sm={3} md="auto">
            <TextField
              select
              label="Producto"
              size="small"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos los productos</MenuItem>
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md="auto">
            <TextField
              select
              label="Tipo de movimiento"
              size="small"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos los tipos</MenuItem>
              {MOVEMENT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md="auto">
            <TextField
              select
              label="Usuario"
              size="small"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos los usuarios</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.full_name}</MenuItem>
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

      {/* CA-4: Resumen de entradas, salidas y balance neto */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<InIcon sx={{ fontSize: 28 }} />}
            value={report?.summary?.total_in ?? 0}
            label="Total de Entradas"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<OutIcon sx={{ fontSize: 28 }} />}
            value={report?.summary?.total_out ?? 0}
            label="Total de Salidas"
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<BalanceIcon sx={{ fontSize: 28 }} />}
            value={report?.summary?.net_balance ?? 0}
            label="Balance Neto"
            color={report?.summary?.net_balance >= 0 ? 'success' : 'error'}
          />
        </Grid>
      </Grid>

      {/* CA-6: Gráfico de entradas vs salidas por día */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Entradas vs Salidas por Día</Typography>
        <Divider sx={{ mb: 2 }} />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={report?.daily_evolution || []} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip />
            <Legend />
            <Bar dataKey="in" name="Entradas" fill="#2e7d32" radius={[4, 4, 0, 0]} />
            <Bar dataKey="out" name="Salidas" fill="#d32f2f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* CA-2/CA-8: Tabla de movimientos ordenados cronológicamente */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Movimientos
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({report?.movements?.length ?? 0})
            </Typography>
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha y Hora</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Stock Resultante</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
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
              ) : (report?.movements?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay movimientos en este período</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.movements.map((m) => (
                  <TableRow key={m.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${m.product_id}`)}>
                    <TableCell>{new Date(m.created_at).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell>{m.product_name} <Typography component="span" variant="caption" color="text.secondary">({m.product_sku})</Typography></TableCell>
                    <TableCell>
                      <Chip label={m.movement_type} size="small" color={MOVEMENT_TYPE_COLORS[m.movement_type] || 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</TableCell>
                    <TableCell align="right">{m.new_stock}</TableCell>
                    <TableCell>{m.user_name}</TableCell>
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

export default InventoryMovementsReport;
