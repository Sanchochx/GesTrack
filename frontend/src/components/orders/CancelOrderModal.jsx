/**
 * CancelOrderModal – Modal de confirmación para cancelar un pedido
 * US-ORD-009: CA-2 (botón/estilo), CA-3 (confirmación y motivo), CA-6 (advertencia de pagos)
 */
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Alert,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

export const CANCELLATION_REASONS = [
  'Cliente solicitó cancelación',
  'Producto no disponible',
  'Error en el pedido',
  'Duplicado',
  'Cliente no contactable',
  'Otro',
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

/**
 * @param {Object} order - { order_number, amount_paid }
 * @param {function} onConfirm - Callback({ cancellation_reason, cancellation_reason_detail }) → Promise
 * @param {function} onClose - Callback al cerrar
 * @param {boolean} loading - Estado de carga
 * @param {string} [error] - Mensaje de error a mostrar
 */
const CancelOrderModal = ({ order, onConfirm, onClose, loading = false, error = null }) => {
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [errors, setErrors] = useState({});

  const hasPayments = (order?.amount_paid || 0) > 0;

  const validate = () => {
    const newErrors = {};
    if (!reason) {
      newErrors.reason = 'Seleccione un motivo de cancelación';
    }
    if (reason === 'Otro') {
      if (!reasonDetail.trim()) {
        newErrors.reasonDetail = 'Especifique el motivo de cancelación';
      } else if (reasonDetail.length > 200) {
        newErrors.reasonDetail = 'El motivo no puede exceder 200 caracteres';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm({
      cancellation_reason: reason,
      cancellation_reason_detail: reason === 'Otro' ? reasonDetail.trim() : null,
    });
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <CancelIcon />
        ¿Cancelar pedido {order?.order_number}?
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">Esta acción no se puede deshacer.</Typography>
          <Typography variant="body2">El stock de todos los productos será restaurado.</Typography>
          {hasPayments && (
            <Typography variant="body2">
              Este pedido tiene pagos registrados por {formatCurrency(order.amount_paid)}.
            </Typography>
          )}
        </Alert>

        {/* CA-3: Motivo de cancelación */}
        <FormControl fullWidth error={Boolean(errors.reason)} sx={{ mb: 2 }}>
          <InputLabel>Motivo de cancelación</InputLabel>
          <Select
            value={reason}
            label="Motivo de cancelación"
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((prev) => ({ ...prev, reason: undefined }));
            }}
          >
            {CANCELLATION_REASONS.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
          {errors.reason && <FormHelperText>{errors.reason}</FormHelperText>}
        </FormControl>

        {reason === 'Otro' && (
          <TextField
            label="Especifique el motivo"
            multiline
            rows={2}
            fullWidth
            value={reasonDetail}
            onChange={(e) => {
              setReasonDetail(e.target.value);
              setErrors((prev) => ({ ...prev, reasonDetail: undefined }));
            }}
            error={Boolean(errors.reasonDetail)}
            helperText={errors.reasonDetail || `${reasonDetail.length}/200 caracteres`}
            inputProps={{ maxLength: 200 }}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          No cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelOrderModal;
