/**
 * Formulario de Ajuste Manual de Inventario
 * US-INV-002 CA-1, CA-2, CA-3: Formulario, Razones y Validaciones
 */
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { Save, Calculate } from '@mui/icons-material';
import productService from '../../services/productService';
import inventoryService from '../../services/inventoryService';

const ManualAdjustmentForm = ({ onSuccess, onCancel }) => {
  // Estados del formulario
  const [products, setProducts] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('increase');
  const [quantity, setQuantity] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Estados calculados
  const [newStock, setNewStock] = useState(null);

  // Cargar productos y razones al montar
  useEffect(() => {
    loadProducts();
    loadReasons();
  }, []);

  // Calcular nuevo stock cuando cambian los valores
  useEffect(() => {
    calculateNewStock();
  }, [selectedProduct, adjustmentType, quantity]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await productService.getProducts({ limit: 1000 });
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Error al cargar productos');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadReasons = async () => {
    try {
      const response = await inventoryService.getAdjustmentReasons();
      if (response.success) {
        setReasons(response.data || []);
      }
    } catch (err) {
      console.error('Error loading reasons:', err);
    }
  };

  const calculateNewStock = () => {
    if (!selectedProduct || !quantity || quantity <= 0) {
      setNewStock(null);
      return;
    }

    const currentStock = selectedProduct.stock_quantity;
    const qty = parseInt(quantity);

    if (adjustmentType === 'increase') {
      setNewStock(currentStock + qty);
    } else {
      setNewStock(currentStock - qty);
    }
  };

  const validate = () => {
    const errors = {};

    // CA-3: Validaciones
    if (!selectedProduct) {
      errors.product = 'Debe seleccionar un producto';
    }

    if (!quantity || quantity <= 0) {
      errors.quantity = 'La cantidad debe ser mayor a 0';
    }

    // Validar motivo
    const reason = selectedReason === 'Otro' ? customReason : selectedReason;
    if (!reason || reason.trim() === '') {
      errors.reason = 'El motivo es obligatorio';
    } else if (reason.trim().length < 10) {
      errors.reason = 'El motivo debe tener al menos 10 caracteres';
    }

    // CA-3: Validar que no resulte en stock negativo
    if (newStock !== null && newStock < 0) {
      errors.quantity = `El ajuste resultaría en stock negativo (${newStock})`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const reason = selectedReason === 'Otro' ? customReason : selectedReason;

    const adjustmentData = {
      product_id: selectedProduct.id,
      adjustment_type: adjustmentType,
      quantity: parseInt(quantity),
      reason: reason,
      confirmed: false
    };

    // Llamar al callback con los datos
    if (onSuccess) {
      onSuccess(adjustmentData, selectedProduct, newStock);
    }
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setAdjustmentType('increase');
    setQuantity('');
    setSelectedReason('');
    setCustomReason('');
    setNewStock(null);
    setValidationErrors({});
    setError(null);
  };

  if (loadingProducts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Nuevo Ajuste de Inventario
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Selector de Producto */}
          <Grid item xs={12}>
            <Autocomplete
              options={products}
              getOptionLabel={(option) => `${option.name} (${option.sku})`}
              value={selectedProduct}
              onChange={(event, newValue) => setSelectedProduct(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Producto *"
                  placeholder="Buscar por nombre o SKU"
                  error={!!validationErrors.product}
                  helperText={validationErrors.product}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU: {option.sku} | Stock: {option.stock_quantity}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Grid>

          {/* Stock Actual */}
          {selectedProduct && (
            <Grid item xs={12} sm={4}>
              <TextField
                label="Stock Actual"
                value={selectedProduct.stock_quantity}
                InputProps={{
                  readOnly: true,
                }}
                fullWidth
              />
            </Grid>
          )}

          {/* Tipo de Ajuste */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Ajuste *</InputLabel>
              <Select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
                label="Tipo de Ajuste *"
              >
                <MenuItem value="increase">Aumento</MenuItem>
                <MenuItem value="decrease">Disminución</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Cantidad */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Cantidad *"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={!!validationErrors.quantity}
              helperText={validationErrors.quantity}
              InputProps={{
                inputProps: { min: 1 }
              }}
              fullWidth
            />
          </Grid>

          {/* Nuevo Stock (calculado) */}
          {newStock !== null && (
            <Grid item xs={12}>
              <Alert
                severity={newStock < 0 ? 'error' : adjustmentType === 'increase' ? 'success' : 'warning'}
                icon={<Calculate />}
              >
                <Typography variant="subtitle2">
                  Nuevo Stock: <strong>{newStock}</strong> unidades
                  {newStock < 0 && ' (¡STOCK NEGATIVO!)'}
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Razón Predefinida */}
          <Grid item xs={12} sm={selectedReason === 'Otro' ? 6 : 12}>
            <FormControl fullWidth error={!!validationErrors.reason}>
              <InputLabel>Razón/Motivo *</InputLabel>
              <Select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                label="Razón/Motivo *"
              >
                {reasons.map((reason) => (
                  <MenuItem key={reason} value={reason}>
                    {reason}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Campo personalizado si selecciona "Otro" */}
          {selectedReason === 'Otro' && (
            <Grid item xs={12} sm={6}>
              <TextField
                label="Especificar motivo *"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                error={!!validationErrors.reason}
                helperText={validationErrors.reason || 'Mínimo 10 caracteres'}
                multiline
                rows={1}
                fullWidth
                inputProps={{ maxLength: 500 }}
              />
            </Grid>
          )}

          {/* Botones */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={onCancel || handleReset}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Continuar'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ManualAdjustmentForm;
