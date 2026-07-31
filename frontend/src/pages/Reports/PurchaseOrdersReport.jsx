/**
 * PurchaseOrdersReport – Reporte de Órdenes de Compra a Proveedores
 * US-REP-012: Reporte de Órdenes de Compra a Proveedores
 *
 * CA-1: Número, proveedor, fecha, monto, estado por orden
 * CA-2: Filtro por proveedor, estado, rango de fechas
 * CA-3: Total de compras en el período
 * CA-4: Distribución de gastos por proveedor
 * CA-5: Tasa de cumplimiento por proveedor (órdenes a tiempo vs total)
 * CA-6: Órdenes atrasadas
 * CA-7: Gráfico de compras por mes
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
  AttachMoney as RevenueIcon,
  LocalShipping as SupplierIcon,
  WarningAmber as OverdueIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import reportService from '../../services/reportService';
import supplierService from '../../services/supplierService';

const PO_STATUSES = ['Pendiente', 'Confirmada', 'En Tránsito', 'Recibida', 'Cancelada'];

const STATUS_COLORS = {
  Pendiente: 'warning',
  Confirmada: 'info',
  'En Tránsito': 'primary',
  Recibida: 'success',
  Cancelada: 'error',
};

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

const PurchaseOrdersReport = () => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(monthsAgo(11));
  const [endDate, setEndDate] = useState(today());
  const [supplierId, setSupplierId] = useState('');
  const [status, setStatus] = useState('');

  const [suppliers, setSuppliers] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  useEffect(() => {
    supplierService.getSuppliers({ per_page: 100 }).then((res) => {
      if (res.success) setSuppliers(res.data || []);
    }).catch(() => {});
  }, []);

  const buildParams = useCallback(() => {
    const params = { start_date: startDate, end_date: endDate };
    if (supplierId) params.supplier_id = supplierId;
    if (status) params.status = status;
    return params;
  }, [startDate, endDate, supplierId, status]);

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getPurchaseOrdersReport(buildParams());
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el reporte de órdenes de compra');
    } finally {
      setLoading(false);
    }
  }, [buildParams, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      await reportService.exportPurchaseOrdersReport(buildParams(), format);
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
          Órdenes de Compra a Proveedores
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Reporte de Órdenes de Compra</Typography>
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

      {/* CA-2: Filtros */}
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
              label="Proveedor"
              size="small"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Todos los proveedores</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.company_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md="auto">
            <TextField
              select
              label="Estado"
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos los estados</MenuItem>
              {PO_STATUSES.map((s) => (
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
            icon={<RevenueIcon sx={{ fontSize: 28 }} />}
            value={formatCurrency(report?.total_purchases)}
            label="Total de Compras"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<SupplierIcon sx={{ fontSize: 28 }} />}
            value={report?.order_count ?? 0}
            label="Órdenes en el Período"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<OverdueIcon sx={{ fontSize: 28 }} />}
            value={report?.overdue_orders?.length ?? 0}
            label="Órdenes Atrasadas"
            color="error"
          />
        </Grid>
      </Grid>

      {/* CA-7: Gráfico de compras por mes */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Compras por Mes</Typography>
        <Divider sx={{ mb: 2 }} />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={report?.monthly_purchases || []} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip formatter={(value) => formatCurrency(value)} />
            <Bar dataKey="total" name="Compras" fill="#1976d2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* CA-4/CA-5: Distribución de gastos y cumplimiento por proveedor */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Gastos y Cumplimiento por Proveedor</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Proveedor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Órdenes</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total Gastado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">% del Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Tasa de Cumplimiento</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (report?.supplier_distribution?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay órdenes de compra en este período</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.supplier_distribution.map((s) => (
                  <TableRow key={s.supplier_id || 'none'} hover sx={{ cursor: s.supplier_id ? 'pointer' : 'default' }} onClick={() => s.supplier_id && navigate(`/suppliers/${s.supplier_id}`)}>
                    <TableCell>{s.supplier_name}</TableCell>
                    <TableCell align="right">{s.order_count}</TableCell>
                    <TableCell align="right">{formatCurrency(s.total_spent)}</TableCell>
                    <TableCell align="right">{s.percentage}%</TableCell>
                    <TableCell align="right">
                      {s.fulfillment_rate !== null ? `${s.fulfillment_rate}%` : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* CA-6: Órdenes atrasadas */}
      {(report?.overdue_orders?.length ?? 0) > 0 && (
        <Paper variant="outlined" sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" color="error.main">
              Órdenes Atrasadas ({report.overdue_orders.length})
            </Typography>
          </Box>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Proveedor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Entrega Estimada</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Días de Retraso</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.overdue_orders.map((o) => (
                  <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/purchase-orders/${o.id}`)}>
                    <TableCell>
                      <Typography variant="body2" color="primary">{o.order_number}</Typography>
                    </TableCell>
                    <TableCell>{o.supplier_name || '-'}</TableCell>
                    <TableCell>{new Date(`${o.expected_delivery_date}T00:00:00`).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell align="right">
                      <Chip label={`${o.days_overdue} días`} size="small" color="error" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={o.status} size="small" color={STATUS_COLORS[o.status] || 'default'} variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* CA-1: Listado de órdenes */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Órdenes de Compra
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
                <TableCell sx={{ fontWeight: 'bold' }}>Proveedor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Monto</TableCell>
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
                    <Typography color="text.secondary">No hay órdenes de compra registradas en este período</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.orders.map((o) => (
                  <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/purchase-orders/${o.id}`)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary">{o.order_number}</Typography>
                    </TableCell>
                    <TableCell>{o.supplier_name || '-'}</TableCell>
                    <TableCell>{new Date(o.created_at).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell align="right">{formatCurrency(o.total)}</TableCell>
                    <TableCell>
                      <Chip label={o.status} size="small" color={STATUS_COLORS[o.status] || 'default'} variant="outlined" />
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

export default PurchaseOrdersReport;
