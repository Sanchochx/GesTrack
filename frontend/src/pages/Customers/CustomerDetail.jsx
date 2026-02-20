/**
 * CustomerDetail - Perfil detallado del cliente
 * US-CUST-004: Ver Perfil del Cliente
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Skeleton,
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  ShoppingCart as ShoppingCartIcon,
  PersonOff as PersonOffIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingBag as ShoppingBagIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Note as NoteIcon,
  Add as AddIcon,
  Inventory as InventoryIcon,
  Badge as BadgeIcon,
  AccountBalance as FiscalIcon,
} from '@mui/icons-material';
import customerService from '../../services/customerService';
import authService from '../../services/authService';
import DeleteCustomerDialog from '../../components/customers/DeleteCustomerDialog';
import InactivateCustomerDialog from '../../components/customers/InactivateCustomerDialog';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatRelativeDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace ${Math.floor(diffDays / 365)} años`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'VIP': return 'warning';
    case 'Frecuente': return 'info';
    default: return 'default';
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'VIP': return <StarIcon fontSize="small" />;
    case 'Frecuente': return <TrendingUpIcon fontSize="small" />;
    default: return null;
  }
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogMode, setStatusDialogMode] = useState('deactivate');

  const loadCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerService.getCustomer(id);
      if (response.success) {
        setCustomer(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar cliente');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar cliente');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const openStatusDialog = () => {
    setStatusDialogMode(customer.is_active ? 'deactivate' : 'activate');
    setStatusDialogOpen(true);
  };

  const handleStatusChangeSuccess = (response) => {
    setStatusDialogOpen(false);
    setCustomer(response.data);
    setSnackbar({
      open: true,
      message: response.message || `Estado del cliente actualizado correctamente`,
      severity: 'success',
    });
  };

  const handleCopyAddress = () => {
    if (!customer) return;
    const parts = [
      customer.direccion,
      customer.municipio_ciudad,
      customer.departamento,
      customer.pais,
    ].filter(Boolean);
    navigator.clipboard.writeText(parts.join(', '));
    setSnackbar({ open: true, message: 'Dirección copiada al portapapeles', severity: 'success' });
  };

  const handleOpenMaps = () => {
    if (!customer) return;
    const parts = [
      customer.direccion,
      customer.municipio_ciudad,
      customer.departamento,
      customer.pais,
    ].filter(Boolean);
    const address = encodeURIComponent(parts.join(', '));
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCustomerDeleted = (response) => {
    setSnackbar({
      open: true,
      message: response.message || `Cliente ${customer.nombre_razon_social} eliminado permanentemente`,
      severity: 'success',
    });
    setTimeout(() => {
      navigate('/customers');
    }, 1500);
  };

  const handleInactivateFromDialog = () => {
    setDeleteDialogOpen(false);
    setStatusDialogMode('deactivate');
    setStatusDialogOpen(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={300} height={32} />
        </Box>
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          </Grid>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')}>
          Volver a lista de clientes
        </Button>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Cliente no encontrado</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')} sx={{ mt: 2 }}>
          Volver a lista de clientes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">Inicio</Link>
        <Link component={RouterLink} to="/customers" underline="hover" color="inherit">Clientes</Link>
        <Typography color="text.primary">{customer.nombre_razon_social}</Typography>
      </Breadcrumbs>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')}>
          Volver a lista
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Cliente anterior (próximamente)">
            <span><IconButton disabled><NavigateBeforeIcon /></IconButton></span>
          </Tooltip>
          <Tooltip title="Cliente siguiente (próximamente)">
            <span><IconButton disabled><NavigateNextIcon /></IconButton></span>
          </Tooltip>
        </Box>
      </Box>

      {/* CA-5: Banner de cliente inactivo */}
      {!customer.is_active && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Este cliente está inactivo
          {customer.inactivated_at
            ? ` desde el ${formatDate(customer.inactivated_at)}`
            : ''}
          . No aparecerá en búsquedas por defecto y no puede recibir nuevos pedidos.
        </Alert>
      )}

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              {customer.nombre_razon_social}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                icon={getCategoryIcon(customer.customer_category)}
                label={customer.customer_category || 'Regular'}
                color={getCategoryColor(customer.customer_category)}
                size="small"
              />
              <Chip
                label={customer.is_active ? 'Activo' : 'Inactivo'}
                color={customer.is_active ? 'success' : 'default'}
                size="small"
              />
              <Chip
                label={`${customer.tipo_documento}: ${customer.numero_documento}`}
                variant="outlined"
                size="small"
              />
              <Chip
                label={customer.tipo_contribuyente}
                variant="outlined"
                size="small"
                color="primary"
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Cliente desde: {formatDate(customer.created_at)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/customers/${id}/edit`)}>
                Editar
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShoppingCartIcon />}
                onClick={() => navigate(`/orders/new?customer=${id}`)}
                disabled
              >
                Crear Pedido
              </Button>
              <Button
                variant="outlined"
                color={customer.is_active ? 'warning' : 'success'}
                startIcon={customer.is_active ? <PersonOffIcon /> : <PersonAddIcon />}
                onClick={openStatusDialog}
              >
                {customer.is_active ? 'Inactivar' : 'Activar'}
              </Button>
              {isAdmin && (
                <Tooltip title={customer.order_count > 0 ? 'No se puede eliminar (tiene pedidos)' : 'Eliminar cliente'}>
                  <span>
                    <IconButton color="error" onClick={() => setDeleteDialogOpen(true)}>
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={6}>

          {/* Sección: Identificación */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BadgeIcon color="primary" />
              Identificación
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Tipo de Documento</Typography>
                <Typography variant="body1">{customer.tipo_documento}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Número de Documento</Typography>
                <Typography variant="body1" fontWeight="medium">{customer.numero_documento}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Tipo de Contribuyente</Typography>
                <Typography variant="body1">{customer.tipo_contribuyente}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Sección: Información Fiscal */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FiscalIcon color="primary" />
              Información Fiscal
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Régimen Fiscal</Typography>
                <Typography variant="body1">
                  {customer.regimen_fiscal || <span style={{ color: '#9e9e9e', fontStyle: 'italic' }}>No especificado</span>}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Responsabilidad Tributaria</Typography>
                <Typography variant="body1">
                  {customer.responsabilidad_tributaria || <span style={{ color: '#9e9e9e', fontStyle: 'italic' }}>No especificada</span>}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Sección: Ubicación */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon color="primary" />
                Ubicación
              </Typography>
              <Box>
                <Tooltip title="Copiar dirección">
                  <IconButton size="small" onClick={handleCopyAddress}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Abrir en Google Maps">
                  <IconButton size="small" onClick={handleOpenMaps}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">País</Typography>
                <Typography variant="body1">{customer.pais || 'Colombia'}</Typography>
              </Box>
              {customer.departamento && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Departamento</Typography>
                  <Typography variant="body1">{customer.departamento}</Typography>
                </Box>
              )}
              {customer.municipio_ciudad && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Municipio / Ciudad</Typography>
                  <Typography variant="body1">{customer.municipio_ciudad}</Typography>
                </Box>
              )}
              {customer.direccion && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Dirección</Typography>
                  <Typography variant="body1">{customer.direccion}</Typography>
                </Box>
              )}
              {!customer.departamento && !customer.municipio_ciudad && !customer.direccion && (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  Sin información de ubicación
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Sección: Contacto */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="primary" />
              Contacto
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Correo */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Enviar correo">
                  <IconButton component="a" href={`mailto:${customer.correo}`} color="primary" size="small">
                    <EmailIcon />
                  </IconButton>
                </Tooltip>
                <Box>
                  <Typography variant="body2" color="text.secondary">Correo Electrónico</Typography>
                  <Typography variant="body1">
                    <Link href={`mailto:${customer.correo}`} underline="hover">{customer.correo}</Link>
                  </Typography>
                </Box>
              </Box>

              {/* Teléfono */}
              {customer.telefono_movil && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Tooltip title="Llamar">
                    <IconButton component="a" href={`tel:${customer.telefono_movil}`} color="primary" size="small">
                      <PhoneIcon />
                    </IconButton>
                  </Tooltip>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Teléfono Móvil</Typography>
                    <Typography variant="body1">
                      <Link href={`tel:${customer.telefono_movil}`} underline="hover">{customer.telefono_movil}</Link>
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Notas */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NoteIcon color="primary" />
                Notas
              </Typography>
              <Button size="small" startIcon={<AddIcon />} disabled>
                Agregar nota
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {customer.notes ? (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{customer.notes}</Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No hay notas sobre este cliente
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={6}>
          {/* Estadísticas */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" />
              Estadísticas del Cliente
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <ShoppingBagIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">{customer.order_count || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Total de Pedidos</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <AttachMoneyIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">{formatCurrency(customer.total_purchases)}</Typography>
                    <Typography variant="body2" color="text.secondary">Monto Total</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <TrendingUpIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(customer.order_count > 0 ? customer.total_purchases / customer.order_count : 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Promedio por Compra</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <AccessTimeIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {customer.last_purchase_date ? formatRelativeDate(customer.last_purchase_date) : 'Sin compras'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Última Compra</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            {customer.order_count === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Este cliente aún no ha realizado compras. Las estadísticas se actualizarán cuando se registren pedidos.
              </Alert>
            )}
          </Paper>

          {/* Últimos Pedidos */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon color="primary" />
                Últimos Pedidos
              </Typography>
              <Button size="small" endIcon={<OpenInNewIcon />} onClick={() => navigate(`/customers/${id}/orders`)}>
                Ver historial completo
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Alert severity="info" icon={<InventoryIcon />}>
              <Typography variant="body2">
                {customer.order_count > 0
                  ? `Este cliente tiene ${customer.order_count} pedido(s). Ver el historial completo para más detalles.`
                  : 'Este cliente aún no ha realizado compras.'}
              </Typography>
            </Alert>
          </Paper>

          {/* Productos Favoritos */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarIcon color="primary" />
              Productos Más Comprados
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Alert severity="info" icon={<InventoryIcon />}>
              <Typography variant="body2">Aún no hay productos favoritos registrados.</Typography>
              <Typography variant="caption" color="text.secondary">
                Esta información se calculará automáticamente basándose en el historial de compras.
              </Typography>
            </Alert>
          </Paper>

          {/* Historial (Admin only) */}
          {isAdmin && (
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setActivityExpanded(!activityExpanded)}
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon color="primary" />
                  Historial de Actividad
                </Typography>
                <IconButton size="small">
                  {activityExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={activityExpanded}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Registrado:</strong> {formatDate(customer.created_at)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Última actualización:</strong> {formatDate(customer.updated_at)}
                  </Typography>
                  {customer.inactivated_at && (
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1, border: '1px solid', borderColor: 'warning.light' }}>
                      <Typography variant="body2" color="warning.dark">
                        <strong>Inactivado el:</strong> {formatDate(customer.inactivated_at)}
                      </Typography>
                      {customer.inactivated_by_name && (
                        <Typography variant="body2" color="warning.dark">
                          <strong>Por:</strong> {customer.inactivated_by_name}
                        </Typography>
                      )}
                      {customer.inactivation_reason && (
                        <Typography variant="body2" color="warning.dark">
                          <strong>Motivo:</strong> {customer.inactivation_reason}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {customer.reactivated_at && (
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: 'success.lighter', borderRadius: 1, border: '1px solid', borderColor: 'success.light' }}>
                      <Typography variant="body2" color="success.dark">
                        <strong>Reactivado el:</strong> {formatDate(customer.reactivated_at)}
                      </Typography>
                      {customer.reactivated_by_name && (
                        <Typography variant="body2" color="success.dark">
                          <strong>Por:</strong> {customer.reactivated_by_name}
                        </Typography>
                      )}
                      {customer.reactivation_reason && (
                        <Typography variant="body2" color="success.dark">
                          <strong>Motivo:</strong> {customer.reactivation_reason}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Delete Dialog */}
      <DeleteCustomerDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        customer={customer}
        onDeleted={handleCustomerDeleted}
        onInactivate={handleInactivateFromDialog}
      />

      {/* Status Dialog (Inactivar / Reactivar) */}
      <InactivateCustomerDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        customer={customer}
        onSuccess={handleStatusChangeSuccess}
        mode={statusDialogMode}
      />
    </Container>
  );
}
