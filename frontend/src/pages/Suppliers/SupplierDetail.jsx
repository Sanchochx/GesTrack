/**
 * SupplierDetail - Perfil detallado del proveedor
 * US-SUPP-003: Ver Perfil del Proveedor
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
  Card,
  CardContent,
  Skeleton,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  LocalShipping as SuppliersIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingBag as ShoppingBagIcon,
  Receipt as ReceiptIcon,
  AccountBalance as PaymentIcon,
  Add as AddIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import supplierService from '../../services/supplierService';
import SupplierProductsPanel from '../../components/suppliers/SupplierProductsPanel';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSupplier = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierService.getSupplier(id);
      if (response.success) {
        setSupplier(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar proveedor');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar proveedor');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSupplier();
  }, [loadSupplier]);

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
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/suppliers')}>
          Volver a lista de proveedores
        </Button>
      </Container>
    );
  }

  if (!supplier) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Proveedor no encontrado</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/suppliers')} sx={{ mt: 2 }}>
          Volver a lista de proveedores
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Inicio
        </Link>
        <Link component={RouterLink} to="/suppliers" underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
          <SuppliersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Proveedores
        </Link>
        <Typography color="text.primary">{supplier.company_name}</Typography>
      </Breadcrumbs>

      {/* Navigation */}
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/suppliers')}>
          Volver a lista
        </Button>
      </Box>

      {!supplier.is_active && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Este proveedor está inactivo.
        </Alert>
      )}

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              {supplier.company_name}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                label={supplier.is_active ? 'Activo' : 'Inactivo'}
                color={supplier.is_active ? 'success' : 'default'}
                size="small"
              />
              {supplier.categories && supplier.categories.length > 0 && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {supplier.categories.map((category) => (
                    <Chip key={category.id} label={category.name} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary">
              <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Proveedor desde: {formatDate(supplier.created_at)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/suppliers/${id}/edit`)}
              >
                Editar
              </Button>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => navigate(`/suppliers/${id}/orders`)}
              >
                Ver Todas las Órdenes
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/purchase-orders/new?supplier=${id}`)}
              >
                Nueva Orden
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={6}>
          {/* Contacto */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="primary" />
              Contacto
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Persona de Contacto</Typography>
                <Typography variant="body1">{supplier.contact_name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Enviar correo">
                  <IconButton component="a" href={`mailto:${supplier.email}`} color="primary" size="small">
                    <EmailIcon />
                  </IconButton>
                </Tooltip>
                <Box>
                  <Typography variant="body2" color="text.secondary">Correo Electrónico</Typography>
                  <Typography variant="body1">
                    <Link href={`mailto:${supplier.email}`} underline="hover">{supplier.email}</Link>
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Llamar">
                  <IconButton component="a" href={`tel:${supplier.phone}`} color="primary" size="small">
                    <PhoneIcon />
                  </IconButton>
                </Tooltip>
                <Box>
                  <Typography variant="body2" color="text.secondary">Teléfono</Typography>
                  <Typography variant="body1">
                    <Link href={`tel:${supplier.phone}`} underline="hover">{supplier.phone}</Link>
                  </Typography>
                </Box>
              </Box>
              {supplier.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Tooltip title="Visitar sitio web">
                    <IconButton
                      component="a"
                      href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                      size="small"
                    >
                      <WebsiteIcon />
                    </IconButton>
                  </Tooltip>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Sitio Web</Typography>
                    <Typography variant="body1">
                      <Link
                        href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        {supplier.website}
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Ubicación */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon color="primary" />
              Dirección
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1">
              {supplier.address || (
                <Typography component="span" variant="body2" color="text.secondary" fontStyle="italic">
                  Sin dirección registrada
                </Typography>
              )}
            </Typography>
          </Paper>

          {/* Información de Pago */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentIcon color="primary" />
              Información de Pago
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {supplier.payment_bank || supplier.payment_account || supplier.payment_terms ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {supplier.payment_bank && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Banco</Typography>
                    <Typography variant="body1">{supplier.payment_bank}</Typography>
                  </Box>
                )}
                {supplier.payment_account && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Cuenta</Typography>
                    <Typography variant="body1">{supplier.payment_account}</Typography>
                  </Box>
                )}
                {supplier.payment_terms && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Condiciones de Pago</Typography>
                    <Typography variant="body1">{supplier.payment_terms}</Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                Sin información de pago registrada
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={6}>
          {/* Métricas */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingBagIcon color="primary" />
              Métricas de Compras
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <ShoppingBagIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">{supplier.total_orders || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Total de Órdenes</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <AttachMoneyIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">{formatCurrency(supplier.total_purchases)}</Typography>
                    <Typography variant="body2" color="text.secondary">Monto Total de Compras</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <AccessTimeIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {supplier.last_order_date ? formatDate(supplier.last_order_date) : 'Sin órdenes'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Última Orden</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <ReceiptIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {supplier.fulfillment_rate !== null && supplier.fulfillment_rate !== undefined
                        ? `${supplier.fulfillment_rate}%`
                        : 'Sin datos'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Tasa de Cumplimiento</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            {supplier.total_orders === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Este proveedor aún no tiene órdenes de compra registradas.
              </Alert>
            )}
          </Paper>

          {/* Últimas Órdenes */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon color="primary" />
                Últimas Órdenes de Compra
              </Typography>
              <Button
                size="small"
                endIcon={<OpenInNewIcon />}
                onClick={() => navigate(`/suppliers/${id}/orders`)}
              >
                Ver historial completo
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {supplier.recent_orders && supplier.recent_orders.length > 0 ? (
              <Stack spacing={1}>
                {supplier.recent_orders.map((order) => (
                  <Box key={order.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="medium">{order.order_number}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(order.order_date)} — {formatCurrency(order.total)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">
                Este proveedor aún no tiene órdenes de compra registradas.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* US-SUPP-014: Productos que provee el proveedor */}
      <SupplierProductsPanel supplierId={id} />
    </Container>
  );
}
