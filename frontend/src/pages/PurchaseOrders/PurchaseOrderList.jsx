/**
 * PurchaseOrderList – Listado de órdenes de compra
 * US-SUPP-006: CA-1 (tabla), CA-2 (paginación), CA-3 (ordenamiento),
 *              CA-4 (colores estado), CA-5 (crear), CA-6 (totales), CA-7 (atrasadas)
 * US-SUPP-007: CA-2 (cambio de estado), CA-5 (notas)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Divider,
  Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import InventoryIcon from '@mui/icons-material/Inventory';
import purchaseOrderService from '../../services/purchaseOrderService';
import PurchaseOrderStatusModal from '../../components/purchaseOrders/PurchaseOrderStatusModal';
import ReceivePurchaseOrderModal from '../../components/purchaseOrders/ReceivePurchaseOrderModal';

// US-SUPP-007: Estados disponibles para órdenes de compra
export const PURCHASE_ORDER_STATUS_COLORS = {
  Pendiente: '#FFA726',
  Confirmada: '#42A5F5',
  'En Tránsito': '#AB47BC',
  Recibida: '#66BB6A',
  Cancelada: '#EF5350',
};

const TERMINAL_STATUSES = ['Recibida', 'Cancelada'];

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

// CA-7: Una orden está atrasada si tiene fecha estimada pasada y no está en un estado terminal
const isOverdue = (order) => {
  if (!order.expected_delivery_date || TERMINAL_STATUSES.includes(order.status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${order.expected_delivery_date}T00:00:00`) < today;
};

const PurchaseOrderList = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [metrics, setMetrics] = useState({ total_orders: 0, total_amount: 0 });

  // US-SUPP-007: Menú de acciones y modal de cambio de estado
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuOrder, setActionMenuOrder] = useState(null);
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // US-SUPP-008: Modal de recepción de mercancía
  const [receiveModalOrder, setReceiveModalOrder] = useState(null);
  const [receiveLoading, setReceiveLoading] = useState(false);

  // CA-2: Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  // CA-3: Ordenamiento
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

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
      const response = await purchaseOrderService.getPurchaseOrders(params);
      setOrders(response.data || []);
      setTotal(response.pagination?.total || 0);
      if (response.metrics) setMetrics(response.metrics);
    } catch (err) {
      setError(err?.error?.message || 'Error al cargar órdenes de compra');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder]);

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

  const getSortDirection = (col) => (sortBy === col ? sortOrder : 'asc');

  // US-SUPP-007: Menú de acciones
  const openActionMenu = (e, order) => {
    e.stopPropagation();
    setActionMenuAnchor(e.currentTarget);
    setActionMenuOrder(order);
  };

  const closeActionMenu = () => {
    setActionMenuAnchor(null);
    setActionMenuOrder(null);
  };

  const handleOpenStatusModal = () => {
    setStatusModalOrder(actionMenuOrder);
    closeActionMenu();
  };

  const handleStatusConfirm = async (newStatus, notes) => {
    setStatusLoading(true);
    try {
      await purchaseOrderService.updateStatus(statusModalOrder.id, newStatus, notes);
      setStatusModalOrder(null);
      setSuccessMessage(`Estado de la orden ${statusModalOrder.order_number} actualizado a "${newStatus}"`);
      fetchOrders();
    } catch (err) {
      setError(err?.error?.message || 'Error al actualizar estado');
      setStatusModalOrder(null);
    } finally {
      setStatusLoading(false);
    }
  };

  // US-SUPP-008: Recibir mercancía
  const handleOpenReceiveModal = () => {
    setReceiveModalOrder(actionMenuOrder);
    closeActionMenu();
  };

  const handleReceiveConfirm = async (items) => {
    setReceiveLoading(true);
    try {
      const result = await purchaseOrderService.receivePurchaseOrder(receiveModalOrder.id, items);
      setReceiveModalOrder(null);
      setSuccessMessage(result.message || `Mercancía de la orden ${receiveModalOrder.order_number} recibida exitosamente`);
      fetchOrders();
    } catch (err) {
      setError(err?.error?.message || 'Error al registrar la recepción de mercancía');
      setReceiveModalOrder(null);
    } finally {
      setReceiveLoading(false);
    }
  };

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

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <LocalShippingIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography color="text.secondary" variant="body1">
            No hay órdenes de compra registradas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/purchase-orders/new')}
          >
            Crear primera orden de compra
          </Button>
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
          <LocalShippingIcon fontSize="small" />
          Órdenes de Compra
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Órdenes de Compra
        </Typography>
        {/* CA-5: Botón crear */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/purchase-orders/new')}
        >
          Nueva Orden de Compra
        </Button>
      </Box>

      {/* CA-6: Panel de métricas */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm="auto">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total órdenes
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {metrics.total_orders.toLocaleString('es-CO')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm="auto">
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Monto total
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {formatCurrency(metrics.total_amount)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

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

      {/* CA-1: Tabla de órdenes de compra */}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortBy === 'supplier'}
                    direction={getSortDirection('supplier')}
                    onClick={() => handleSortChange('supplier')}
                  >
                    Proveedor
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
                <TableCell sx={{ fontWeight: 'bold' }}>Entrega Estimada</TableCell>
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
                <TableCell sx={{ fontWeight: 'bold', width: 60 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? renderSkeletonRows() : orders.length === 0 ? renderEmptyState() : orders.map((order) => {
                const overdue = isOverdue(order);
                return (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{ cursor: 'pointer', bgcolor: overdue ? 'error.50' : 'inherit' }}
                    onClick={() => navigate(`/purchase-orders/${order.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.supplier_name || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {/* CA-7: Alerta de orden atrasada */}
                        {overdue && (
                          <Tooltip title="Fecha estimada de entrega pasada">
                            <WarningAmberIcon fontSize="small" sx={{ color: 'error.main' }} />
                          </Tooltip>
                        )}
                        <Typography
                          variant="body2"
                          color={overdue ? 'error.main' : 'text.secondary'}
                          fontWeight={overdue ? 'bold' : 'normal'}
                        >
                          {formatDate(order.expected_delivery_date)}
                        </Typography>
                      </Box>
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
                          bgcolor: PURCHASE_ORDER_STATUS_COLORS[order.status] || '#9E9E9E',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ px: 0.5 }}>
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

      {/* US-SUPP-007: Menú contextual de acciones */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={closeActionMenu}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleOpenStatusModal}>
          <SwapHorizIcon fontSize="small" sx={{ mr: 1 }} />
          Cambiar estado
        </MenuItem>
        {/* US-SUPP-008 CA-1: Solo disponible en estado "En Tránsito" */}
        {actionMenuOrder?.status === 'En Tránsito' && (
          <MenuItem onClick={handleOpenReceiveModal}>
            <InventoryIcon fontSize="small" sx={{ mr: 1 }} />
            Recibir mercancía
          </MenuItem>
        )}
      </Menu>

      {/* US-SUPP-007: Modal cambio de estado */}
      {statusModalOrder && (
        <PurchaseOrderStatusModal
          currentStatus={statusModalOrder.status}
          onConfirm={handleStatusConfirm}
          onClose={() => !statusLoading && setStatusModalOrder(null)}
          loading={statusLoading}
        />
      )}

      {/* US-SUPP-008: Modal de recepción de mercancía */}
      {receiveModalOrder && (
        <ReceivePurchaseOrderModal
          purchaseOrderId={receiveModalOrder.id}
          orderNumber={receiveModalOrder.order_number}
          onConfirm={handleReceiveConfirm}
          onClose={() => !receiveLoading && setReceiveModalOrder(null)}
          loading={receiveLoading}
        />
      )}
    </Container>
  );
};

export default PurchaseOrderList;
