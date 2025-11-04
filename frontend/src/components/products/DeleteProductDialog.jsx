import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  Box,
  Typography,
  Avatar,
  Alert,
  Checkbox,
  FormControlLabel,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import productService from '../../services/productService';
import authService from '../../services/authService';

/**
 * DeleteProductDialog Component
 * US-PROD-006: Eliminar Producto
 *
 * Diálogo de confirmación para eliminar productos con:
 * - CA-1: Solo Admin puede eliminar (botón deshabilitado para otros roles)
 * - CA-2: Modal de confirmación con información del producto
 * - CA-3: Validación de pedidos asociados (backend)
 * - CA-4: Alerta de stock existente con checkbox de confirmación
 * - CA-5: Campo opcional para razón de eliminación
 * - CA-7 & CA-8: Mensajes de éxito y manejo de errores
 */
const DeleteProductDialog = ({ open, product, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState('');
  const [stockConfirmed, setStockConfirmed] = useState(false);
  const [stockWarning, setStockWarning] = useState(false);

  // CA-1: Verificar si el usuario es Admin
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'Admin';

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setReason('');
      setStockConfirmed(false);
      setError(null);
      setStockWarning(product?.stock_quantity > 0);
    }
  }, [open, product]);

  /**
   * Handle delete confirmation
   * CA-4: Validación de stock
   * CA-5: Envío de razón
   */
  const handleDeleteConfirm = async () => {
    if (!product) return;

    // CA-4: Si hay stock y no está confirmado, no permitir
    if (stockWarning && !stockConfirmed) {
      setError('Debes confirmar que deseas eliminar el producto con stock');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      // Preparar opciones para el backend
      const options = {
        reason: reason.trim() || null,
        force_with_stock: stockWarning && stockConfirmed,
      };

      const response = await productService.deleteProduct(product.id, options);

      if (response.success) {
        onDeleted && onDeleted();
        onClose();
      } else {
        // CA-8: Manejo de errores del backend
        setError(response.error?.message || 'Error al eliminar el producto');
      }
    } catch (err) {
      console.error('Error deleting product:', err);

      // CA-3: Manejar error de pedidos asociados
      if (err.error?.code === 'HAS_ASSOCIATED_ORDERS') {
        const details = err.error.details || {};
        setError(
          `No se puede eliminar este producto porque tiene pedidos asociados:\n` +
          `• ${details.purchase_orders_count || 0} órdenes de compra\n` +
          `• ${details.sales_orders_count || 0} pedidos de venta\n\n` +
          `${details.suggestion || 'Puedes marcarlo como inactivo en su lugar'}`
        );
      }
      // CA-4: Manejar error de stock (si falla la validación)
      else if (err.error?.code === 'HAS_STOCK') {
        setError(err.error.message);
        setStockWarning(true);
      }
      // CA-8: Otros errores
      else {
        setError(err.error?.message || 'Error al eliminar el producto');
      }
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!deleting) {
      onClose();
    }
  };

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      {/* CA-2: Título del modal */}
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="error" />
          <Typography variant="h6" component="span">
            ¿Eliminar Producto?
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* CA-2: Información del producto */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            src={product.image_url}
            alt={product.name}
            variant="rounded"
            sx={{ width: 80, height: 80 }}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SKU: {product.sku}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stock actual: {product.stock_quantity} unidades
            </Typography>
          </Box>
        </Box>

        {/* CA-4: Alerta de stock existente */}
        {stockWarning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Este producto tiene {product.stock_quantity} unidades en stock
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={stockConfirmed}
                  onChange={(e) => setStockConfirmed(e.target.checked)}
                  disabled={deleting}
                />
              }
              label="Confirmo que deseo eliminar este producto con stock"
            />
          </Alert>
        )}

        {/* CA-2: Mensaje de advertencia */}
        <DialogContentText sx={{ mb: 2 }}>
          Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este producto?
        </DialogContentText>

        {/* CA-5: Campo opcional para razón */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Razón de eliminación (opcional)"
          placeholder="Ingresa una razón para eliminar este producto..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={deleting}
          sx={{ mb: 2 }}
        />

        {/* CA-8: Mostrar errores */}
        {error && (
          <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
            {error}
          </Alert>
        )}

        {/* CA-1: Mensaje si el usuario no es Admin */}
        {!isAdmin && (
          <Alert severity="info">
            No tienes permisos para eliminar productos. Solo los administradores pueden realizar esta acción.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {/* CA-2: Botón Cancelar */}
        <Button
          onClick={handleClose}
          disabled={deleting}
          color="inherit"
        >
          Cancelar
        </Button>

        {/* CA-2: Botón Eliminar */}
        <Button
          onClick={handleDeleteConfirm}
          color="error"
          variant="contained"
          disabled={
            deleting ||
            !isAdmin ||  // CA-1: Solo Admin puede eliminar
            (stockWarning && !stockConfirmed)  // CA-4: Stock debe estar confirmado
          }
          startIcon={deleting && <CircularProgress size={20} />}
        >
          {deleting ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteProductDialog;
