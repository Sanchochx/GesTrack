/**
 * ReturnsList – Vista global de gestión de devoluciones
 * US-ORD-011: CA-11 (lista global con filtros y paginación), CA-8 (cambio de estado)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
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
  Chip,
  Skeleton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import returnService from '../../services/returnService';
import authService from '../../services/authService';
import { RETURN_STATUS_COLORS } from '../Orders/OrderDetail';

const REFUND_METHODS = ['Reembolso', 'Nota de Crédito', 'Intercambio'];

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

/** CA-9: Diálogo para aprobar una devolución (requiere método de compensación) */
const ApproveReturnDialog = ({ returnObj, onConfirm, onClose, loading, error }) => {
  const [refundMethod, setRefundMethod] = useState('');
  const [refundReference, setRefundReference] = useState('');
  const [methodError, setMethodError] = useState('');

  const handleConfirm = () => {
    if (!refundMethod) {
      setMethodError('Seleccione un método de compensación');
      return;
    }
    onConfirm({ status: 'Aprobada', refund_method: refundMethod, refund_reference: refundReference.trim() || null });
  };

  return (
    <Dialog open onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Aprobar Devolución {returnObj.return_number}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Monto a compensar: {formatCurrency(returnObj.total_amount)}
        </Typography>
        <FormControl fullWidth error={Boolean(methodError)} sx={{ mb: 2 }}>
          <InputLabel>Método de compensación</InputLabel>
          <Select
            value={refundMethod}
            label="Método de compensación"
            onChange={(e) => { setRefundMethod(e.target.value); setMethodError(''); }}
          >
            {REFUND_METHODS.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
          {methodError && <FormHelperText>{methodError}</FormHelperText>}
        </FormControl>
        <TextField
          label="Referencia (opcional)"
          fullWidth
          value={refundReference}
          onChange={(e) => setRefundReference(e.target.value)}
          placeholder="Número de transferencia, código de nota de crédito, etc."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
        >
          {loading ? 'Aprobando...' : 'Aprobar Devolución'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ReturnsList = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuReturn, setActionMenuReturn] = useState(null);

  const [approveTarget, setApproveTarget] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: page + 1, per_page: rowsPerPage };
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await returnService.getReturns(params);
      setReturns(response.data || []);
      setTotal(response.pagination?.total || 0);
    } catch (err) {
      setError(err?.error?.message || 'Error al cargar devoluciones');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const openActionMenu = (e, returnObj) => {
    e.stopPropagation();
    setActionMenuAnchor(e.currentTarget);
    setActionMenuReturn(returnObj);
  };

  const closeActionMenu = () => {
    setActionMenuAnchor(null);
    setActionMenuReturn(null);
  };

  const handleOpenApprove = () => {
    setApproveTarget(actionMenuReturn);
    closeActionMenu();
  };

  const handleApprove = async (statusData) => {
    setProcessing(true);
    setActionError(null);
    try {
      const response = await returnService.updateReturnStatus(approveTarget.id, statusData);
      setApproveTarget(null);
      setSuccessMessage(response.message || 'Devolución aprobada');
      fetchReturns();
    } catch (err) {
      setActionError(err?.error?.message || 'Error al aprobar la devolución');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!actionMenuReturn) return;
    const target = actionMenuReturn;
    closeActionMenu();
    setProcessing(true);
    try {
      const response = await returnService.updateReturnStatus(target.id, { status: 'Rechazada' });
      setSuccessMessage(response.message || 'Devolución rechazada');
      fetchReturns();
    } catch (err) {
      setError(err?.error?.message || 'Error al rechazar la devolución');
    } finally {
      setProcessing(false);
    }
  };

  const canProcess = ['Admin', 'Gerente de Almacén'].includes(currentUser?.role);
  const canReject = currentUser?.role === 'Admin';

  const renderSkeletonRows = () =>
    Array.from({ length: 6 }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({ length: 7 }).map((__, j) => (
          <TableCell key={j}><Skeleton animation="wave" height={24} /></TableCell>
        ))}
      </TableRow>
    ));

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
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
          <AssignmentReturnIcon fontSize="small" />
          Devoluciones
        </Typography>
      </Breadcrumbs>

      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Gestión de Devoluciones
      </Typography>

      {/* CA-11: Filtros */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Aprobada">Aprobada</MenuItem>
                <MenuItem value="Rechazada">Rechazada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              type="date"
              label="Desde"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              type="date"
              label="Hasta"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pedido</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Monto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 60 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? renderSkeletonRows() : returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <AssignmentReturnIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No hay devoluciones registradas</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : returns.map((r) => (
                <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${r.order_id}`)}>
                  <TableCell>
                    <Typography variant="body2" color="primary" fontWeight="medium">{r.return_number}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.order_number}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.customer_name || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{formatDate(r.return_date)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">{formatCurrency(r.total_amount)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.status}
                      size="small"
                      sx={{ bgcolor: RETURN_STATUS_COLORS[r.status] || '#9E9E9E', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} sx={{ px: 0.5 }}>
                    {canProcess && r.status === 'Pendiente' && (
                      <IconButton size="small" onClick={(e) => openActionMenu(e, r)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count.toLocaleString('es-CO') : `más de ${to}`}`}
        />
      </Paper>

      <Menu anchorEl={actionMenuAnchor} open={Boolean(actionMenuAnchor)} onClose={closeActionMenu} onClick={(e) => e.stopPropagation()}>
        <MenuItem onClick={handleOpenApprove}>
          <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
          Aprobar
        </MenuItem>
        {canReject && (
          <MenuItem onClick={handleReject} disabled={processing} sx={{ color: 'error.main' }}>
            <CancelIcon fontSize="small" sx={{ mr: 1 }} />
            Rechazar
          </MenuItem>
        )}
      </Menu>

      {approveTarget && (
        <ApproveReturnDialog
          returnObj={approveTarget}
          onConfirm={handleApprove}
          onClose={() => { if (!processing) { setApproveTarget(null); setActionError(null); } }}
          loading={processing}
          error={actionError}
        />
      )}
    </Container>
  );
};

export default ReturnsList;
