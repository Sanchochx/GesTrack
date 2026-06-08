/**
 * OrderDetail – Vista detallada del pedido
 * US-ORD-007: CA-1 a CA-10
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
  Skeleton,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PaymentIcon from '@mui/icons-material/Payment';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import InfoIcon from '@mui/icons-material/Info';
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

/** CA-9: Panel de auditoría colapsable */
const AuditPanel = ({ order }) => (
  <Accordion variant="outlined" sx={{ mt: 2 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon fontSize="small" color="action" />
        <Typography variant="subtitle2" color="text.secondary">
          Información del Sistema
        </Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <InfoRow label="Creado por" value={order.created_by_name || '-'} />
          <InfoRow label="Fecha de creación" value={formatDate(order.created_at)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <InfoRow label="Última modificación" value={formatDate(order.updated_at)} />
          {order.status === 'Cancelado' && order.status_history?.length > 0 && (
            <InfoRow
              label="Fecha de cancelación"
              value={formatDate(
                order.status_history.find((h) => h.status === 'Cancelado')?.created_at
              )}
            />
          )}
        </Grid>
        {order.status === 'Cancelado' && order.status_history?.find((h) => h.status === 'Cancelado')?.notes && (
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Motivo de cancelación:</Typography>
            <Typography variant="body2">
              {order.status_history.find((h) => h.status === 'Cancelado').notes}
            </Typography>
          </Grid>
        )}
      </Grid>
    </AccordionDetails>
  </Accordion>
);

/** CA-5: Progreso de pago visual */
const PaymentProgress = ({ total, amountPaid }) => {
  const percentage = total > 0 ? Math.min(Math.round((amountPaid / total) * 100), 100) : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">Progreso de pago</Typography>
        <Typography variant="caption" fontWeight="bold" color={percentage === 100 ? 'success.main' : 'text.primary'}>
          {percentage}% pagado
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={percentage === 100 ? 'success' : percentage > 0 ? 'warning' : 'error'}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
};

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

  // CA-1: Cancel confirmation dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelNotes, setCancelNotes] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

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

  // CA-1: Cancel handler
  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await orderService.cancelOrder(id, cancelNotes || null);
      setCancelDialogOpen(false);
      setCancelNotes('');
      setSuccessMessage('Pedido cancelado. Stock restaurado.');
      await fetchOrder();
    } catch (err) {
      setCancelError(err?.error?.message || 'Error al cancelar el pedido');
    } finally {
      setCancelling(false);
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
  const canCancel = !TERMINAL_STATUSES.includes(order.status);

  // CA-4: Subtotal neto (after discount)
  const subtotalAfterDiscount = (order.subtotal || 0) - (order.discount_amount || 0);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* CA-10: Breadcrumb */}
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

      {/* Snackbar de éxito */}
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

      {statusError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setStatusError(null)}>
          {statusError}
        </Alert>
      )}
      {paymentError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPaymentError(null)}>
          {paymentError}
        </Alert>
      )}

      {/* CA-1: Header con número, estado, pago y acciones */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
              <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')}>
                Volver
              </Button>
              <Typography variant="h5" fontWeight="bold">{order.order_number}</Typography>
              <Chip
                label={order.status}
                sx={{ bgcolor: STATUS_COLORS[order.status] || '#9E9E9E', color: 'white', fontWeight: 'bold' }}
              />
              <Chip
                label={order.payment_status}
                size="small"
                sx={{ bgcolor: PAYMENT_STATUS_COLORS[order.payment_status] || '#9E9E9E', color: 'white', fontWeight: 'bold' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Creado el {formatDate(order.created_at)}
              {order.created_by_name && ` por ${order.created_by_name}`}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Imprimir pedido">
              <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => window.print()}>
                Imprimir
              </Button>
            </Tooltip>
            <Tooltip title={!canChangeStatus ? 'El pedido está en estado terminal' : ''}>
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  disabled
                >
                  Editar
                </Button>
              </span>
            </Tooltip>
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
                variant="outlined"
                startIcon={<SwapHorizIcon />}
                onClick={() => setStatusModalOpen(true)}
              >
                Cambiar Estado
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancelar Pedido
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Columna izquierda */}
        <Grid item xs={12} md={8}>
          {/* CA-2: Información del cliente */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">Cliente</Typography>
              {order.customer?.id && (
                <Button
                  size="small"
                  startIcon={<HistoryIcon />}
                  onClick={() => navigate(`/customers/${order.customer.id}/orders`)}
                >
                  Ver historial
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                <PersonIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                {order.customer?.id ? (
                  <Link
                    component="button"
                    underline="hover"
                    variant="body1"
                    fontWeight="bold"
                    onClick={() => navigate(`/customers/${order.customer.id}`)}
                  >
                    {order.customer.nombre_razon_social}
                  </Link>
                ) : (
                  <Typography variant="body1" fontWeight="bold">
                    {order.customer?.nombre_razon_social || '-'}
                  </Typography>
                )}
                {order.customer?.correo && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Link href={`mailto:${order.customer.correo}`} variant="body2" color="text.secondary">
                      {order.customer.correo}
                    </Link>
                  </Box>
                )}
                {order.customer?.telefono_movil && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Link href={`tel:${order.customer.telefono_movil}`} variant="body2" color="text.secondary">
                      {order.customer.telefono_movil}
                    </Link>
                  </Box>
                )}
                {/* Dirección */}
                {(order.customer?.direccion || order.customer?.municipio_ciudad) && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {[order.customer.direccion, order.customer.municipio_ciudad, order.customer.departamento]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* CA-3: Tabla de productos */}
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
                    <TableCell sx={{ fontWeight: 'bold', width: 40 }} />
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
                        {item.product_image_url ? (
                          <Avatar
                            src={item.product_image_url}
                            alt={item.product_name}
                            variant="rounded"
                            sx={{ width: 32, height: 32 }}
                          />
                        ) : (
                          <Avatar variant="rounded" sx={{ width: 32, height: 32, bgcolor: 'grey.200' }}>
                            <ShoppingCartIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                          </Avatar>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.product_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{item.product_sku}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{item.quantity}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{formatCurrency(item.unit_price)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">{formatCurrency(item.subtotal)}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* CA-4: Desglose financiero */}
            <Box sx={{ p: 2, maxWidth: 320, ml: 'auto' }}>
              <InfoRow label="Subtotal" value={formatCurrency(order.subtotal)} />
              {order.discount_amount > 0 && (
                <>
                  <InfoRow
                    label="Descuento"
                    value={`-${formatCurrency(order.discount_amount)}`}
                  />
                  <InfoRow
                    label="Subtotal neto"
                    value={formatCurrency(subtotalAfterDiscount)}
                  />
                </>
              )}
              {order.tax_percentage > 0 && (
                <InfoRow
                  label={`IVA (${order.tax_percentage}%)`}
                  value={formatCurrency(order.tax_amount)}
                />
              )}
              {order.shipping_cost > 0 && (
                <InfoRow label="Envío" value={formatCurrency(order.shipping_cost)} />
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body1" fontWeight="bold">Total</Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {formatCurrency(order.total)}
                </Typography>
              </Box>
              {/* CA-4: Justificación del descuento */}
              {order.discount_amount > 0 && order.discount_justification && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Motivo del descuento: {order.discount_justification}
                </Typography>
              )}
            </Box>
          </Paper>

          {/* CA-8: Notas del pedido */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Notas</Typography>
            <Divider sx={{ mb: 1.5 }} />
            {order.notes ? (
              <Typography variant="body2">{order.notes}</Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">Sin notas adicionales.</Typography>
            )}
          </Paper>

          {/* CA-9: Auditoría */}
          <AuditPanel order={order} />
        </Grid>

        {/* Columna derecha */}
        <Grid item xs={12} md={4}>
          {/* CA-5/CA-6: Pagos */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">Pagos</Typography>
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
            {/* CA-5: Barra de progreso */}
            <PaymentProgress total={order.total || 0} amountPaid={order.amount_paid || 0} />
            <PaymentHistory
              payments={order.payments || []}
              amountPaid={order.amount_paid || 0}
              pendingBalance={order.pending_balance || 0}
              total={order.total || 0}
            />
          </Paper>

          {/* CA-7: Timeline de estados */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Historial de Estados
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <StatusTimeline history={order.status_history || []} />
          </Paper>
        </Grid>
      </Grid>

      {/* CA-1: Dialog de cancelación */}
      <Dialog open={cancelDialogOpen} onClose={() => !cancelling && setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancelar pedido {order.order_number}</DialogTitle>
        <DialogContent>
          {cancelError && (
            <Alert severity="error" sx={{ mb: 2 }}>{cancelError}</Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Esta acción cancelará el pedido y restaurará el stock de todos los productos.
          </Typography>
          <TextField
            label="Motivo de cancelación (opcional)"
            multiline
            rows={3}
            fullWidth
            value={cancelNotes}
            onChange={(e) => setCancelNotes(e.target.value)}
            disabled={cancelling}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCancelDialogOpen(false); setCancelNotes(''); setCancelError(null); }} disabled={cancelling}>
            Volver
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelOrder}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelando...' : 'Confirmar cancelación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modales de estado y pago */}
      {statusModalOpen && (
        <StatusChangeModal
          currentStatus={order.status}
          paymentStatus={order.payment_status}
          pendingBalance={order.pending_balance || 0}
          onConfirm={handleStatusChange}
          onClose={() => { setStatusModalOpen(false); setStatusError(null); }}
          loading={changingStatus}
        />
      )}
      {paymentModalOpen && (
        <PaymentRegistrationModal
          pendingBalance={order.pending_balance || 0}
          onConfirm={handleRegisterPayment}
          onClose={() => { setPaymentModalOpen(false); setPaymentError(null); }}
          loading={registeringPayment}
        />
      )}
    </Container>
  );
};

export default OrderDetail;
