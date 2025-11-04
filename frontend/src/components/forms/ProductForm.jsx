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
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import productService from '../../services/productService';
import ImageUpload from './ImageUpload';

/**
 * ProductForm Component
 * US-PROD-001: Create Product
 * US-PROD-005: Edit Product
 *
 * Comprehensive form for creating/editing products with:
 * - All required fields (CA-1)
 * - Real-time SKU validation (CA-2) - Read-only when editing (US-PROD-005 CA-2)
 * - Price validation with warning (CA-3, CA-4)
 * - Live profit margin calculation (CA-4, CA-5)
 * - Image upload/update (CA-5, CA-6)
 * - Significant changes detection (CA-7)
 * - Error handling (CA-8, CA-10)
 * - Cancel confirmation (CA-11)
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
    min_stock_level: '',
    category_id: '',
    image: null,
    current_image_url: '',
  });

  // Original values for comparison (US-PROD-005 CA-7)
  const [originalData, setOriginalData] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [skuValidation, setSkuValidation] = useState({ valid: null, message: '' });
  const [skuChecking, setSkuChecking] = useState(false);
  const [profitMargin, setProfitMargin] = useState(null);
  const [originalMargin, setOriginalMargin] = useState(null);
  const [showPriceWarning, setShowPriceWarning] = useState(false);
  const [showSignificantChanges, setShowSignificantChanges] = useState(false);
  const [significantChanges, setSignificantChanges] = useState([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // US-PROD-005 CA-1: Load initial data if editing
  useEffect(() => {
    if (initialData) {
      const formValues = {
        name: initialData.name || '',
        sku: initialData.sku || '',
        description: initialData.description || '',
        cost_price: initialData.cost_price || '',
        sale_price: initialData.sale_price || '',
        initial_stock: initialData.stock_quantity || '',
        min_stock_level: initialData.min_stock_level || '',
        category_id: initialData.category_id || '',
        image: null,
        current_image_url: initialData.image_url || '',
      };
      setFormData(formValues);
      setOriginalData(formValues);

      // Calculate original margin
      if (initialData.profit_margin !== undefined) {
        setOriginalMargin(initialData.profit_margin);
      }
    }
  }, [initialData]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // US-PROD-005 CA-5: Calculate profit margin when prices change
  useEffect(() => {
    calculateProfitMargin();
  }, [formData.cost_price, formData.sale_price]);

  // Detect unsaved changes (US-PROD-005 CA-11)
  useEffect(() => {
    if (isEditMode && originalData) {
      const changed =
        formData.name !== originalData.name ||
        formData.description !== originalData.description ||
        formData.cost_price !== originalData.cost_price ||
        formData.sale_price !== originalData.sale_price ||
        formData.min_stock_level !== originalData.min_stock_level ||
        formData.category_id !== originalData.category_id ||
        formData.image !== null;
      setHasUnsavedChanges(changed);
    }
  }, [formData, originalData, isEditMode]);

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
   * US-PROD-005 - CA-5: Recalculate with color coding
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
   * US-PROD-005 CA-5: Green: >30%, Yellow: 15-30%, Red: <15%
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

    // US-PROD-005 CA-2: Skip validation if editing and SKU hasn't changed
    if (isEditMode && sku === initialData?.sku) {
      setSkuValidation({ valid: true, message: 'SKU actual' });
      return;
    }

    setSkuChecking(true);
    try {
      const response = await productService.validateSKU(sku);
      if (response.success) {
        setSkuValidation({
          valid: response.data.is_available,
          message: response.data.is_available ? 'SKU disponible' : 'SKU ya existe',
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
   * US-PROD-005 CA-7: Detect significant changes
   * Returns array of significant changes
   */
  const detectSignificantChanges = () => {
    if (!isEditMode || !originalData) return [];

    const changes = [];

    // Check price changes > 20%
    const origCost = parseFloat(originalData.cost_price);
    const newCost = parseFloat(formData.cost_price);
    if (origCost > 0 && newCost > 0) {
      const costChange = Math.abs(((newCost - origCost) / origCost) * 100);
      if (costChange >= 20) {
        changes.push({
          field: 'Precio de Costo',
          oldValue: `$${origCost.toFixed(2)}`,
          newValue: `$${newCost.toFixed(2)}`,
          changePercent: costChange.toFixed(1),
        });
      }
    }

    const origSale = parseFloat(originalData.sale_price);
    const newSale = parseFloat(formData.sale_price);
    if (origSale > 0 && newSale > 0) {
      const saleChange = Math.abs(((newSale - origSale) / origSale) * 100);
      if (saleChange >= 20) {
        changes.push({
          field: 'Precio de Venta',
          oldValue: `$${origSale.toFixed(2)}`,
          newValue: `$${newSale.toFixed(2)}`,
          changePercent: saleChange.toFixed(1),
        });
      }
    }

    // Check category change
    if (formData.category_id !== originalData.category_id) {
      const origCategory = categories.find(c => c.id === originalData.category_id);
      const newCategory = categories.find(c => c.id === formData.category_id);
      changes.push({
        field: 'Categoría',
        oldValue: origCategory?.name || 'N/A',
        newValue: newCategory?.name || 'N/A',
      });
    }

    return changes;
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
    if (!isEditMode) {
      validateSKU(formData.sku);
    }
  };

  /**
   * US-PROD-005 CA-6: Handle image change
   */
  const handleImageChange = (file) => {
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  /**
   * Validate form before submission
   * US-PROD-005 CA-3: Validate editable fields
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!isEditMode) {
      if (!formData.sku.trim()) {
        errors.sku = 'El SKU es requerido';
      } else if (skuValidation.valid === false) {
        errors.sku = 'El SKU ya existe';
      }
    }

    const cost = parseFloat(formData.cost_price);
    const sale = parseFloat(formData.sale_price);

    if (!formData.cost_price || cost <= 0) {
      errors.cost_price = 'El precio de costo debe ser mayor a 0';
    }

    if (!formData.sale_price || sale <= 0) {
      errors.sale_price = 'El precio de venta debe ser mayor a 0';
    }

    // US-PROD-005 CA-4: Price validation warning
    if (cost > 0 && sale > 0 && sale < cost) {
      // Will show warning dialog, but not a validation error
      setShowPriceWarning(true);
      return false; // Prevent submission until user confirms
    }

    if (!isEditMode) {
      const stock = parseInt(formData.initial_stock);
      if (formData.initial_stock === '' || stock < 0) {
        errors.initial_stock = 'El stock inicial debe ser 0 o mayor';
      }
    }

    const minStock = parseInt(formData.min_stock_level);
    if (formData.min_stock_level !== '' && minStock < 0) {
      errors.min_stock_level = 'El punto de reorden no puede ser negativo';
    }

    if (!formData.category_id) {
      errors.category_id = 'La categoría es requerida';
    }

    setFieldErrors(errors);

    // US-PROD-005 CA-7: Check for significant changes
    if (Object.keys(errors).length === 0 && isEditMode) {
      const changes = detectSignificantChanges();
      if (changes.length > 0) {
        setSignificantChanges(changes);
        setShowSignificantChanges(true);
        return false; // Show confirmation dialog
      }
    }

    return Object.keys(errors).length === 0;
  };

  /**
   * US-PROD-005 CA-4: Handle price warning confirmation
   */
  const handlePriceWarningConfirm = () => {
    setShowPriceWarning(false);
    // Check for significant changes after price confirmation
    if (isEditMode) {
      const changes = detectSignificantChanges();
      if (changes.length > 0) {
        setSignificantChanges(changes);
        setShowSignificantChanges(true);
      } else {
        submitForm(true); // force_price_below_cost = true
      }
    } else {
      submitForm(true);
    }
  };

  /**
   * Handle price warning cancel
   */
  const handlePriceWarningCancel = () => {
    setShowPriceWarning(false);
  };

  /**
   * US-PROD-005 CA-7: Handle significant changes confirmation
   */
  const handleSignificantChangesConfirm = () => {
    setShowSignificantChanges(false);
    const cost = parseFloat(formData.cost_price);
    const sale = parseFloat(formData.sale_price);
    const forcePriceWarning = sale < cost;
    submitForm(forcePriceWarning);
  };

  /**
   * Handle significant changes cancel
   */
  const handleSignificantChangesCancel = () => {
    setShowSignificantChanges(false);
  };

  /**
   * Submit form data
   * US-PROD-005 CA-8, CA-9, CA-10: Submit with auditing and error handling
   */
  const submitForm = async (forcePriceBelowCost = false) => {
    setLoading(true);
    setError(null);

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());

      if (!isEditMode) {
        formDataToSend.append('sku', formData.sku.trim());
      }

      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('cost_price', parseFloat(formData.cost_price));
      formDataToSend.append('sale_price', parseFloat(formData.sale_price));

      if (!isEditMode) {
        formDataToSend.append('initial_stock', parseInt(formData.initial_stock));
      }

      if (formData.min_stock_level !== '') {
        formDataToSend.append('min_stock_level', parseInt(formData.min_stock_level) || 10);
      }

      formDataToSend.append('category_id', formData.category_id);

      if (forcePriceBelowCost) {
        formDataToSend.append('force_price_below_cost', 'true');
      }

      // US-PROD-005 CA-6: Add image if provided
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
        // US-PROD-005 CA-9: Success callback
        if (onSuccess) {
          onSuccess(response.data, isEditMode ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
        } else {
          // Default: navigate to product list
          navigate('/products', {
            state: {
              message: isEditMode
                ? 'Producto actualizado correctamente'
                : 'Producto creado correctamente',
              severity: 'success'
            }
          });
        }
      }
    } catch (err) {
      // US-PROD-005 CA-10: Error handling
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
   * US-PROD-005 CA-11: Handle cancel with confirmation
   */
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      proceedCancel();
    }
  };

  /**
   * Proceed with cancel action
   */
  const proceedCancel = () => {
    setShowCancelConfirm(false);
    if (onCancel) {
      onCancel();
    } else {
      if (isEditMode) {
        navigate(`/products/${initialData.id}`);
      } else {
        navigate('/products');
      }
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      {/* US-PROD-005 CA-1: Title with product name */}
      <Typography variant="h5" gutterBottom>
        {isEditMode ? `Editar Producto: ${initialData?.name}` : 'Crear Nuevo Producto'}
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

          {/* SKU - US-PROD-005 CA-2: Read-only when editing */}
          <Grid item xs={12} md={4}>
            <Tooltip
              title={isEditMode ? "El SKU no puede modificarse una vez creado" : ""}
              arrow
            >
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
                disabled={loading || isEditMode}
                InputProps={{
                  readOnly: isEditMode,
                  endAdornment: isEditMode ? (
                    <InfoIcon color="action" />
                  ) : skuChecking ? (
                    <CircularProgress size={20} />
                  ) : skuValidation.valid === true ? (
                    <Chip label="✓" color="success" size="small" />
                  ) : skuValidation.valid === false ? (
                    <Chip label="✗" color="error" size="small" />
                  ) : null,
                }}
                sx={isEditMode ? {
                  '& .MuiInputBase-input': {
                    cursor: 'not-allowed',
                    backgroundColor: '#f5f5f5',
                  }
                } : {}}
              />
            </Tooltip>
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

          {/* Profit Margin - US-PROD-005 CA-5: Show comparison */}
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
                <>
                  <Chip
                    label={`${profitMargin.toFixed(2)}%`}
                    color={getMarginColor(profitMargin)}
                    sx={{ fontSize: '1.1rem', fontWeight: 'bold', mt: 1 }}
                  />
                  {/* US-PROD-005 CA-5: Show comparison with original */}
                  {isEditMode && originalMargin !== null && Math.abs(profitMargin - originalMargin) > 0.01 && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                      Anterior: {originalMargin.toFixed(2)}%
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  --
                </Typography>
              )}
            </Box>
          </Grid>

          {/* US-PROD-005 CA-1: Stock is read-only when editing */}
          {!isEditMode && (
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
                disabled={loading}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
          )}

          {/* US-PROD-005: Reorder Point */}
          <Grid item xs={12} md={isEditMode ? 12 : 6}>
            <TextField
              fullWidth
              type="number"
              label="Punto de Reorden"
              name="min_stock_level"
              value={formData.min_stock_level}
              onChange={handleChange}
              error={!!fieldErrors.min_stock_level}
              helperText={fieldErrors.min_stock_level || 'Nivel mínimo de stock antes de alertar'}
              disabled={loading}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>

          {/* Category - CA-1 */}
          <Grid item xs={12}>
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

          {/* US-PROD-005 CA-6: Image Upload with current image preview */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Imagen del Producto
            </Typography>
            <ImageUpload
              value={formData.image}
              currentImageUrl={formData.current_image_url}
              onChange={handleImageChange}
              error={!!fieldErrors.image}
              helperText={fieldErrors.image}
              showChangeButton={isEditMode && formData.current_image_url}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {/* US-PROD-005 CA-11: Cancel button */}
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
                disabled={loading || skuChecking || (!isEditMode && skuValidation.valid === false)}
              >
                {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Producto'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* US-PROD-005 CA-4: Price Warning Dialog */}
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
            ⚠️ El precio de venta (${formData.sale_price}) es menor al costo (${formData.cost_price}).
            Esto generará pérdidas de ${(parseFloat(formData.cost_price) - parseFloat(formData.sale_price)).toFixed(2)} por unidad.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
            ¿Estás seguro de que deseas guardar con precio de venta menor al costo?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePriceWarningCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handlePriceWarningConfirm} color="warning" variant="contained">
            Confirmar cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* US-PROD-005 CA-7: Significant Changes Dialog */}
      <Dialog
        open={showSignificantChanges}
        onClose={handleSignificantChangesCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="info" />
          Confirmar Cambios Importantes
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se detectaron los siguientes cambios significativos:
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            {significantChanges.map((change, index) => (
              <Alert key={index} severity="info" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">{change.field}</Typography>
                <Typography variant="body2">
                  <strong>Antes:</strong> {change.oldValue} → <strong>Ahora:</strong> {change.newValue}
                  {change.changePercent && (
                    <> ({change.changePercent}% de cambio)</>
                  )}
                </Typography>
              </Alert>
            ))}
          </Box>
          <DialogContentText sx={{ mt: 2 }}>
            ¿Deseas confirmar estos cambios?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSignificantChangesCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSignificantChangesConfirm} color="primary" variant="contained">
            Confirmar cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* US-PROD-005 CA-11: Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
      >
        <DialogTitle>
          ¿Descartar cambios?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tienes cambios sin guardar. ¿Estás seguro de que deseas descartarlos?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelConfirm(false)} color="primary">
            Seguir editando
          </Button>
          <Button onClick={proceedCancel} color="error" variant="contained">
            Descartar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProductForm;
