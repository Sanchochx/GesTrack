/**
 * CancelPurchaseOrderDialog – Modal de confirmación para cancelar una orden de compra
 * US-SUPP-011: CA-2 (confirmación y motivo obligatorio)
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
  Alert,
  CircularProgress,
} from '@mui/material';

const CancelPurchaseOrderDialog = ({ orderNumber, onConfirm, onClose, loading = false }) => {
  const [reason, setReason] = useState('');

  const trimmedReason = reason.trim();
  const isValid = trimmedReason.length > 0 && trimmedReason.length <= 500;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(trimmedReason);
  };

  const handleClose = () => {
    if (loading) return;
    setReason('');
    onClose();
  };

  return (
    <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cancelar Orden de Compra</DialogTitle>

      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta acción cancelará la orden {orderNumber}. La orden no se eliminará, solo cambiará
          a estado "Cancelada" y ya no podrá modificarse.
        </Alert>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Motivo de cancelación (requerido)
        </Typography>
        <TextField
          multiline
          rows={3}
          fullWidth
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          inputProps={{ maxLength: 500 }}
          placeholder="Ej: El proveedor ya no tiene el producto disponible..."
          helperText={`${reason.length}/500 caracteres`}
          error={reason.length > 0 && !isValid}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Volver
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={!isValid || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelPurchaseOrderDialog;
