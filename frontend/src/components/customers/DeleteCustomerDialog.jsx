/**
 * DeleteCustomerDialog Component
 * US-CUST-006: Eliminar Cliente
 *
 * CA-3: Modal de confirmación con información del cliente
 * CA-4: Validación de confirmación (escribir "ELIMINAR")
 * CA-7: Confirmación post-eliminación
 * CA-10: Alternativa recomendada (sugerir inactivar)
 */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  PersonOff as PersonOffIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import customerService from '../../services/customerService';

const CONFIRMATION_TEXT = 'ELIMINAR';

const DeleteCustomerDialog = ({
  open,
  onClose,
  customer,
  onDeleted,
  onInactivate,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingDelete, setCheckingDelete] = useState(false);
  const [canDelete, setCanDelete] = useState(true);
  const [ordersCount, setOrdersCount] = useState(0);
  const [error, setError] = useState(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open && customer) {
      setConfirmationInput('');
      setReason('');
      setError(null);
      checkCanDelete();
    }
  }, [open, customer]);

  // CA-2: Check if customer can be deleted
  const checkCanDelete = async () => {
    if (!customer) return;

    setCheckingDelete(true);
    try {
      const response = await customerService.canDeleteCustomer(customer.id);
      if (response.success) {
        setCanDelete(response.data.can_delete);
        setOrdersCount(response.data.orders_count);
      }
    } catch (err) {
      // If check fails, allow attempt (backend will validate)
      setCanDelete(true);
      setOrdersCount(0);
    } finally {
      setCheckingDelete(false);
    }
  };

  // CA-4: Validate confirmation text
  const isConfirmationValid = confirmationInput.toUpperCase() === CONFIRMATION_TEXT;

  // Handle delete
  const handleDelete = async () => {
    if (!isConfirmationValid || !customer) return;

    setLoading(true);
    setError(null);

    try {
      const response = await customerService.deleteCustomer(customer.id, reason || null);

      if (response.success) {
        onDeleted?.(response);
        onClose();
      } else {
        setError(response.error?.message || 'Error al eliminar cliente');
      }
    } catch (err) {
      // CA-2: Handle orders error specifically
      if (err.error?.code === 'HAS_ORDERS') {
        setCanDelete(false);
        setOrdersCount(err.error.orders_count || 0);
        setError(err.error.message);
      } else {
        setError(err.error?.message || 'Error al eliminar cliente');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle inactivate suggestion
  const handleInactivate = () => {
    onInactivate?.(customer);
    onClose();
  };

  if (!customer) return null;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      {/* CA-3: Title with warning color */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <WarningIcon color="error" />
        ¿Eliminar cliente?
      </DialogTitle>

      <DialogContent>
        {checkingDelete ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* CA-2: Error if has orders */}
            {!canDelete && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>No se puede eliminar</AlertTitle>
                Este cliente tiene <strong>{ordersCount} pedido(s)</strong> asociado(s) y no puede ser eliminado permanentemente.
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    En su lugar, puedes <strong>inactivar</strong> el cliente para que deje de aparecer en búsquedas y listas activas.
                  </Typography>
                </Box>
              </Alert>
            )}

            {/* Show delete form only if can delete */}
            {canDelete && (
              <>
                {/* CA-3: Customer info */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {customer.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {customer.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={customer.is_active ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={customer.is_active ? 'success' : 'default'}
                    />
                    <Chip
                      label={customer.customer_category || 'Regular'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                {/* CA-3: Warning message */}
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>Acción irreversible</AlertTitle>
                  Esta acción eliminará permanentemente a <strong>{customer.full_name}</strong> del sistema y no se puede deshacer.
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Se eliminarán todos los datos del cliente, incluyendo notas y configuraciones.
                    </Typography>
                  </Box>
                </Alert>

                {/* CA-10: Suggest inactivation */}
                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                  <AlertTitle>Alternativa recomendada</AlertTitle>
                  <Typography variant="body2">
                    En lugar de eliminar, considera <strong>inactivar</strong> al cliente:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2, mt: 1 }}>
                    <li>Mantiene el historial completo</li>
                    <li>Preserva la integridad de los datos</li>
                    <li>Se puede reactivar si es necesario</li>
                  </Box>
                </Alert>

                <Divider sx={{ my: 2 }} />

                {/* CA-4: Confirmation input */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Para confirmar la eliminación, escribe <strong>ELIMINAR</strong> en el campo de abajo:
                </Typography>
                <TextField
                  fullWidth
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="Escribe ELIMINAR para confirmar"
                  error={confirmationInput.length > 0 && !isConfirmationValid}
                  helperText={
                    confirmationInput.length > 0 && !isConfirmationValid
                      ? 'Debes escribir ELIMINAR exactamente'
                      : ''
                  }
                  disabled={loading}
                  sx={{ mb: 2 }}
                  autoComplete="off"
                />

                {/* CA-8: Reason field (optional) */}
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  label="Razón de eliminación (opcional)"
                  placeholder="Ej: Cliente duplicado, solicitud del cliente, etc."
                  disabled={loading}
                  inputProps={{ maxLength: 500 }}
                  helperText={`${reason.length}/500 caracteres`}
                />
              </>
            )}

            {/* Error message */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>

        {/* CA-10: Inactivate button when can't delete or as alternative */}
        {(!canDelete || (canDelete && customer.is_active)) && (
          <Button
            variant="outlined"
            color="warning"
            startIcon={<PersonOffIcon />}
            onClick={handleInactivate}
            disabled={loading}
          >
            {canDelete ? 'Inactivar en su lugar' : 'Inactivar cliente'}
          </Button>
        )}

        {/* CA-3 & CA-4: Delete button */}
        {canDelete && (
          <Button
            variant="contained"
            color="error"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            onClick={handleDelete}
            disabled={!isConfirmationValid || loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar permanentemente'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeleteCustomerDialog;
