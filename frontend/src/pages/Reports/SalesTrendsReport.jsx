/**
 * SalesTrendsReport – Análisis de Tendencias de Ventas
 * US-REP-011: Análisis de Tendencias de Ventas
 *
 * CA-1: Gráfico de línea de ventas por mes (últimos 12 meses)
 * CA-2: Meses pico y meses bajos
 * CA-3: Tasa de crecimiento promedio mensual
 * CA-4: Comparación año actual vs año anterior
 * CA-5: Análisis de estacionalidad
 * CA-6: Tendencias por categoría de producto
 * CA-7: Proyección simple para los próximos 3 meses
 * CA-8: Exportación a PDF
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
  Chip,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Skeleton,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Home as HomeIcon,
  Assessment as ReportIcon,
  TrendingUp as PeakIcon,
  TrendingDown as LowIcon,
  ShowChart as GrowthIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import reportService from '../../services/reportService';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const CATEGORY_COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1'];

const formatCurrency = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

const formatMonthLabel = (yyyymm) => {
  if (!yyyymm) return '';
  const [year, month] = yyyymm.split('-');
  return `${MONTH_NAMES[Number(month) - 1]} ${year.slice(2)}`;
};

function MetricCard({ icon, value, label, color = 'primary' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
        <Box sx={{ color: `${color}.main`, mb: 1 }}>{icon}</Box>
        <Typography variant="h6" fontWeight="bold">{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
}

const SalesTrendsReport = () => {
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getSalesTrendsReport();
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el análisis de tendencias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportService.exportSalesTrendsReport();
    } catch (err) {
      setError(err?.error?.message || 'Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  // CA-1: Serie principal + CA-7: proyección concatenada como continuación de la línea
  const combinedSeries = [
    ...(report?.monthly_sales || []).map((m) => ({ month: m.month, actual: m.total })),
    ...(report?.projection || []).map((p) => ({ month: p.month, projected: p.projected_total })),
  ];
  if (report?.monthly_sales?.length && report?.projection?.length) {
    const bridgeIndex = report.monthly_sales.length - 1;
    combinedSeries[bridgeIndex].projected = combinedSeries[bridgeIndex].actual;
  }

  // CA-4: Comparación anual, con etiquetas de mes
  const yoyData = (report?.yoy_comparison || []).map((r) => ({
    ...r,
    month_label: MONTH_NAMES[r.month - 1],
  }));

  // CA-5: Estacionalidad
  const seasonalityData = (report?.seasonality || []).map((r) => ({
    ...r,
    month_label: MONTH_NAMES[r.month - 1],
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
          Tendencias de Ventas
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Análisis de Tendencias de Ventas</Typography>
          <Typography variant="body2" color="text.secondary">Últimos 12 meses, con proyección a 3 meses</Typography>
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
            disabled={exporting || !report}
          >
            Exportar a PDF
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* CA-2/CA-3: Métricas de resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<PeakIcon sx={{ fontSize: 26 }} />}
            value={report ? `${formatMonthLabel(report.peak_month.month)} — ${formatCurrency(report.peak_month.total)}` : '—'}
            label="Mes Pico"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<LowIcon sx={{ fontSize: 26 }} />}
            value={report ? `${formatMonthLabel(report.low_month.month)} — ${formatCurrency(report.low_month.total)}` : '—'}
            label="Mes Bajo"
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            icon={<GrowthIcon sx={{ fontSize: 26 }} />}
            value={report?.average_monthly_growth_rate !== null && report?.average_monthly_growth_rate !== undefined
              ? `${report.average_monthly_growth_rate >= 0 ? '+' : ''}${report.average_monthly_growth_rate}%`
              : 'Sin datos suficientes'}
            label="Crecimiento Promedio Mensual"
            color="info"
          />
        </Grid>
      </Grid>

      {/* CA-1/CA-7: Gráfico de línea con proyección */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Evolución de Ventas y Proyección
          <Chip label="Proyectado" size="small" variant="outlined" sx={{ ml: 1, borderStyle: 'dashed' }} />
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {loading ? (
          <Skeleton variant="rectangular" height={300} />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedSeries} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickFormatter={formatMonthLabel} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip formatter={(value) => formatCurrency(value)} labelFormatter={formatMonthLabel} />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Ventas" stroke="#1976d2" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="projected" name="Proyección" stroke="#9c27b0" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* CA-4: Año actual vs anterior */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {report ? `${report.current_year} vs ${report.previous_year}` : 'Comparación Anual'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yoyData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="previous_year_total" name={report ? String(report.previous_year) : 'Año anterior'} fill="#9e9e9e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="current_year_total" name={report ? String(report.current_year) : 'Año actual'} fill="#1976d2" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* CA-5: Estacionalidad */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Estacionalidad (Promedio Histórico)</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={seasonalityData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="average_total" name="Promedio" fill="#2e7d32" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* CA-6: Tendencias por categoría */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Tendencias por Categoría de Producto (Top 5)</Typography>
        <Divider sx={{ mb: 2 }} />
        {(report?.category_trends?.length ?? 0) === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No hay datos de ventas por categoría en el período
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                type="category"
                allowDuplicatedCategory={false}
                tickFormatter={formatMonthLabel}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip formatter={(value) => formatCurrency(value)} labelFormatter={formatMonthLabel} />
              <Legend />
              {report.category_trends.map((cat, index) => (
                <Line
                  key={cat.category_name}
                  data={cat.monthly}
                  dataKey="total"
                  name={cat.category_name}
                  stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Container>
  );
};

export default SalesTrendsReport;
