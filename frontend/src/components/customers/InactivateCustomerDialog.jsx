/**
 * InactivateCustomerDialog - Modal de confirmación para inactivar/reactivar cliente
 * US-CUST-008: Inactivar/Activar Cliente
 * CA-2: Dialog de inactivación con campo de motivo
 * CA-6: Dialog de reactivación con campo de motivo
 */
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  PersonOff as PersonOffIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import customerService from '../../services/customerService';

export default function InactivateCustomerDialog({ open, onClose, customer, onSuccess, mode = 'deactivate' }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isDeactivate = mode === 'deactivate';

  const handleClose = () => {
    if (loading) return;
    setReason('');
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = isDeactivate
        ? await customerService.deactivateCustomer(customer.id, reason.trim() || null)
        : await customerService.activateCustomer(customer.id, reason.trim() || null);

      if (response.success) {
        setReason('');
        setError(null);
        onSuccess(response);
      } else {
        setError(response.error?.message || 'Error al cambiar estado del cliente');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cambiar estado del cliente');
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isDeactivate
          ? <PersonOffIcon color="warning" />
          : <PersonAddIcon color="success" />}
        {isDeactivate
          ? `¿Inactivar cliente ${customer.nombre_razon_social}?`
          : `¿Reactivar cliente ${customer.nombre_razon_social}?`}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity={isDeactivate ? 'warning' : 'info'} sx={{ mb: 2 }}>
          {isDeactivate ? (
            <Typography variant="body2">
              El cliente dejará de aparecer en las búsquedas por defecto y no podrá recibir nuevos pedidos mientras esté inactivo.
            </Typography>
          ) : (
            <Typography variant="body2">
              El cliente volverá a estar disponible en búsquedas y podrá recibir nuevos pedidos.
            </Typography>
          )}
        </Alert>

        <TextField
          label={isDeactivate ? 'Motivo de inactivación' : 'Motivo de reactivación'}
          placeholder="Opcional"
          multiline
          rows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 200))}
          inputProps={{ maxLength: 200 }}
          helperText={`${reason.length}/200`}
          disabled={loading}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color={isDeactivate ? 'warning' : 'success'}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : (isDeactivate ? <PersonOffIcon /> : <PersonAddIcon />)}
        >
          {loading
            ? (isDeactivate ? 'Inactivando...' : 'Reactivando...')
            : (isDeactivate ? 'Inactivar' : 'Reactivar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
