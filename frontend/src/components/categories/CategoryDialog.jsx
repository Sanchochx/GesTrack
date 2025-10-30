import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Grid,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import categoryService from '../../services/categoryService';

/**
 * CategoryDialog Component
 * US-PROD-007: Manage Categories
 *
 * Modal dialog for creating and editing categories with:
 * - Name and description fields (CA-2, CA-3)
 * - Color picker (CA-8)
 * - Icon selector (CA-8)
 * - Default category checkbox (CA-7)
 * - Validation and error handling
 */
const CategoryDialog = ({ open, onClose, category = null, onSuccess }) => {
  const isEditMode = !!category;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2196F3',
    icon: 'category',
    is_default: false,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Icon options for categories
  const iconOptions = [
    { value: 'category', label: 'Categoría General' },
    { value: 'devices', label: 'Dispositivos' },
    { value: 'computer', label: 'Computadoras' },
    { value: 'phone', label: 'Teléfonos' },
    { value: 'headphones', label: 'Audio' },
    { value: 'camera', label: 'Cámaras' },
    { value: 'watch', label: 'Relojes' },
    { value: 'gamepad', label: 'Gaming' },
    { value: 'print', label: 'Impresoras' },
    { value: 'router', label: 'Redes' },
    { value: 'storage', label: 'Almacenamiento' },
    { value: 'memory', label: 'Memoria' },
    { value: 'build', label: 'Componentes' },
    { value: 'power', label: 'Energía' },
    { value: 'cable', label: 'Cables y Accesorios' },
  ];

  // Color presets
  const colorPresets = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#F44336', // Red
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#FFEB3B', // Yellow
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#E91E63', // Pink
  ];

  // Load category data when editing
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || '#2196F3',
        icon: category.icon || 'category',
        is_default: category.is_default || false,
      });
    }
  }, [category]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Reset form on close
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          color: '#2196F3',
          icon: 'category',
          is_default: false,
        });
        setError(null);
        setFieldErrors({});
      }, 300);
    }
  }, [open]);

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  /**
   * Validate form data
   * US-PROD-007 - CA-2: Field validation
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    } else if (formData.name.length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'La descripción no puede exceder 500 caracteres';
    }

    if (!formData.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.color = 'Color inválido (formato: #RRGGBB)';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   * US-PROD-007 - CA-2: Create category, CA-3: Update category
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let response;
      // Excluir campos read-only antes de enviar
      const { is_default, ...dataToSend } = formData;

      if (isEditMode) {
        response = await categoryService.updateCategory(category.id, dataToSend);
      } else {
        response = await categoryService.createCategory(dataToSend);
      }

      if (response.success) {
        onSuccess && onSuccess(response.data);
        onClose();
      } else {
        setError(response.error?.message || 'Error al guardar la categoría');
      }
    } catch (err) {
      console.error('Error saving category:', err);

      // Handle field-specific errors from backend
      if (err.error?.fields) {
        setFieldErrors(err.error.fields);
      }

      setError(err.error?.message || 'Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditMode ? 'Editar Categoría' : 'Nueva Categoría'}
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ pt: 1 }}>
            <TextField
              label="Nombre"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              error={!!fieldErrors.name}
              helperText={fieldErrors.name || 'Nombre único de la categoría'}
              disabled={loading}
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 100 }}
            />

            <TextField
              label="Descripción"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              error={!!fieldErrors.description}
              helperText={fieldErrors.description || 'Descripción opcional de la categoría'}
              disabled={loading}
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 500 }}
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Ícono"
                  name="icon"
                  value={formData.icon}
                  onChange={handleChange}
                  fullWidth
                  select
                  error={!!fieldErrors.icon}
                  helperText={fieldErrors.icon || 'Ícono de la categoría'}
                  disabled={loading}
                >
                  {iconOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  fullWidth
                  error={!!fieldErrors.color}
                  helperText={fieldErrors.color || 'Color en formato #RRGGBB'}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CircleIcon sx={{ color: formData.color }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {/* Color Presets */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                Colores predefinidos:
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {colorPresets.map((color) => (
                  <Box
                    key={color}
                    onClick={() => !loading && setFormData((prev) => ({ ...prev, color }))}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: color,
                      borderRadius: 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                      '&:hover': {
                        opacity: loading ? 1 : 0.8,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {!isEditMode && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    disabled={loading}
                  />
                }
                label="Establecer como categoría predeterminada"
              />
            )}

            {isEditMode && category?.is_default && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Esta es la categoría predeterminada del sistema
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CategoryDialog;
