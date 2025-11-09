/**
 * Página de Ajustes Manuales de Inventario
 * US-INV-002: Ajustes Manuales de Inventario
 * CA-7: Confirmación de Éxito y opciones post-ajuste
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { ArrowBack, History } from '@mui/icons-material';
import ManualAdjustmentForm from '../../components/inventory/ManualAdjustmentForm';
import AdjustmentConfirmDialog from '../../components/inventory/AdjustmentConfirmDialog';
import inventoryService from '../../services/inventoryService';

const ManualAdjustments = () => {
  const navigate = useNavigate();

  // Estados del flujo
  const [adjustmentData, setAdjustmentData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState(null);

  // Estados de confirmación
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmationInfo, setConfirmationInfo] = useState(null);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [adjustmentResult, setAdjustmentResult] = useState(null);

  const handleFormSubmit = async (formData, product, calculatedNewStock) => {
    setAdjustmentData(formData);
    setSelectedProduct(product);
    setNewStock(calculatedNewStock);

    try {
      setLoading(true);
      setError(null);

      // Intentar crear el ajuste
      const response = await inventoryService.createAdjustment(formData);

      if (response.success) {
        // CA-3: Si requiere confirmación, mostrar modal
        if (response.requires_confirmation) {
          setConfirmationInfo(response.data);
          setConfirmDialogOpen(true);
        } else {
          // Ajuste exitoso
          handleAdjustmentSuccess(response);
        }
      }
    } catch (err) {
      console.error('Error creating adjustment:', err);
      setError(err.error?.message || 'Error al crear el ajuste');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAdjustment = async () => {
    try {
      setLoading(true);
      setConfirmDialogOpen(false);

      // Reenviar con confirmed=true
      const confirmedData = {
        ...adjustmentData,
        confirmed: true
      };

      const response = await inventoryService.createAdjustment(confirmedData);

      if (response.success) {
        handleAdjustmentSuccess(response);
      }
    } catch (err) {
      console.error('Error confirming adjustment:', err);
      setError(err.error?.message || 'Error al confirmar el ajuste');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentSuccess = (response) => {
    setAdjustmentResult(response.data);
    setSuccessMessage(response.message);
    setSuccessDialogOpen(true);

    // Limpiar formulario
    setAdjustmentData(null);
    setSelectedProduct(null);
    setNewStock(null);
  };

  const handleAnotherAdjustment = () => {
    setSuccessDialogOpen(false);
    setAdjustmentResult(null);
    setSuccessMessage(null);
    // El formulario se reiniciará automáticamente
  };

  const handleViewHistory = () => {
    // Navegar al historial de movimientos
    // Por ahora, volvemos a productos donde se puede ver el historial
    navigate('/products');
  };

  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/products')}
          >
            Volver
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Ajuste Manual de Inventario
          </Typography>
        </Box>

        {/* Mensaje de error */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Formulario */}
        <ManualAdjustmentForm
          onSuccess={handleFormSubmit}
          onCancel={handleCancel}
        />

        {/* Modal de Confirmación (CA-4) */}
        <AdjustmentConfirmDialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          onConfirm={handleConfirmAdjustment}
          adjustmentData={adjustmentData}
          productName={selectedProduct?.name}
          currentStock={selectedProduct?.stock_quantity}
          newStock={newStock}
          reason={adjustmentData?.reason}
          valueImpact={confirmationInfo?.value_impact}
          isSignificant={confirmationInfo?.is_significant}
        />

        {/* Modal de Éxito (CA-7) */}
        <Dialog
          open={successDialogOpen}
          onClose={() => setSuccessDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            ✅ Ajuste Realizado Correctamente
          </DialogTitle>
          <DialogContent>
            {adjustmentResult && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  {successMessage}
                </Typography>

                {/* Resumen del ajuste */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Resumen del Ajuste:
                  </Typography>
                  <Typography variant="body2">
                    • Producto: {adjustmentResult.product?.name}
                  </Typography>
                  <Typography variant="body2">
                    • Stock anterior: {adjustmentResult.movement?.previous_stock}
                  </Typography>
                  <Typography variant="body2">
                    • Stock nuevo: {adjustmentResult.movement?.new_stock}
                  </Typography>
                  <Typography variant="body2">
                    • Cambio: {adjustmentResult.movement?.quantity > 0 ? '+' : ''}{adjustmentResult.movement?.quantity} unidades
                  </Typography>
                </Box>

                {/* Impacto monetario */}
                {adjustmentResult.value_impact && adjustmentResult.value_impact.cost_price > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Impacto Monetario:
                    </Typography>
                    <Typography variant="body2">
                      {adjustmentResult.value_impact.impact >= 0 ? '+' : ''}${adjustmentResult.value_impact.impact.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {/* Alerta si es ajuste significativo */}
                {adjustmentResult.is_significant && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Este fue un ajuste significativo. Se ha registrado en el historial de auditoría.
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleViewHistory}
              startIcon={<History />}
              variant="outlined"
            >
              Ver Historial
            </Button>
            <Button
              onClick={handleAnotherAdjustment}
              variant="contained"
            >
              Realizar Otro Ajuste
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para mensajes temporales */}
        <Snackbar
          open={!!successMessage && !successDialogOpen}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
        />
      </Box>
    </Container>
  );
};

export default ManualAdjustments;
