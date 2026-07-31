/**
 * PurchaseOrderStatusModal – Modal para cambiar el estado de una orden de compra
 * US-SUPP-007: CA-1 (estados), CA-2 (avanzar/retroceder), CA-5 (notas)
 * US-SUPP-011: La cancelación se maneja mediante un flujo dedicado (CancelPurchaseOrderDialog),
 *              no a través de este modal genérico de cambio de estado.
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
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PURCHASE_ORDER_STATUS_COLORS } from '../../pages/PurchaseOrders/PurchaseOrderList';

// CA-2: Se puede avanzar o retroceder libremente entre estados no terminales.
// CA-6: "Recibida" solo se alcanza mediante el flujo de recepción de mercancía (US-SUPP-008).
const NON_TERMINAL_STATUSES = ['Pendiente', 'Confirmada', 'En Tránsito'];

const getAllowedTransitions = (currentStatus) => {
  if (!NON_TERMINAL_STATUSES.includes(currentStatus)) return [];
  return NON_TERMINAL_STATUSES.filter((s) => s !== currentStatus);
};

const PurchaseOrderStatusModal = ({ currentStatus, onConfirm, onClose, loading = false }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState('');

  const allowedTransitions = getAllowedTransitions(currentStatus);

  const handleConfirm = () => {
    if (!selectedStatus) return;
    onConfirm(selectedStatus, notes.trim() || null);
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedStatus(null);
    setNotes('');
    onClose();
  };

  return (
    <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cambiar Estado de la Orden de Compra</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Estado actual
          </Typography>
          <Chip
            label={currentStatus}
            sx={{
              bgcolor: PURCHASE_ORDER_STATUS_COLORS[currentStatus] || '#9E9E9E',
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>

        {allowedTransitions.length === 0 ? (
          <Alert severity="info">
            Esta orden de compra no puede cambiar de estado.
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
                  onClick={() => setSelectedStatus(status)}
                  sx={{
                    bgcolor: selectedStatus === status
                      ? PURCHASE_ORDER_STATUS_COLORS[status] || '#9E9E9E'
                      : 'transparent',
                    color: selectedStatus === status ? 'white' : PURCHASE_ORDER_STATUS_COLORS[status] || '#9E9E9E',
                    border: `2px solid ${PURCHASE_ORDER_STATUS_COLORS[status] || '#9E9E9E'}`,
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: PURCHASE_ORDER_STATUS_COLORS[status] || '#9E9E9E',
                      color: 'white',
                      opacity: 0.85,
                    },
                  }}
                />
              ))}
            </Box>

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
                  sx={{ bgcolor: PURCHASE_ORDER_STATUS_COLORS[currentStatus] || '#9E9E9E', color: 'white' }}
                />
                <ArrowForwardIcon fontSize="small" color="action" />
                <Chip
                  label={selectedStatus}
                  size="small"
                  sx={{ bgcolor: PURCHASE_ORDER_STATUS_COLORS[selectedStatus] || '#9E9E9E', color: 'white' }}
                />
              </Box>
            )}

            {/* CA-5: Notas del cambio */}
            <TextField
              label="Notas (opcional)"
              multiline
              rows={3}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              inputProps={{ maxLength: 500 }}
              placeholder="Ej: Motivo del cambio, información adicional..."
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
            disabled={!selectedStatus || loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? 'Guardando...' : 'Confirmar Cambio'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseOrderStatusModal;
