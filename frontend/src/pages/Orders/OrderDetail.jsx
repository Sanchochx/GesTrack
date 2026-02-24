/**
 * OrderDetail – Vista detallada del pedido
 * US-ORD-003: CA-3 (cambio de estado), CA-6 (timeline historial)
 * US-ORD-004: CA-2 (registrar pago), CA-3 (saldo), CA-5 (historial pagos), CA-8 (restricción)
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
import PaymentIcon from '@mui/icons-material/Payment';
import orderService from '../../services/orderService';
import { STATUS_COLORS } from '../../components/orders/StatusChangeModal';
import StatusChangeModal from '../../components/orders/StatusChangeModal';
import StatusTimeline from '../../components/orders/StatusTimeline';
import PaymentHistory from '../../components/orders/PaymentHistory';
import PaymentRegistrationModal from '../../components/orders/PaymentRegistrationModal';

/** CA-1: Colores por estado de pago */
export const PAYMENT_STATUS_COLORS = {
  'Pendiente': '#F44336',
  'Parcialmente Pagado': '#FF9800',
  'Pagado': '#4CAF50',
};

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

  // Status change
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // Payment registration
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [registeringPayment, setRegisteringPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

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

  const handleStatusChange = async (newStatus, notes, forceDelivery = false) => {
    setChangingStatus(true);
    setStatusError(null);
    try {
      await orderService.updateOrderStatus(id, newStatus, notes, forceDelivery);
      setStatusModalOpen(false);
      setSuccessMessage(`Estado actualizado a "${newStatus}"`);
      await fetchOrder();
    } catch (err) {
      setStatusError(err?.error?.message || 'Error al cambiar el estado');
    } finally {
      setChangingStatus(false);
    }
  };

  // CA-2/CA-10: Registrar pago
  const handleRegisterPayment = async (paymentData) => {
    setRegisteringPayment(true);
    setPaymentError(null);
    try {
      const response = await orderService.registerPayment(id, paymentData);
      setPaymentModalOpen(false);
      const msg = response.data?.payment_status === 'Pagado'
        ? 'Pedido completamente pagado'
        : response.message || `Pago de ${formatCurrency(paymentData.amount)} registrado exitosamente`;
      setSuccessMessage(msg);
      await fetchOrder();
    } catch (err) {
      setPaymentError(err?.error?.message || 'Error al registrar el pago');
    } finally {
      setRegisteringPayment(false);
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
  const canRegisterPayment = order.status !== 'Cancelado' && order.payment_status !== 'Pagado';

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

      {/* Payment error */}
      {paymentError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPaymentError(null)}>
          {paymentError}
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

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* CA-2: Botón registrar pago */}
          {canRegisterPayment && (
            <Button
              variant="outlined"
              startIcon={<PaymentIcon />}
              onClick={() => setPaymentModalOpen(true)}
              color="success"
            >
              Registrar Pago
            </Button>
          )}
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
                    sx={{
                      bgcolor: PAYMENT_STATUS_COLORS[order.payment_status] || '#9E9E9E',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
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

        {/* Right column: status history + payment section */}
        <Grid item xs={12} md={4}>
          {/* CA-2/CA-5: Historial de pagos */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Pagos
              </Typography>
              {canRegisterPayment && (
                <Button
                  size="small"
                  startIcon={<PaymentIcon />}
                  onClick={() => setPaymentModalOpen(true)}
                  color="success"
                  variant="outlined"
                >
                  Registrar
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <PaymentHistory
              payments={order.payments || []}
              amountPaid={order.amount_paid || 0}
              pendingBalance={order.pending_balance || 0}
              total={order.total || 0}
            />
          </Paper>

          {/* Status history timeline */}
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
          paymentStatus={order.payment_status}
          pendingBalance={order.pending_balance || 0}
          onConfirm={handleStatusChange}
          onClose={() => {
            setStatusModalOpen(false);
            setStatusError(null);
          }}
          loading={changingStatus}
        />
      )}

      {/* Payment registration modal */}
      {paymentModalOpen && (
        <PaymentRegistrationModal
          pendingBalance={order.pending_balance || 0}
          onConfirm={handleRegisterPayment}
          onClose={() => {
            setPaymentModalOpen(false);
            setPaymentError(null);
          }}
          loading={registeringPayment}
        />
      )}
    </Container>
  );
};

export default OrderDetail;
