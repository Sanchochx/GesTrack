/**
 * Modal de Confirmación de Ajuste de Inventario
 * US-INV-002 CA-4: Confirmación de Ajuste
 */
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import { Warning, TrendingUp, TrendingDown, AttachMoney } from '@mui/icons-material';

const AdjustmentConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  adjustmentData,
  productName,
  currentStock,
  newStock,
  reason,
  valueImpact,
  isSignificant
}) => {
  if (!adjustmentData) return null;

  const isIncrease = adjustmentData.adjustment_type === 'increase';
  const quantity = adjustmentData.quantity;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isSignificant && <Warning color="warning" />}
          Confirmar Ajuste de Inventario
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Advertencia si es ajuste significativo */}
        {isSignificant && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Este ajuste modificará el stock en más del 20%. Por favor, verifica que la información sea correcta.
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {productName}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Información del ajuste */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Stock Actual
            </Typography>
            <Typography variant="h5">
              {currentStock}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Nuevo Stock
            </Typography>
            <Typography variant="h5" color={isIncrease ? 'success.main' : 'error.main'}>
              {newStock}
            </Typography>
          </Grid>
        </Grid>

        {/* Cambio */}
        <Box sx={{ my: 2, p: 2, bgcolor: isIncrease ? 'success.light' : 'error.light', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {isIncrease ? <TrendingUp /> : <TrendingDown />}
            <Typography variant="subtitle1" fontWeight="bold">
              {isIncrease ? 'Aumento' : 'Disminución'} de {quantity} unidades
            </Typography>
          </Box>
          <Typography variant="body2">
            {isIncrease ? '+' : '-'}{quantity} unidades
          </Typography>
        </Box>

        {/* Impacto monetario */}
        {valueImpact && valueImpact.cost_price > 0 && (
          <Box sx={{ my: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AttachMoney />
              <Typography variant="subtitle2" fontWeight="bold">
                Impacto en Valor de Inventario
              </Typography>
            </Box>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Valor Anterior
                </Typography>
                <Typography variant="body2">
                  ${valueImpact.previous_value.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Nuevo Valor
                </Typography>
                <Typography variant="body2">
                  ${valueImpact.new_value.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={valueImpact.impact >= 0 ? 'success.main' : 'error.main'}
                >
                  Impacto: {valueImpact.impact >= 0 ? '+' : ''}${valueImpact.impact.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Motivo */}
        <Box>
          <Typography variant="caption" color="text.secondary">
            Motivo del Ajuste
          </Typography>
          <Typography variant="body1">
            {reason}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={isIncrease ? 'success' : 'error'}
        >
          Confirmar Ajuste
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdjustmentConfirmDialog;
