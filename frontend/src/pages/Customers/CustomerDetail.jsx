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
  CircularProgress,
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
} from '@mui/icons-material';
import customerService from '../../services/customerService';
import authService from '../../services/authService';
import DeleteCustomerDialog from '../../components/customers/DeleteCustomerDialog';

/**
 * Formatea una fecha en formato legible
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formatea una fecha relativa (hace X tiempo)
 */
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

/**
 * Formatea un monto en moneda
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount || 0);
};

/**
 * CA-1: Obtiene el color del badge de categoría
 */
const getCategoryColor = (category) => {
  switch (category) {
    case 'VIP':
      return 'warning';
    case 'Frecuente':
      return 'info';
    default:
      return 'default';
  }
};

/**
 * CA-1: Obtiene el icono del badge de categoría
 */
const getCategoryIcon = (category) => {
  switch (category) {
    case 'VIP':
      return <StarIcon fontSize="small" />;
    case 'Frecuente':
      return <TrendingUpIcon fontSize="small" />;
    default:
      return null;
  }
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';

  // State
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  /**
   * Cargar datos del cliente
   */
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

  /**
   * CA-9: Toggle activar/inactivar cliente
   */
  const handleToggleActive = async () => {
    setToggling(true);
    try {
      const response = await customerService.toggleActive(id);
      if (response.success) {
        setCustomer(response.data);
        setSnackbar({
          open: true,
          message: response.message || `Cliente ${response.data.is_active ? 'activado' : 'inactivado'} correctamente`,
          severity: 'success',
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.error?.message || 'Error al cambiar estado',
        severity: 'error',
      });
    } finally {
      setToggling(false);
    }
  };

  /**
   * CA-3: Copiar dirección al portapapeles
   */
  const handleCopyAddress = () => {
    if (!customer) return;
    const address = `${customer.address_street}, ${customer.address_city}, ${customer.address_postal_code}, ${customer.address_country}`;
    navigator.clipboard.writeText(address);
    setSnackbar({
      open: true,
      message: 'Dirección copiada al portapapeles',
      severity: 'success',
    });
  };

  /**
   * CA-3: Abrir dirección en Google Maps
   */
  const handleOpenMaps = () => {
    if (!customer) return;
    const address = encodeURIComponent(
      `${customer.address_street}, ${customer.address_city}, ${customer.address_postal_code}, ${customer.address_country}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  /**
   * Cerrar snackbar
   */
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  /**
   * US-CUST-006 CA-7: Handle successful deletion
   */
  const handleCustomerDeleted = (response) => {
    setSnackbar({
      open: true,
      message: response.message || `Cliente ${customer.full_name} eliminado permanentemente`,
      severity: 'success',
    });
    // Redirect to customer list after short delay
    setTimeout(() => {
      navigate('/customers');
    }, 1500);
  };

  /**
   * US-CUST-006 CA-10: Handle inactivate from delete dialog
   */
  const handleInactivateFromDialog = async () => {
    setDeleteDialogOpen(false);
    await handleToggleActive();
  };

  // Loading state
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

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
        >
          Volver a lista de clientes
        </Button>
      </Container>
    );
  }

  // No customer found
  if (!customer) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Cliente no encontrado</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mt: 2 }}
        >
          Volver a lista de clientes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* CA-10: Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component={RouterLink}
          to="/dashboard"
          underline="hover"
          color="inherit"
        >
          Inicio
        </Link>
        <Link
          component={RouterLink}
          to="/customers"
          underline="hover"
          color="inherit"
        >
          Clientes
        </Link>
        <Typography color="text.primary">{customer.full_name}</Typography>
      </Breadcrumbs>

      {/* CA-10: Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
        >
          Volver a lista
        </Button>
        {/* Future: Previous/Next navigation */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Cliente anterior (próximamente)">
            <span>
              <IconButton disabled>
                <NavigateBeforeIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Cliente siguiente (próximamente)">
            <span>
              <IconButton disabled>
                <NavigateNextIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* CA-1: Cabecera del Perfil */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            {/* Nombre prominente */}
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              {customer.full_name}
            </Typography>

            {/* Badges */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {/* Badge de categoría */}
              <Chip
                icon={getCategoryIcon(customer.customer_category)}
                label={customer.customer_category || 'Regular'}
                color={getCategoryColor(customer.customer_category)}
                size="small"
              />

              {/* Badge de estado */}
              <Chip
                label={customer.is_active ? 'Activo' : 'Inactivo'}
                color={customer.is_active ? 'success' : 'default'}
                size="small"
              />
            </Box>

            {/* Fecha de registro */}
            <Typography variant="body2" color="text.secondary">
              <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Cliente desde: {formatDate(customer.created_at)}
            </Typography>
          </Grid>

          {/* CA-1 & CA-9: Botones de acción principales */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'flex-start' : 'flex-end',
              }}
            >
              {/* CA-9: Editar - US-CUST-005 */}
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/customers/${id}/edit`)}
              >
                Editar
              </Button>

              {/* Crear Pedido */}
              <Button
                variant="outlined"
                startIcon={<ShoppingCartIcon />}
                onClick={() => navigate(`/orders/new?customer=${id}`)}
                disabled // US-ORD-001 pending
              >
                Crear Pedido
              </Button>

              {/* Activar/Inactivar */}
              <Button
                variant="outlined"
                color={customer.is_active ? 'warning' : 'success'}
                startIcon={toggling ? <CircularProgress size={16} /> : (customer.is_active ? <PersonOffIcon /> : <PersonAddIcon />)}
                onClick={handleToggleActive}
                disabled={toggling}
              >
                {customer.is_active ? 'Inactivar' : 'Activar'}
              </Button>

              {/* US-CUST-006 CA-1 & CA-9: Eliminar (solo Admin) */}
              {isAdmin && (
                <Tooltip
                  title={
                    customer.order_count > 0
                      ? 'No se puede eliminar (tiene pedidos)'
                      : 'Eliminar cliente'
                  }
                >
                  <span>
                    <IconButton
                      color="error"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main content grid */}
      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={6}>
          {/* CA-2: Información de Contacto */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="primary" />
              Datos de Contacto
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Email */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Enviar email">
                  <IconButton
                    component="a"
                    href={`mailto:${customer.email}`}
                    color="primary"
                    size="small"
                  >
                    <EmailIcon />
                  </IconButton>
                </Tooltip>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    <Link href={`mailto:${customer.email}`} underline="hover">
                      {customer.email}
                    </Link>
                  </Typography>
                </Box>
              </Box>

              {/* Teléfono principal */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Llamar">
                  <IconButton
                    component="a"
                    href={`tel:${customer.phone}`}
                    color="primary"
                    size="small"
                  >
                    <PhoneIcon />
                  </IconButton>
                </Tooltip>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Teléfono Principal
                  </Typography>
                  <Typography variant="body1">
                    <Link href={`tel:${customer.phone}`} underline="hover">
                      {customer.phone}
                    </Link>
                  </Typography>
                </Box>
              </Box>

              {/* Teléfono secundario */}
              {customer.secondary_phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Tooltip title="Llamar">
                    <IconButton
                      component="a"
                      href={`tel:${customer.secondary_phone}`}
                      color="primary"
                      size="small"
                    >
                      <PhoneIcon />
                    </IconButton>
                  </Tooltip>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Teléfono Secundario
                    </Typography>
                    <Typography variant="body1">
                      <Link href={`tel:${customer.secondary_phone}`} underline="hover">
                        {customer.secondary_phone}
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {/* CA-3: Dirección Completa */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon color="primary" />
                Dirección de Envío
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

            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {customer.address_street}
              {'\n'}
              {customer.address_city}, {customer.address_postal_code}
              {'\n'}
              {customer.address_country}
            </Typography>
          </Paper>

          {/* CA-6: Notas sobre el Cliente */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NoteIcon color="primary" />
                Notas
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                disabled // US-CUST-009 pending
              >
                Agregar nota
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {customer.notes ? (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {customer.notes}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No hay notas sobre este cliente
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={6}>
          {/* CA-4: Métricas del Cliente */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" />
              Estadísticas del Cliente
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              {/* Total de pedidos */}
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <ShoppingBagIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">
                      {customer.order_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de Pedidos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Monto total gastado */}
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <AttachMoneyIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(customer.total_purchases)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monto Total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Promedio de compra */}
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <TrendingUpIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(customer.order_count > 0 ? customer.total_purchases / customer.order_count : 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Promedio por Compra
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Última compra */}
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <AccessTimeIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {customer.last_purchase_date ? formatRelativeDate(customer.last_purchase_date) : 'Sin compras'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Última Compra
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Mensaje cuando no hay pedidos */}
            {customer.order_count === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Este cliente aún no ha realizado compras. Las estadísticas se actualizarán cuando se registren pedidos.
              </Alert>
            )}
          </Paper>

          {/* CA-5: Resumen de Pedidos Recientes */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon color="primary" />
                Últimos Pedidos
              </Typography>
              <Button
                size="small"
                endIcon={<OpenInNewIcon />}
                onClick={() => navigate(`/customers/${id}/orders`)}
                disabled // US-ORD-010 pending
              >
                Ver todos
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {/* Placeholder - Orders module pending */}
            <Alert severity="info" icon={<InventoryIcon />}>
              <Typography variant="body2">
                Este cliente aún no ha realizado compras.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                El historial de pedidos estará disponible cuando se implemente el módulo de ventas.
              </Typography>
            </Alert>
          </Paper>

          {/* CA-7: Productos Favoritos */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarIcon color="primary" />
              Productos Más Comprados
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Placeholder - Orders module pending */}
            <Alert severity="info" icon={<InventoryIcon />}>
              <Typography variant="body2">
                Aún no hay productos favoritos registrados.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Esta información se calculará automáticamente basándose en el historial de compras.
              </Typography>
            </Alert>
          </Paper>

          {/* CA-8: Historial de Cambios (Admin only, collapsible) */}
          {isAdmin && (
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
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
                  {!customer.is_active && (
                    <Typography variant="body2" color="warning.main">
                      <strong>Estado:</strong> Inactivo
                    </Typography>
                  )}
                </Box>

                {/* Note: Detailed audit trail will require backend changes */}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  El historial detallado con información de usuarios estará disponible en futuras versiones.
                </Typography>
              </Collapse>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
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

      {/* US-CUST-006: Delete Customer Dialog */}
      <DeleteCustomerDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        customer={customer}
        onDeleted={handleCustomerDeleted}
        onInactivate={handleInactivateFromDialog}
      />
    </Container>
  );
}
