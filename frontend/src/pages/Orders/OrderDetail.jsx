/**
 * OrderDetail – Vista detallada del pedido
 * US-ORD-003: CA-3 (cambio de estado), CA-6 (timeline historial)
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import orderService from '../../services/orderService';
import { STATUS_COLORS } from '../../components/orders/StatusChangeModal';
import StatusChangeModal from '../../components/orders/StatusChangeModal';
import StatusTimeline from '../../components/orders/StatusTimeline';

const TERMINAL_STATUSES = ['Entregado', 'Cancelado'];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight="medium">{value}</Typography>
  </Box>
);

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrderById(id);
      setOrder(response.data);
    } catch (err) {
      setError(err?.error?.message || 'Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus, notes) => {
    setChangingStatus(true);
    setStatusError(null);
    try {
      await orderService.updateOrderStatus(id, newStatus, notes);
      setStatusModalOpen(false);
      setSuccessMessage(`Estado actualizado a "${newStatus}"`);
      await fetchOrder();
    } catch (err) {
      setStatusError(err?.error?.message || 'Error al cambiar el estado');
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton variant="text" width={300} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')}>
          Volver a Pedidos
        </Button>
      </Container>
    );
  }

  if (!order) return null;

  const canChangeStatus = !TERMINAL_STATUSES.includes(order.status);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/dashboard')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <HomeIcon fontSize="small" />
          Inicio
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/orders')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ShoppingCartIcon fontSize="small" />
          Pedidos
        </Link>
        <Typography color="text.primary">{order.order_number}</Typography>
      </Breadcrumbs>

      {/* Success snackbar */}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Status error */}
      {statusError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setStatusError(null)}>
          {statusError}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/orders')}
              sx={{ mr: 1 }}
            >
              Volver
            </Button>
            <Typography variant="h5" fontWeight="bold">
              {order.order_number}
            </Typography>
            <Chip
              label={order.status}
              sx={{
                bgcolor: STATUS_COLORS[order.status] || '#9E9E9E',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Creado el {formatDate(order.created_at)}
            {order.created_by_name && ` por ${order.created_by_name}`}
          </Typography>
        </Box>

        {canChangeStatus && (
          <Button
            variant="contained"
            startIcon={<SwapHorizIcon />}
            onClick={() => setStatusModalOpen(true)}
          >
            Cambiar Estado
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Left column: order info + items */}
        <Grid item xs={12} md={8}>
          {/* Order info */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Información del Pedido
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  CLIENTE
                </Typography>
                <Typography variant="body2">
                  {order.customer?.nombre_razon_social || '-'}
                </Typography>
                {order.customer?.correo && (
                  <Typography variant="body2" color="text.secondary">
                    {order.customer.correo}
                  </Typography>
                )}
                {order.customer?.telefono_movil && (
                  <Typography variant="body2" color="text.secondary">
                    {order.customer.telefono_movil}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  PAGO
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={order.payment_status}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Grid>
              {order.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    NOTAS
                  </Typography>
                  <Typography variant="body2">{order.notes}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Items table */}
          <Paper variant="outlined" sx={{ mb: 3 }}>
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Productos ({order.items_count})
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Cant.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio Unit.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(order.items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2">{item.product_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.product_sku}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{item.quantity}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(item.unit_price)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.subtotal)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals */}
            <Box sx={{ p: 2, maxWidth: 300, ml: 'auto' }}>
              <InfoRow label="Subtotal" value={formatCurrency(order.subtotal)} />
              {order.tax_percentage > 0 && (
                <InfoRow
                  label={`IVA (${order.tax_percentage}%)`}
                  value={formatCurrency(order.tax_amount)}
                />
              )}
              {order.shipping_cost > 0 && (
                <InfoRow label="Envío" value={formatCurrency(order.shipping_cost)} />
              )}
              {order.discount_amount > 0 && (
                <InfoRow label="Descuento" value={`-${formatCurrency(order.discount_amount)}`} />
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body1" fontWeight="bold">Total</Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {formatCurrency(order.total)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right column: status history timeline */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Historial de Estados
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <StatusTimeline history={order.status_history || []} />
          </Paper>
        </Grid>
      </Grid>

      {/* Status change modal */}
      {statusModalOpen && (
        <StatusChangeModal
          currentStatus={order.status}
          onConfirm={handleStatusChange}
          onClose={() => {
            setStatusModalOpen(false);
            setStatusError(null);
          }}
          loading={changingStatus}
        />
      )}
    </Container>
  );
};

export default OrderDetail;
