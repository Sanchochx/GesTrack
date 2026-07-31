/**
 * CustomerReport – Reporte de Clientes
 * US-REP-010: Reporte de Clientes
 *
 * CA-1: Total de clientes, clientes activos (con compras en período), nuevos clientes
 * CA-2: Top 10 clientes por monto de compra
 * CA-3: Distribución de clientes por nivel (VIP, Frecuente, Regular)
 * CA-4: Frecuencia promedio de compra
 * CA-5: Clientes en riesgo (sin compras en X días)
 * CA-6: Filtro por período
 * CA-7: Gráficos: nuevos clientes por mes, distribución por nivel
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
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Home as HomeIcon,
  Assessment as ReportIcon,
  People as PeopleIcon,
  PersonAdd as NewCustomerIcon,
  TrendingUp as ActiveIcon,
  WarningAmber as RiskIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import reportService from '../../services/reportService';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Histórico' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'custom', label: 'Personalizado' },
];

const CATEGORY_COLORS = { VIP: '#9c27b0', Frecuente: '#1976d2', Regular: '#757575' };
const CATEGORY_CHIP_COLOR = { VIP: 'secondary', Frecuente: 'primary', Regular: 'default' };

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

const CustomerReport = () => {
  const navigate = useNavigate();

  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState(daysAgo(29));
  const [endDate, setEndDate] = useState(today());
  const [atRiskDays, setAtRiskDays] = useState(90);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  const buildParams = useCallback(() => {
    const params = { period, at_risk_days: atRiskDays };
    if (period === 'custom') {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    return params;
  }, [period, startDate, endDate, atRiskDays]);

  const fetchReport = useCallback(async () => {
    if (period === 'custom' && (!startDate || !endDate)) return;
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getCustomerReport(buildParams());
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el reporte de clientes');
    } finally {
      setLoading(false);
    }
  }, [buildParams, period, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      await reportService.exportCustomerReport(buildParams(), format);
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
          Reporte de Clientes
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Reporte de Clientes</Typography>
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
            disabled={exporting || !report?.top_customers?.length}
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

      {/* CA-6: Filtro de período */}
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
              label="Días para 'en riesgo'"
              type="number"
              size="small"
              value={atRiskDays}
              onChange={(e) => setAtRiskDays(Number(e.target.value) || 90)}
              sx={{ minWidth: 160 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* CA-1: Métricas principales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<PeopleIcon sx={{ fontSize: 28 }} />}
            value={report?.total_customers ?? 0}
            label="Total de Clientes"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<ActiveIcon sx={{ fontSize: 28 }} />}
            value={report?.active_customers ?? 0}
            label="Clientes Activos en el Período"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<NewCustomerIcon sx={{ fontSize: 28 }} />}
            value={report?.new_customers ?? 0}
            label="Nuevos Clientes"
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<RiskIcon sx={{ fontSize: 28 }} />}
            value={report?.at_risk_customers?.length ?? 0}
            label={`En Riesgo (>${report?.at_risk_days_threshold ?? 90} días)`}
            color="error"
          />
        </Grid>
      </Grid>

      {/* CA-4: Frecuencia promedio de compra */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Frecuencia promedio de compra:{' '}
          <Typography component="span" variant="body1" fontWeight="bold">
            {report?.average_purchase_frequency_days !== null && report?.average_purchase_frequency_days !== undefined
              ? `cada ${report.average_purchase_frequency_days} días`
              : 'sin datos suficientes'}
          </Typography>
        </Typography>
      </Paper>

      {/* CA-7: Gráficos */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Distribución por Nivel</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={report?.category_distribution || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.category}: ${entry.percentage}%`}
                >
                  {(report?.category_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#999'} />
                  ))}
                </Pie>
                <ChartTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Nuevos Clientes por Mes (últimos 12 meses)</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={report?.new_customers_by_month || []} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip />
                <Bar dataKey="count" name="Nuevos Clientes" fill="#1976d2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* CA-2: Top 10 clientes */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Top 10 Clientes por Monto de Compra</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nivel</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Pedidos</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Total Comprado</TableCell>
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
              ) : (report?.top_customers?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay compras registradas en este período</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.top_customers.map((c, index) => (
                  <TableRow key={c.customer_id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.customer_id}`)}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{c.customer_name}</TableCell>
                    <TableCell>
                      <Chip label={c.customer_category} size="small" color={CATEGORY_CHIP_COLOR[c.customer_category] || 'default'} />
                    </TableCell>
                    <TableCell align="right">{c.order_count}</TableCell>
                    <TableCell align="right">{formatCurrency(c.total_spent)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* CA-5: Clientes en riesgo */}
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            Clientes en Riesgo
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({report?.at_risk_customers?.length ?? 0})
            </Typography>
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nivel</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Última Compra</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Días Sin Comprar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (report?.at_risk_customers?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay clientes en riesgo</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.at_risk_customers.map((c) => (
                  <TableRow key={c.customer_id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.customer_id}`)}>
                    <TableCell>{c.customer_name}</TableCell>
                    <TableCell>
                      <Chip label={c.customer_category} size="small" color={CATEGORY_CHIP_COLOR[c.customer_category] || 'default'} />
                    </TableCell>
                    <TableCell>{new Date(c.last_order_at).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell align="right">
                      <Chip label={`${c.days_since_last_order} días`} size="small" color="error" variant="outlined" />
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

export default CustomerReport;
