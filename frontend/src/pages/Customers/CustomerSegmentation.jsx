/**
 * CustomerSegmentation - Dashboard de Segmentación de Clientes
 * US-CUST-011 CA-6: Dashboard con distribución, métricas y top VIP
 * US-CUST-011 CA-7: Panel de configuración de rangos (Admin only)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  Star as StarIcon,
  TrendingUp as FrequentIcon,
  Person as RegularIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import customerService from '../../services/customerService';
import authService from '../../services/authService';

const CATEGORY_CONFIG = {
  VIP: { color: '#f9a825', bgColor: '#fff8e1', icon: <StarIcon fontSize="small" />, label: 'VIP' },
  Frecuente: { color: '#1565c0', bgColor: '#e3f2fd', icon: <FrequentIcon fontSize="small" />, label: 'Frecuente' },
  Regular: { color: '#757575', bgColor: '#f5f5f5', icon: <RegularIcon fontSize="small" />, label: 'Regular' },
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount || 0);

export default function CustomerSegmentation() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // CA-7: Config dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ vip_threshold: 500000, frequent_threshold: 200000 });
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerService.getSegmentationDashboard();
      if (response.success) {
        setData(response.data);
        if (response.data.config) {
          setConfigForm({
            vip_threshold: response.data.config.vip_threshold,
            frequent_threshold: response.data.config.frequent_threshold,
          });
        }
      } else {
        setError(response.error?.message || 'Error al cargar datos de segmentación');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar datos de segmentación');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    setConfigError('');
    const vip = parseFloat(configForm.vip_threshold);
    const freq = parseFloat(configForm.frequent_threshold);

    if (!vip || !freq || vip <= 0 || freq <= 0) {
      setConfigError('Los umbrales deben ser valores positivos');
      return;
    }
    if (freq >= vip) {
      setConfigError('El umbral VIP debe ser mayor al umbral Frecuente');
      return;
    }

    setConfigSaving(true);
    try {
      const response = await customerService.updateSegmentationConfig({
        vip_threshold: vip,
        frequent_threshold: freq,
      });
      if (response.success) {
        setConfigDialogOpen(false);
        setSnackbar({ open: true, message: response.message || 'Configuración actualizada', severity: 'success' });
        loadData();
      }
    } catch (err) {
      setConfigError(err.error?.message || 'Error al actualizar configuración');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const response = await customerService.recalculateCategories();
      if (response.success) {
        setSnackbar({ open: true, message: response.message || 'Recálculo completado', severity: 'success' });
        loadData();
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.error?.message || 'Error al recalcular', severity: 'error' });
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate('/customers')}>Volver a Clientes</Button>
      </Container>
    );
  }

  const { distribution = [], metrics = [], top_vip = [], total_customers = 0, config } = data || {};

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">
          <HomeIcon sx={{ mr: 0.5, verticalAlign: 'middle' }} fontSize="small" />
          Inicio
        </Link>
        <Link component={RouterLink} to="/customers" underline="hover" color="inherit">Clientes</Link>
        <Typography color="text.primary">Segmentación</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">Segmentación de Clientes</Typography>
          <Typography variant="body1" color="text.secondary">
            Análisis de clientes por nivel de compra — {total_customers} clientes en total
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
          >
            Actualizar
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="outlined"
                color="warning"
                startIcon={recalculating ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={handleRecalculate}
                disabled={recalculating}
              >
                Recalcular todos
              </Button>
              <Button
                variant="contained"
                startIcon={<SettingsIcon />}
                onClick={() => setConfigDialogOpen(true)}
              >
                Configurar rangos
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Config summary */}
      {config && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Rangos actuales:</strong>{' '}
          VIP &gt; {formatCurrency(config.vip_threshold)} &nbsp;|&nbsp;
          Frecuente {formatCurrency(config.frequent_threshold)} – {formatCurrency(config.vip_threshold)} &nbsp;|&nbsp;
          Regular &lt; {formatCurrency(config.frequent_threshold)}
        </Alert>
      )}

      {/* Distribution cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {distribution.map((item) => {
          const conf = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Regular;
          return (
            <Grid item xs={12} sm={4} key={item.category}>
              <Card sx={{ borderLeft: `4px solid ${conf.color}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ color: conf.color }}>{conf.icon}</Box>
                    <Typography variant="subtitle2" color="text.secondary">{conf.label}</Typography>
                  </Box>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: conf.color }}>
                    {item.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.percentage}% del total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Pie chart */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Distribución</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ category, percentage }) => `${category} ${percentage}%`}
                >
                  {distribution.map((item) => (
                    <Cell key={item.category} fill={CATEGORY_CONFIG[item.category]?.color || '#ccc'} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Metrics by category */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Métricas por Categoría</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Categoría</strong></TableCell>
                    <TableCell align="right"><strong>Clientes</strong></TableCell>
                    <TableCell align="right"><strong>Total Gastado</strong></TableCell>
                    <TableCell align="right"><strong>Promedio</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.map((row) => {
                    const conf = CATEGORY_CONFIG[row.category] || CATEGORY_CONFIG.Regular;
                    return (
                      <TableRow key={row.category}>
                        <TableCell>
                          <Chip
                            label={row.category}
                            size="small"
                            sx={{ color: conf.color, backgroundColor: conf.bgColor, fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right">{formatCurrency(row.total_spent)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.avg_spent)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top 10 VIP */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <StarIcon sx={{ color: '#f9a825', verticalAlign: 'middle', mr: 1 }} />
          Top 10 Clientes VIP
        </Typography>
        {top_vip.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No hay clientes VIP aún. Los clientes son clasificados como VIP cuando superan el umbral de gasto configurado.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell align="right">Total Gastado</TableCell>
                  <TableCell align="right">Pedidos</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {top_vip.map((customer, idx) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Typography fontWeight={idx < 3 ? 'bold' : 'normal'} color={idx < 3 ? 'warning.dark' : 'text.primary'}>
                        #{idx + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{customer.nombre_razon_social}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{customer.correo}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="warning.dark">{formatCurrency(customer.total_spent)}</Typography>
                    </TableCell>
                    <TableCell align="right">{customer.order_count}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver perfil">
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => navigate(`/customers/${customer.id}`)}
                        >
                          Ver
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* CA-7: Config dialog (Admin only) */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Rangos de Segmentación</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Define los montos mínimos de gasto total para clasificar a los clientes.
            Los cambios se aplicarán al recalcular las categorías.
          </Typography>

          {configError && <Alert severity="error" sx={{ mb: 2 }}>{configError}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Umbral VIP (monto mínimo)"
                type="number"
                fullWidth
                value={configForm.vip_threshold}
                onChange={(e) => setConfigForm({ ...configForm, vip_threshold: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">$ COP</InputAdornment> }}
                helperText="Clientes con gasto total superior a este monto (COP) serán VIP"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Umbral Frecuente (monto mínimo)"
                type="number"
                fullWidth
                value={configForm.frequent_threshold}
                onChange={(e) => setConfigForm({ ...configForm, frequent_threshold: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">$ COP</InputAdornment> }}
                helperText="Clientes con gasto (COP) entre este monto y el umbral VIP serán Frecuentes"
              />
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 2 }}>
            Después de guardar, presiona "Recalcular todos" para aplicar los nuevos rangos a todos los clientes.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveConfig}
            disabled={configSaving}
            startIcon={configSaving ? <CircularProgress size={16} /> : null}
          >
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
