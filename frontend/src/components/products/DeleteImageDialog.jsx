import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import productService from '../../services/productService';

/**
 * DeleteImageDialog Component
 * US-PROD-009 CA-9: Confirmar y eliminar imagen de producto
 *
 * Modal de confirmación para eliminar la imagen de un producto
 * La imagen se elimina del servidor y se reemplaza por la imagen por defecto
 */
const DeleteImageDialog = ({ open, onClose, product, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Maneja la eliminación de la imagen
   */
  const handleDelete = async () => {
    if (!product || !product.id) return;

    setLoading(true);
    setError('');

    try {
      const response = await productService.deleteProductImage(product.id);

      if (response.success) {
        // Llamar al callback de éxito con la nueva URL de imagen
        if (onSuccess) {
          onSuccess(response.data.image_url);
        }
        onClose();
      } else {
        setError(response.error?.message || 'Error al eliminar la imagen');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al eliminar la imagen');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el cierre del diálogo
   */
  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            ¿Eliminar imagen del producto?
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" gutterBottom>
          Esta acción eliminará la imagen actual del producto:
        </Typography>

        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            border: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="subtitle2" color="textSecondary">
            Producto:
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {product?.name || 'N/A'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            SKU: {product?.sku || 'N/A'}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          El producto mantendrá todos sus datos pero mostrará una imagen por defecto.
          Puedes agregar una nueva imagen en cualquier momento editando el producto.
        </Alert>

        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Esta acción no se puede deshacer. El archivo de imagen se eliminará permanentemente del servidor.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleDelete}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Eliminando...' : 'Eliminar Imagen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteImageDialog;
