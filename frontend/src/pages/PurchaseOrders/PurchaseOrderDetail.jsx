/**
 * PurchaseOrderDetail – Vista detallada de la orden de compra
 * US-SUPP-009: CA-1 a CA-7
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CancelIcon from '@mui/icons-material/Cancel';
import purchaseOrderService from '../../services/purchaseOrderService';
import { PURCHASE_ORDER_STATUS_COLORS } from './PurchaseOrderList';
import PurchaseOrderStatusModal from '../../components/purchaseOrders/PurchaseOrderStatusModal';

const STATUS_ICONS = {
  Pendiente: AccessTimeIcon,
  Confirmada: CheckCircleIcon,
  'En Tránsito': LocalShippingIcon,
  Recibida: DoneAllIcon,
  Cancelada: CancelIcon,
};

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

const formatDateShort = (isoString) => {
  if (!isoString) return '-';
  return new Date(`${isoString}T00:00:00`).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight="medium">{value}</Typography>
  </Box>
);

/** CA-5: Historial de cambios de estado */
const StatusTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin historial de estados.
      </Typography>
    );
  }

  return (
    <Box>
      {history.map((entry, index) => {
        const color = PURCHASE_ORDER_STATUS_COLORS[entry.status] || '#9E9E9E';
        const Icon = STATUS_ICONS[entry.status] || RadioButtonUncheckedIcon;
        const isLast = index === history.length - 1;

        return (
          <Box key={entry.id} sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                <Icon sx={{ color: 'white', fontSize: 18 }} />
              </Box>
              {!isLast && (
                <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'grey.300', my: 0.5, minHeight: 24 }} />
              )}
            </Box>

            <Paper
              variant="outlined"
              sx={{ p: 1.5, mb: isLast ? 0 : 2, flex: 1, borderLeft: `3px solid ${color}` }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                {entry.previous_status && (
                  <>
                    <Chip
                      label={entry.previous_status}
                      size="small"
                      sx={{ bgcolor: PURCHASE_ORDER_STATUS_COLORS[entry.previous_status] || '#9E9E9E', color: 'white', fontSize: '0.7rem' }}
                    />
                    <Typography variant="caption" color="text.secondary">→</Typography>
                  </>
                )}
                <Chip
                  label={entry.status}
                  size="small"
                  sx={{ bgcolor: color, color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary" display="block">
                {formatDate(entry.created_at)}
                {entry.changed_by_name && ` · ${entry.changed_by_name}`}
              </Typography>

              {entry.notes && (
                <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                  {entry.notes}
                </Typography>
              )}
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
};

const PurchaseOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await purchaseOrderService.getPurchaseOrder(id);
      setOrder(result.data);
    } catch (err) {
      setError(err?.error?.message || 'Error al cargar la orden de compra');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusConfirm = async (newStatus, notes) => {
    setStatusLoading(true);
    try {
      await purchaseOrderService.updateStatus(id, newStatus, notes);
      setStatusModalOpen(false);
      setSuccessMessage(`Estado actualizado a "${newStatus}"`);
      fetchOrder();
    } catch (err) {
      setError(err?.error?.message || 'Error al actualizar estado');
      setStatusModalOpen(false);
    } finally {
      setStatusLoading(false);
    }
  };

  // CA-7: Imprimir
  const handlePrint = () => window.print();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton height={40} width={300} sx={{ mb: 2 }} />
        <Skeleton height={200} sx={{ mb: 2 }} />
        <Skeleton height={300} />
      </Container>
    );
  }

  if (error && !order) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchase-orders')}>
          Volver a Órdenes de Compra
        </Button>
      </Container>
    );
  }

  if (!order) return null;

  const isPending = order.status === 'Pendiente';

  return (
    <Container maxWidth="lg" sx={{ py: 3 }} className="print-container">
      {/* Breadcrumbs — ocultos al imprimir */}
      <Breadcrumbs sx={{ mb: 2 }} className="no-print">
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
          onClick={() => navigate('/purchase-orders')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <LocalShippingIcon fontSize="small" />
          Órdenes de Compra
        </Link>
        <Typography color="text.primary">{order.order_number}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" fontWeight="bold">{order.order_number}</Typography>
            {/* CA-4: Estado actual */}
            <Chip
              label={order.status}
              sx={{
                bgcolor: PURCHASE_ORDER_STATUS_COLORS[order.status] || '#9E9E9E',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Creada el {formatDate(order.created_at)}
          </Typography>
        </Box>

        {/* CA-6: Botones de acción */}
        <Box sx={{ display: 'flex', gap: 1 }} className="no-print">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchase-orders')}>
            Volver
          </Button>
          {isPending && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/purchase-orders/${id}/edit`)}
            >
              Editar
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<SwapHorizIcon />}
            onClick={() => setStatusModalOpen(true)}
          >
            Cambiar Estado
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Imprimir
          </Button>
        </Box>
      </Box>

      {/* Snackbar de éxito */}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        className="no-print"
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)} className="no-print">
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* CA-1: Información general */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Proveedor
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="body1" fontWeight="medium">{order.supplier?.company_name}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Contacto: {order.supplier?.contact_name || '-'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
              {order.supplier?.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">{order.supplier.email}</Typography>
                </Box>
              )}
              {order.supplier?.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{order.supplier.phone}</Typography>
                </Box>
              )}
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Fechas
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <InfoRow label="Fecha de creación" value={formatDate(order.created_at)} />
            <InfoRow label="Fecha estimada de entrega" value={order.expected_delivery_date ? formatDateShort(order.expected_delivery_date) : 'No definida'} />
            {order.received_at && <InfoRow label="Fecha de recepción" value={formatDate(order.received_at)} />}
          </Paper>

          {/* CA-2: Productos */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Productos
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell align="center">Solicitado</TableCell>
                    {/* CA-6: Si está recibida, cantidad recibida vs solicitada */}
                    {order.status === 'Recibida' && <TableCell align="center">Recibido</TableCell>}
                    <TableCell align="right">Precio Unit.</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item) => {
                    const discrepancy = order.status === 'Recibida' && item.quantity_received !== item.quantity_ordered;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>
                          <Chip label={item.product_sku} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">{item.quantity_ordered}</TableCell>
                        {order.status === 'Recibida' && (
                          <TableCell align="center">
                            <Tooltip title={item.discrepancy_reason ? `${item.discrepancy_reason}${item.discrepancy_notes ? `: ${item.discrepancy_notes}` : ''}` : ''}>
                              <Typography
                                variant="body2"
                                color={discrepancy ? 'warning.main' : 'text.primary'}
                                fontWeight={discrepancy ? 'bold' : 'normal'}
                              >
                                {item.quantity_received ?? '-'}
                                {discrepancy && ` (${item.discrepancy_reason})`}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                        )}
                        <TableCell align="right">{formatCurrency(item.unit_cost)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Sidebar: Totales + Historial */}
        <Grid item xs={12} md={5}>
          {/* CA-3: Totales */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Totales
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">{formatCurrency(order.subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Envío</Typography>
              <Typography variant="body2">{formatCurrency(order.shipping_cost)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">TOTAL</Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatCurrency(order.total)}
              </Typography>
            </Box>
          </Paper>

          {/* CA-5: Historial de estados */}
          <Paper variant="outlined" sx={{ p: 2 }} className="no-print">
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Historial de Estados
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <StatusTimeline history={order.status_history} />
          </Paper>
        </Grid>
      </Grid>

      {/* Modal cambio de estado */}
      {statusModalOpen && (
        <PurchaseOrderStatusModal
          currentStatus={order.status}
          onConfirm={handleStatusConfirm}
          onClose={() => !statusLoading && setStatusModalOpen(false)}
          loading={statusLoading}
        />
      )}
    </Container>
  );
};

export default PurchaseOrderDetail;
