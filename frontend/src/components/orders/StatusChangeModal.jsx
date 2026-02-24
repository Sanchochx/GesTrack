/**
 * StatusChangeModal – Modal para cambiar el estado de un pedido
 * US-ORD-003: CA-3 (cambio de estado UI), CA-4 (notas), CA-2 (flujo de estados)
 * US-ORD-004: CA-8 (advertencia de saldo pendiente + override Admin)
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
  Chip,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import authService from '../../services/authService';

/** CA-1: Colores por estado */
export const STATUS_COLORS = {
  Pendiente: '#FFC107',
  Confirmado: '#2196F3',
  Procesando: '#FF9800',
  Enviado: '#9C27B0',
  Entregado: '#4CAF50',
  Cancelado: '#F44336',
};

/** CA-2: Transiciones válidas (igual que backend) */
const VALID_TRANSITIONS = {
  Pendiente: ['Confirmado', 'Cancelado'],
  Confirmado: ['Procesando', 'Cancelado'],
  Procesando: ['Enviado', 'Cancelado'],
  Enviado: ['Entregado', 'Cancelado'],
  Entregado: [],
  Cancelado: [],
};

/**
 * @param {string} currentStatus - Estado actual del pedido
 * @param {function} onConfirm - Callback(newStatus, notes, forceDelivery)
 * @param {function} onClose - Callback al cerrar
 * @param {boolean} loading - Estado de carga mientras se guarda
 * @param {string} paymentStatus - Estado de pago del pedido (CA-8)
 * @param {number} pendingBalance - Saldo pendiente (CA-8)
 */
const StatusChangeModal = ({
  currentStatus,
  onConfirm,
  onClose,
  loading = false,
  paymentStatus = 'Pendiente',
  pendingBalance = 0,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState('');
  const [forceDelivery, setForceDelivery] = useState(false);

  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

  // CA-8: Verificar si el usuario actual es Admin
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';

  // CA-8: Advertencia de saldo pendiente al seleccionar 'Entregado'
  const showPaymentWarning =
    selectedStatus === 'Entregado' && paymentStatus !== 'Pagado' && pendingBalance > 0;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const handleConfirm = () => {
    if (!selectedStatus) return;
    onConfirm(selectedStatus, notes.trim() || null, forceDelivery);
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedStatus(null);
    setNotes('');
    setForceDelivery(false);
    onClose();
  };

  const handleSelectStatus = (status) => {
    setSelectedStatus(status);
    setForceDelivery(false);
  };

  // CA-8: El botón confirmar está deshabilitado si hay advertencia de pago y no se ha forzado (y no es admin)
  const isConfirmDisabled =
    !selectedStatus ||
    loading ||
    (showPaymentWarning && !isAdmin) ||
    (showPaymentWarning && isAdmin && !forceDelivery);

  return (
    <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cambiar Estado del Pedido</DialogTitle>

      <DialogContent dividers>
        {/* Estado actual */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Estado actual
          </Typography>
          <Chip
            label={currentStatus}
            sx={{
              bgcolor: STATUS_COLORS[currentStatus] || '#9E9E9E',
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>

        {/* Selección de nuevo estado */}
        {allowedTransitions.length === 0 ? (
          <Alert severity="info">
            Este pedido no puede cambiar de estado.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Seleccionar nuevo estado
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {allowedTransitions.map((status) => (
                <Chip
                  key={status}
                  label={status}
                  clickable
                  onClick={() => handleSelectStatus(status)}
                  sx={{
                    bgcolor: selectedStatus === status
                      ? STATUS_COLORS[status] || '#9E9E9E'
                      : 'transparent',
                    color: selectedStatus === status ? 'white' : STATUS_COLORS[status] || '#9E9E9E',
                    border: `2px solid ${STATUS_COLORS[status] || '#9E9E9E'}`,
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: STATUS_COLORS[status] || '#9E9E9E',
                      color: 'white',
                      opacity: 0.85,
                    },
                  }}
                />
              ))}
            </Box>

            {/* Confirmación de transición */}
            {selectedStatus && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  p: 1.5,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                }}
              >
                <Chip
                  label={currentStatus}
                  size="small"
                  sx={{ bgcolor: STATUS_COLORS[currentStatus] || '#9E9E9E', color: 'white' }}
                />
                <ArrowForwardIcon fontSize="small" color="action" />
                <Chip
                  label={selectedStatus}
                  size="small"
                  sx={{ bgcolor: STATUS_COLORS[selectedStatus] || '#9E9E9E', color: 'white' }}
                />
              </Box>
            )}

            {/* CA-8: Advertencia de saldo pendiente */}
            {showPaymentWarning && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Hay saldo pendiente de pago: {formatCurrency(pendingBalance)}
                </Typography>
                <Typography variant="body2">
                  El pedido no está completamente pagado. Se recomienda registrar el pago antes de marcarlo como Entregado.
                </Typography>
                {isAdmin && (
                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={
                      <Checkbox
                        checked={forceDelivery}
                        onChange={(e) => setForceDelivery(e.target.checked)}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Forzar entrega (como Administrador, con saldo pendiente)
                      </Typography>
                    }
                  />
                )}
              </Alert>
            )}

            {/* Notas (CA-4) */}
            <TextField
              label="Notas (opcional)"
              multiline
              rows={3}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              inputProps={{ maxLength: 500 }}
              placeholder="Ej: Número de guía, nombre de quien recibió..."
              helperText={`${notes.length}/500 caracteres`}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        {allowedTransitions.length > 0 && (
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? 'Guardando...' : 'Confirmar Cambio'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default StatusChangeModal;
