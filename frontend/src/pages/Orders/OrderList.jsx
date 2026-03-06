/**
 * OrderList – Listado de pedidos
 * US-ORD-005: CA-1 (tabla), CA-2 (paginación), CA-3 (ordenamiento),
 *             CA-4 (colores), CA-5 (crear), CA-6 (métricas), CA-7 (acciones),
 *             CA-8 (indicadores), CA-9 (estados vacíos), CA-10 (skeleton)
 * US-ORD-003: CA-1 (colores por estado), CA-2 (visibilidad de estado)
 * US-ORD-004: CA-9 (colores estado pago, tooltip saldo, filtro por estado pago)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  Menu,
  Grid,
  Divider,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PaymentIcon from '@mui/icons-material/Payment';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import orderService from '../../services/orderService';
import { STATUS_COLORS } from '../../components/orders/StatusChangeModal';
import { PAYMENT_STATUS_COLORS } from './OrderDetail';
import StatusChangeModal from '../../components/orders/StatusChangeModal';
import PaymentRegistrationModal from '../../components/orders/PaymentRegistrationModal';

const ALL_STATUSES = ['Pendiente', 'Confirmado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];
const ALL_PAYMENT_STATUSES = ['Pendiente', 'Parcialmente Pagado', 'Pagado'];
const TERMINAL_STATUSES = ['Entregado', 'Cancelado'];
// CA-8: días en Pendiente antes de mostrar alerta
const PENDING_ALERT_DAYS = 3;

const formatDate = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const daysSince = (isoString) => {
  if (!isoString) return 0;
  const diff = Date.now() - new Date(isoString).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// CA-6: Métricas por estado con colores
const STATUS_ORDER = ['Pendiente', 'Confirmado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];

const OrderList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || null);
  const [metrics, setMetrics] = useState({ total_amount: 0, status_counts: {} });

  // CA-2: Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  // CA-3: Ordenamiento
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // CA-7: Menú de acciones
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuOrder, setActionMenuOrder] = useState(null);

  // CA-7: Modales de acción rápida
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Cancelar pedido desde lista
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (paymentStatusFilter) params.payment_status = paymentStatusFilter;

      const response = await orderService.getOrders(params);
      setOrders(response.data || []);
      setTotal(response.pagination?.total || 0);
      if (response.metrics) setMetrics(response.metrics);
    } catch (err) {
      setError(err?.error?.message || 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, paymentStatusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // CA-3: Cambio de columna de ordenamiento
  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handlePaymentStatusFilterChange = (e) => {
    setPaymentStatusFilter(e.target.value);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setPage(0);
  };

  const hasFilters = search || statusFilter || paymentStatusFilter;

  // CA-7: Acciones del menú
  const openActionMenu = (e, order) => {
    e.stopPropagation();
    setActionMenuAnchor(e.currentTarget);
    setActionMenuOrder(order);
  };

  const closeActionMenu = () => {
    setActionMenuAnchor(null);
    setActionMenuOrder(null);
  };

  const handleViewDetail = () => {
    navigate(`/orders/${actionMenuOrder.id}`);
    closeActionMenu();
  };

  const handleOpenStatusModal = () => {
    setStatusModalOrder(actionMenuOrder);
    closeActionMenu();
  };

  const handleOpenPaymentModal = () => {
    setPaymentModalOrder(actionMenuOrder);
    closeActionMenu();
  };

  const handleOpenCancelConfirm = () => {
    setCancelConfirmOrder(actionMenuOrder);
    closeActionMenu();
  };

  const handleStatusConfirm = async (newStatus, notes, forceDelivery) => {
    setStatusLoading(true);
    try {
      await orderService.updateOrderStatus(statusModalOrder.id, newStatus, notes, forceDelivery);
      setStatusModalOrder(null);
      setSuccessMessage(`Estado del pedido ${statusModalOrder.order_number} actualizado a "${newStatus}"`);
      fetchOrders();
    } catch (err) {
      setError(err?.error?.message || 'Error al actualizar estado');
      setStatusModalOrder(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePaymentConfirm = async (paymentData) => {
    setPaymentLoading(true);
    try {
      await orderService.registerPayment(paymentModalOrder.id, paymentData);
      setPaymentModalOrder(null);
      setSuccessMessage(`Pago registrado para el pedido ${paymentModalOrder.order_number}`);
      fetchOrders();
    } catch (err) {
      setError(err?.error?.message || 'Error al registrar pago');
      setPaymentModalOrder(null);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelConfirmOrder) return;
    setCancelLoading(true);
    try {
      await orderService.cancelOrder(cancelConfirmOrder.id);
      setSuccessMessage(`Pedido ${cancelConfirmOrder.order_number} cancelado`);
      setCancelConfirmOrder(null);
      fetchOrders();
    } catch (err) {
      setError(err?.error?.message || 'Error al cancelar pedido');
      setCancelConfirmOrder(null);
    } finally {
      setCancelLoading(false);
    }
  };

  // CA-3: Helper para TableSortLabel
  const getSortDirection = (col) => (sortBy === col ? sortOrder : 'asc');

  // CA-10: Filas skeleton durante carga
  const renderSkeletonRows = () =>
    Array.from({ length: 8 }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({ length: 7 }).map((__, j) => (
          <TableCell key={j}>
            <Skeleton animation="wave" height={24} />
          </TableCell>
        ))}
      </TableRow>
    ));

  // CA-9: Estado vacío
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          {hasFilters ? (
            <>
              <Typography color="text.secondary" variant="body1">
                No se encontraron pedidos con los filtros aplicados
              </Typography>
              <Button
                size="small"
                startIcon={<FilterListOffIcon />}
                onClick={clearFilters}
                variant="outlined"
              >
                Limpiar filtros
              </Button>
            </>
          ) : (
            <>
              <Typography color="text.secondary" variant="body1">
                No hay pedidos registrados
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/orders/new')}
              >
                Crear primer pedido
              </Button>
            </>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
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
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ShoppingCartIcon fontSize="small" />
          Pedidos
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Pedidos
        </Typography>
        {/* CA-5: Botón crear */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/orders/new')}
        >
          Nuevo Pedido
        </Button>
      </Box>

      {/* CA-6: Panel de métricas */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm="auto">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total pedidos
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {total.toLocaleString('es-CO')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm="auto">
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Ventas totales
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {formatCurrency(metrics.total_amount)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {STATUS_ORDER.filter((s) => metrics.status_counts[s]).map((s) => (
                <Chip
                  key={s}
                  label={`${metrics.status_counts[s]} ${s}`}
                  size="small"
                  sx={{
                    bgcolor: STATUS_COLORS[s] || '#9E9E9E',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Buscar por número o cliente..."
          value={search}
          onChange={handleSearchChange}
          size="small"
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={statusFilter} label="Estado" onChange={handleStatusFilterChange}>
            <MenuItem value="">Todos</MenuItem>
            {ALL_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Estado de Pago</InputLabel>
          <Select value={paymentStatusFilter} label="Estado de Pago" onChange={handlePaymentStatusFilterChange}>
            <MenuItem value="">Todos</MenuItem>
            {ALL_PAYMENT_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {hasFilters && (
          <Button size="small" startIcon={<FilterListOffIcon />} onClick={clearFilters} color="inherit">
            Limpiar
          </Button>
        )}
      </Box>

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

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* CA-1: Tabla de pedidos */}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {/* CA-3: Headers ordenables */}
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortBy === 'order_number'}
                    direction={getSortDirection('order_number')}
                    onClick={() => handleSortChange('order_number')}
                  >
                    Número
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortBy === 'customer_name'}
                    direction={getSortDirection('customer_name')}
                    onClick={() => handleSortChange('customer_name')}
                  >
                    Cliente
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortBy === 'created_at'}
                    direction={getSortDirection('created_at')}
                    onClick={() => handleSortChange('created_at')}
                  >
                    Fecha
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">
                  <TableSortLabel
                    active={sortBy === 'total'}
                    direction={getSortDirection('total')}
                    onClick={() => handleSortChange('total')}
                  >
                    Total
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={getSortDirection('status')}
                    onClick={() => handleSortChange('status')}
                  >
                    Estado
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pago</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 60 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* CA-10: Skeleton durante carga */}
              {loading ? renderSkeletonRows() : orders.length === 0 ? renderEmptyState() : orders.map((order) => {
                // CA-8: Alerta por pedido pendiente antiguo
                const isPendingOld =
                  order.status === 'Pendiente' &&
                  daysSince(order.created_at) >= PENDING_ALERT_DAYS;
                // CA-8: Advertencia de saldo pendiente
                const hasPendingPayment =
                  order.payment_status !== 'Pagado' && order.pending_balance > 0;
                const isEditable = !TERMINAL_STATUSES.includes(order.status);

                return (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {/* CA-8: Icono de alerta pedido antiguo */}
                        {isPendingOld && (
                          <Tooltip title={`Pedido pendiente hace ${daysSince(order.created_at)} días`}>
                            <WarningAmberIcon fontSize="small" sx={{ color: 'warning.main' }} />
                          </Tooltip>
                        )}
                        <Typography variant="body2" fontWeight="medium" color="primary">
                          {order.order_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.customer_name || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(order.total)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {/* CA-4: Badge de estado con color */}
                      <Chip
                        label={order.status}
                        size="small"
                        sx={{
                          bgcolor: STATUS_COLORS[order.status] || '#9E9E9E',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {/* CA-4: Badge de pago con tooltip de saldo */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip
                          title={
                            hasPendingPayment
                              ? `Saldo pendiente: ${formatCurrency(order.pending_balance)}`
                              : ''
                          }
                          disableHoverListener={!hasPendingPayment}
                        >
                          <Chip
                            label={order.payment_status}
                            size="small"
                            sx={{
                              bgcolor: PAYMENT_STATUS_COLORS[order.payment_status] || '#9E9E9E',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              cursor: 'default',
                            }}
                          />
                        </Tooltip>
                        {/* CA-8: Icono de advertencia de pago pendiente */}
                        {hasPendingPayment && (
                          <Tooltip title={`Saldo pendiente: ${formatCurrency(order.pending_balance)}`}>
                            <ErrorOutlineIcon fontSize="small" sx={{ color: 'error.light' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    {/* CA-7: Menú de acciones */}
                    <TableCell onClick={(e) => e.stopPropagation()} sx={{ px: 0.5 }}>
                      <IconButton size="small" onClick={(e) => openActionMenu(e, order)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* CA-2: Paginación */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count !== -1 ? count.toLocaleString('es-CO') : `más de ${to}`}`
          }
        />
      </Paper>

      {/* CA-7: Menú contextual de acciones */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={closeActionMenu}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleViewDetail}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Ver detalles
        </MenuItem>
        {actionMenuOrder && !TERMINAL_STATUSES.includes(actionMenuOrder.status) && (
          <MenuItem onClick={handleOpenStatusModal}>
            <SwapHorizIcon fontSize="small" sx={{ mr: 1 }} />
            Cambiar estado
          </MenuItem>
        )}
        {actionMenuOrder && actionMenuOrder.payment_status !== 'Pagado' && (
          <MenuItem onClick={handleOpenPaymentModal}>
            <PaymentIcon fontSize="small" sx={{ mr: 1 }} />
            Registrar pago
          </MenuItem>
        )}
        {actionMenuOrder && ['Pendiente', 'Confirmado'].includes(actionMenuOrder.status) && (
          <MenuItem onClick={handleOpenCancelConfirm} sx={{ color: 'error.main' }}>
            <CancelIcon fontSize="small" sx={{ mr: 1 }} />
            Cancelar pedido
          </MenuItem>
        )}
      </Menu>

      {/* CA-7: Modal cambio de estado (el componente ya incluye su propio Dialog) */}
      {statusModalOrder && (
        <StatusChangeModal
          currentStatus={statusModalOrder.status}
          paymentStatus={statusModalOrder.payment_status}
          pendingBalance={statusModalOrder.pending_balance}
          onConfirm={handleStatusConfirm}
          onClose={() => !statusLoading && setStatusModalOrder(null)}
          loading={statusLoading}
        />
      )}

      {/* CA-7: Modal registrar pago (el componente ya incluye su propio Dialog) */}
      {paymentModalOrder && (
        <PaymentRegistrationModal
          pendingBalance={paymentModalOrder.pending_balance}
          onConfirm={handlePaymentConfirm}
          onClose={() => !paymentLoading && setPaymentModalOrder(null)}
          loading={paymentLoading}
        />
      )}

      {/* Confirmación de cancelación */}
      <Dialog open={Boolean(cancelConfirmOrder)} onClose={() => !cancelLoading && setCancelConfirmOrder(null)}>
        <DialogTitle>Cancelar pedido</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de cancelar el pedido{' '}
            <strong>{cancelConfirmOrder?.order_number}</strong>? El stock de los productos será
            restaurado automáticamente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelConfirmOrder(null)} disabled={cancelLoading}>
            Volver
          </Button>
          <Button
            onClick={handleCancelConfirm}
            color="error"
            variant="contained"
            disabled={cancelLoading}
          >
            {cancelLoading ? 'Cancelando...' : 'Cancelar pedido'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderList;
