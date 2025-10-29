import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Grid,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import productService from '../../services/productService';
import ImageUpload from './ImageUpload';

/**
 * ProductForm Component
 * US-PROD-001: Create Product
 *
 * Comprehensive form for creating/editing products with:
 * - All required fields (CA-1)
 * - Real-time SKU validation (CA-2)
 * - Price validation with warning (CA-3)
 * - Live profit margin calculation (CA-4)
 * - Image upload (CA-5)
 * - Error handling (CA-8)
 */
const ProductForm = ({ initialData = null, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const isEditMode = !!initialData;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    cost_price: '',
    sale_price: '',
    initial_stock: '',
    category_id: '',
    image: null,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [skuValidation, setSkuValidation] = useState({ valid: null, message: '' });
  const [skuChecking, setSkuChecking] = useState(false);
  const [profitMargin, setProfitMargin] = useState(null);
  const [showPriceWarning, setShowPriceWarning] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        description: initialData.description || '',
        cost_price: initialData.cost_price || '',
        sale_price: initialData.sale_price || '',
        initial_stock: initialData.current_stock || '',
        category_id: initialData.category_id || '',
        image: null,
      });
    }
  }, [initialData]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Calculate profit margin when prices change (CA-4)
  useEffect(() => {
    calculateProfitMargin();
  }, [formData.cost_price, formData.sale_price]);

  /**
   * Load categories from API
   * US-PROD-001 - CA-1: Category dropdown
   */
  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  /**
   * Calculate profit margin
   * US-PROD-001 - CA-4: Real-time profit margin calculation
   * Formula: ((sale_price - cost_price) / cost_price) * 100
   */
  const calculateProfitMargin = () => {
    const cost = parseFloat(formData.cost_price);
    const sale = parseFloat(formData.sale_price);

    if (cost > 0 && sale > 0) {
      const margin = ((sale - cost) / cost) * 100;
      setProfitMargin(margin);
    } else {
      setProfitMargin(null);
    }
  };

  /**
   * Get margin color based on percentage
   * Green: >30%, Yellow: 15-30%, Red: <15%
   */
  const getMarginColor = (margin) => {
    if (margin > 30) return 'success';
    if (margin >= 15) return 'warning';
    return 'error';
  };

  /**
   * Validate SKU uniqueness
   * US-PROD-001 - CA-2: Real-time SKU validation
   */
  const validateSKU = async (sku) => {
    if (!sku || sku.length < 3) {
      setSkuValidation({ valid: null, message: '' });
      return;
    }

    // Skip validation if editing and SKU hasn't changed
    if (isEditMode && sku === initialData?.sku) {
      setSkuValidation({ valid: true, message: 'SKU actual' });
      return;
    }

    setSkuChecking(true);
    try {
      const response = await productService.validateSKU(sku);
      if (response.success) {
        setSkuValidation({
          valid: response.data.available,
          message: response.data.available ? 'SKU disponible' : 'SKU ya existe',
        });
      }
    } catch (err) {
      setSkuValidation({
        valid: false,
        message: 'Error al validar SKU',
      });
    } finally {
      setSkuChecking(false);
    }
  };

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
    if (error) setError(null);
  };

  /**
   * Handle SKU blur event
   * US-PROD-001 - CA-2: Validate on blur
   */
  const handleSKUBlur = () => {
    validateSKU(formData.sku);
  };

  /**
   * Handle image change
   * US-PROD-001 - CA-5: Image upload
   */
  const handleImageChange = (file) => {
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!formData.sku.trim()) {
      errors.sku = 'El SKU es requerido';
    } else if (skuValidation.valid === false) {
      errors.sku = 'El SKU ya existe';
    }

    const cost = parseFloat(formData.cost_price);
    const sale = parseFloat(formData.sale_price);

    if (!formData.cost_price || cost <= 0) {
      errors.cost_price = 'El precio de costo debe ser mayor a 0';
    }

    if (!formData.sale_price || sale <= 0) {
      errors.sale_price = 'El precio de venta debe ser mayor a 0';
    }

    // US-PROD-001 - CA-3: Price validation warning
    if (cost > 0 && sale > 0 && sale < cost) {
      // Will show warning dialog, but not a validation error
      setShowPriceWarning(true);
      return false; // Prevent submission until user confirms
    }

    const stock = parseInt(formData.initial_stock);
    if (!formData.initial_stock || stock < 0) {
      errors.initial_stock = 'El stock inicial debe ser 0 o mayor';
    }

    if (!formData.category_id) {
      errors.category_id = 'La categoría es requerida';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle price warning confirmation
   * US-PROD-001 - CA-3: Allow continuing with warning
   */
  const handlePriceWarningConfirm = () => {
    setShowPriceWarning(false);
    // Proceed with submission
    submitForm();
  };

  /**
   * Handle price warning cancel
   */
  const handlePriceWarningCancel = () => {
    setShowPriceWarning(false);
  };

  /**
   * Submit form data
   */
  const submitForm = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('sku', formData.sku.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('cost_price', parseFloat(formData.cost_price));
      formDataToSend.append('sale_price', parseFloat(formData.sale_price));
      formDataToSend.append('initial_stock', parseInt(formData.initial_stock));
      formDataToSend.append('category_id', formData.category_id);

      // Add image if provided (CA-5)
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      let response;
      if (isEditMode) {
        response = await productService.updateProduct(initialData.id, formDataToSend);
      } else {
        response = await productService.createProduct(formDataToSend);
      }

      if (response.success) {
        // Success callback
        if (onSuccess) {
          onSuccess(response.data);
        } else {
          // Default: navigate to product list
          navigate('/products', {
            state: {
              message: isEditMode
                ? 'Producto actualizado exitosamente'
                : 'Producto creado exitosamente'
            }
          });
        }
      }
    } catch (err) {
      // US-PROD-001 - CA-8: Error handling
      console.error('Error saving product:', err);

      // Handle field-specific errors
      if (err.error?.details) {
        setFieldErrors(err.error.details);
      }

      // Set general error message
      const errorMessage = err.error?.message || 'Error al guardar el producto';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // If validation passed, submit
    await submitForm();
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/products');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {isEditMode ? 'Editar Producto' : 'Crear Nuevo Producto'}
      </Typography>

      {/* Global error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          {/* Name - CA-1 */}
          <Grid item xs={12} md={8}>
            <TextField
              required
              fullWidth
              label="Nombre del Producto"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
              disabled={loading}
            />
          </Grid>

          {/* SKU - CA-1, CA-2 */}
          <Grid item xs={12} md={4}>
            <TextField
              required
              fullWidth
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              onBlur={handleSKUBlur}
              error={!!fieldErrors.sku || skuValidation.valid === false}
              helperText={
                fieldErrors.sku ||
                (skuChecking ? 'Validando...' : skuValidation.message)
              }
              disabled={loading}
              InputProps={{
                endAdornment: skuChecking ? (
                  <CircularProgress size={20} />
                ) : skuValidation.valid === true ? (
                  <Chip label="✓" color="success" size="small" />
                ) : skuValidation.valid === false ? (
                  <Chip label="✗" color="error" size="small" />
                ) : null,
              }}
            />
          </Grid>

          {/* Description - CA-1 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={!!fieldErrors.description}
              helperText={fieldErrors.description}
              disabled={loading}
            />
          </Grid>

          {/* Cost Price - CA-1, CA-3 */}
          <Grid item xs={12} md={4}>
            <TextField
              required
              fullWidth
              type="number"
              label="Precio de Costo"
              name="cost_price"
              value={formData.cost_price}
              onChange={handleChange}
              error={!!fieldErrors.cost_price}
              helperText={fieldErrors.cost_price}
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          {/* Sale Price - CA-1, CA-3 */}
          <Grid item xs={12} md={4}>
            <TextField
              required
              fullWidth
              type="number"
              label="Precio de Venta"
              name="sale_price"
              value={formData.sale_price}
              onChange={handleChange}
              error={!!fieldErrors.sale_price}
              helperText={fieldErrors.sale_price}
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          {/* Profit Margin - CA-4 */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px solid #ccc',
                borderRadius: 1,
                p: 2,
              }}
            >
              <Typography variant="caption" color="textSecondary">
                Margen de Ganancia
              </Typography>
              {profitMargin !== null ? (
                <Chip
                  label={`${profitMargin.toFixed(2)}%`}
                  color={getMarginColor(profitMargin)}
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold', mt: 1 }}
                />
              ) : (
                <Typography variant="body2" color="textSecondary">
                  --
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Initial Stock - CA-1 */}
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              type="number"
              label="Stock Inicial"
              name="initial_stock"
              value={formData.initial_stock}
              onChange={handleChange}
              error={!!fieldErrors.initial_stock}
              helperText={fieldErrors.initial_stock}
              disabled={loading || isEditMode}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>

          {/* Category - CA-1 */}
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              select
              label="Categoría"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              error={!!fieldErrors.category_id}
              helperText={fieldErrors.category_id}
              disabled={loading}
            >
              <MenuItem value="">
                <em>Seleccionar categoría</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Image Upload - CA-5 */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Imagen del Producto
            </Typography>
            <ImageUpload
              value={formData.image}
              onChange={handleImageChange}
              error={!!fieldErrors.image}
              helperText={fieldErrors.image}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading || skuChecking || skuValidation.valid === false}
              >
                {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Producto'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Price Warning Dialog - CA-3 */}
      <Dialog
        open={showPriceWarning}
        onClose={handlePriceWarningCancel}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Advertencia de Precio
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            El precio de venta (${formData.sale_price}) es menor que el precio de costo (${formData.cost_price}).
            Esto resultará en una pérdida. ¿Desea continuar de todos modos?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePriceWarningCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handlePriceWarningConfirm} color="warning" variant="contained">
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProductForm;
