/**
 * StatusChangeModal – Modal para cambiar el estado de un pedido
 * US-ORD-003: CA-3 (cambio de estado UI), CA-4 (notas), CA-2 (flujo de estados)
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
 * @param {function} onConfirm - Callback(newStatus, notes)
 * @param {function} onClose - Callback al cerrar
 * @param {boolean} loading - Estado de carga mientras se guarda
 */
const StatusChangeModal = ({ currentStatus, onConfirm, onClose, loading = false }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [notes, setNotes] = useState('');

  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

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
                  onClick={() => setSelectedStatus(status)}
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
                  mb: 3,
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

export default StatusChangeModal;
