import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import categoryService from '../../services/categoryService';

/**
 * DeleteCategoryDialog Component
 * US-PROD-007: Manage Categories
 *
 * Confirmation dialog for deleting categories with:
 * - Validation to prevent deletion if category has products (CA-4)
 * - Protection for default category (CA-7)
 * - Clear warning messages
 * - Error handling
 */
const DeleteCategoryDialog = ({ open, onClose, category, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle category deletion
   * US-PROD-007 - CA-4: Prevent deletion of categories with products
   */
  const handleDelete = async () => {
    if (!category) return;

    setLoading(true);
    setError(null);

    try {
      const response = await categoryService.deleteCategory(category.id);

      if (response.success) {
        onSuccess && onSuccess();
        onClose();
      } else {
        setError(response.error?.message || 'Error al eliminar la categoría');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.error?.message || 'Error al eliminar la categoría');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  if (!category) return null;

  const hasProducts = category.product_count > 0;
  const isDefault = category.is_default;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Eliminar Categoría
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Default Category Warning */}
        {isDefault && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              No se puede eliminar la categoría predeterminada
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Esta es la categoría predeterminada del sistema y no puede ser eliminada.
              Por favor, establece otra categoría como predeterminada antes de intentar eliminar esta.
            </Typography>
          </Alert>
        )}

        {/* Category with Products Warning */}
        {!isDefault && hasProducts && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Esta categoría tiene {category.product_count} producto(s) asociado(s)
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              No se puede eliminar una categoría que contiene productos.
              Por favor, reasigna o elimina los productos antes de eliminar esta categoría.
            </Typography>
          </Alert>
        )}

        {/* Normal Deletion Confirmation */}
        {!isDefault && !hasProducts && (
          <>
            <DialogContentText>
              ¿Estás seguro de que deseas eliminar la categoría <strong>{category.name}</strong>?
            </DialogContentText>
            <DialogContentText sx={{ mt: 2, color: 'text.secondary' }}>
              Esta acción no se puede deshacer.
            </DialogContentText>

            {/* Category Details */}
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                borderLeft: `4px solid ${category.color || '#2196F3'}`,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Detalles de la categoría:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Nombre:</strong> {category.name}
              </Typography>
              {category.description && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>Descripción:</strong> {category.description}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>Productos:</strong> {category.product_count || 0}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CancelIcon />}
        >
          Cancelar
        </Button>

        {!isDefault && !hasProducts && (
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeleteCategoryDialog;
