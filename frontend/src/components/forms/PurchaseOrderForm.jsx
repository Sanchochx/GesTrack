import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  LocalShipping as SupplierIcon,
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import supplierService from '../../services/supplierService';
import productService from '../../services/productService';
import purchaseOrderService from '../../services/purchaseOrderService';

const formatCOP = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

// US-SUPP-010 CA-7: Umbral (%) de cambio en el total considerado "significativo"
const SIGNIFICANT_CHANGE_THRESHOLD = 20;

/**
 * PurchaseOrderForm Component
 * US-SUPP-005: Crear Orden de Compra
 * US-SUPP-010: Editar Orden de Compra (mode="edit")
 *
 * CA-1: Selección de proveedor desde un listado
 * CA-2/CA-3: Agregar múltiples productos con cantidad y precio de compra
 * CA-4: Cálculo automático de subtotal
 * CA-5/CA-6: Costo de envío y total de la orden
 * CA-10: Fecha estimada de entrega
 *
 * US-SUPP-010:
 * CA-2/CA-3: Agregar/eliminar productos y modificar cantidades/precios
 * CA-4: Recalcula totales automáticamente
 * CA-7: Advertencia si hay cambios significativos (total varía >20% o se agregan/eliminan productos)
 */
const PurchaseOrderForm = ({ onSuccess, onCancel, mode = 'create', initialOrder = null }) => {
  const isEdit = mode === 'edit';

  // Supplier state (CA-1)
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(initialOrder?.supplier || null);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Product search state (CA-2)
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Order items state (CA-2/CA-3)
  const [orderItems, setOrderItems] = useState(() =>
    (initialOrder?.items || []).map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity_ordered: item.quantity_ordered,
      unit_cost: item.unit_cost,
      subtotal: item.subtotal,
    }))
  );

  // Totals & extra fields (CA-5/CA-10)
  const [shippingCost, setShippingCost] = useState(String(initialOrder?.shipping_cost ?? 0));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(initialOrder?.expected_delivery_date || '');

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const productDebounceRef = useRef(null);

  // CA-1: Cargar proveedores para el selector
  useEffect(() => {
    let cancelled = false;
    async function loadSuppliers() {
      setLoadingSuppliers(true);
      try {
        const result = await supplierService.getSuppliers({ per_page: 100 });
        if (!cancelled && result.success) setSupplierOptions(result.data);
      } catch {
        if (!cancelled) setSupplierOptions([]);
      } finally {
        if (!cancelled) setLoadingSuppliers(false);
      }
    }
    loadSuppliers();
    return () => { cancelled = true; };
  }, []);

  // --- CA-2: Product Search ---
  const searchProducts = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setProductOptions([]);
      return;
    }
    setLoadingProducts(true);
    try {
      const result = await productService.getProducts({
        search: query,
        limit: 10,
        is_active: 'true',
      });
      setProductOptions(result.data || []);
    } catch {
      setProductOptions([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const handleProductSearchChange = (event, value) => {
    setProductSearch(value);
    if (productDebounceRef.current) clearTimeout(productDebounceRef.current);
    productDebounceRef.current = setTimeout(() => {
      searchProducts(value);
    }, 300);
  };

  const handleAddProduct = (event, product) => {
    if (!product) return;

    const existing = orderItems.find((item) => item.product_id === product.id);
    if (existing) {
      const newQty = existing.quantity_ordered + 1;
      setOrderItems((prev) =>
        prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity_ordered: newQty, subtotal: newQty * item.unit_cost }
            : item
        )
      );
    } else {
      const unitCost = parseFloat(product.cost_price) || 0;
      setOrderItems((prev) => [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity_ordered: 1,
          unit_cost: unitCost,
          subtotal: unitCost,
        },
      ]);
    }

    setErrors((prev) => {
      const { items, ...rest } = prev;
      return rest;
    });
    setProductSearch('');
    setProductOptions([]);
  };

  // --- CA-3: Item Management ---
  const handleQuantityChange = (productId, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    if (qty < 1) return;
    setOrderItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity_ordered: qty, subtotal: qty * i.unit_cost }
          : i
      )
    );
  };

  const handleCostChange = (productId, newCost) => {
    const cost = parseFloat(newCost) || 0;
    if (cost < 0) return;
    setOrderItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, unit_cost: cost, subtotal: i.quantity_ordered * cost }
          : i
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setOrderItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  // --- CA-4/CA-5/CA-6: Totals Calculation ---
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = parseFloat(shippingCost) || 0;
  const total = subtotal + shipping;

  // US-SUPP-010 CA-7: Advertencia de cambios significativos respecto a la orden original
  const originalItemIds = new Set((initialOrder?.items || []).map((i) => i.product_id));
  const currentItemIds = new Set(orderItems.map((i) => i.product_id));
  const itemsChanged = isEdit && (
    [...originalItemIds].some((id) => !currentItemIds.has(id)) ||
    [...currentItemIds].some((id) => !originalItemIds.has(id))
  );
  const originalTotal = initialOrder?.total ?? 0;
  const totalChangePct = originalTotal > 0 ? Math.abs((total - originalTotal) / originalTotal) * 100 : 0;
  const hasSignificantChange = isEdit && (itemsChanged || totalChangePct > SIGNIFICANT_CHANGE_THRESHOLD);

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};

    if (!selectedSupplier) {
      newErrors.supplier = 'Debe seleccionar un proveedor';
    }

    if (orderItems.length === 0) {
      newErrors.items = 'Debe agregar al menos un producto a la orden';
    }

    for (const item of orderItems) {
      if (item.quantity_ordered < 1) {
        newErrors.items = 'Todas las cantidades deben ser al menos 1';
        break;
      }
      if (item.unit_cost <= 0) {
        newErrors.items = 'Todos los precios de compra deben ser mayores a 0';
        break;
      }
    }

    if (shipping < 0) {
      newErrors.shipping = 'El costo de envío no puede ser negativo';
    }

    if (expectedDeliveryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(`${expectedDeliveryDate}T00:00:00`);
      if (selectedDate < today) {
        newErrors.expectedDeliveryDate = 'La fecha estimada no puede ser anterior a hoy';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submit ---
  const handleSubmit = async () => {
    setSubmitError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const purchaseOrderData = {
        supplier_id: selectedSupplier.id,
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          quantity_ordered: item.quantity_ordered,
          unit_cost: item.unit_cost,
        })),
        shipping_cost: shipping,
        expected_delivery_date: expectedDeliveryDate || null,
      };

      const result = isEdit
        ? await purchaseOrderService.updatePurchaseOrder(initialOrder.id, purchaseOrderData)
        : await purchaseOrderService.createPurchaseOrder(purchaseOrderData);

      if (result.success && onSuccess) {
        onSuccess(result.data, result.message);
      }
    } catch (error) {
      setSubmitError(error?.error?.message || `Error al ${isEdit ? 'editar' : 'crear'} la orden de compra`);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (productDebounceRef.current) clearTimeout(productDebounceRef.current);
    };
  }, []);

  return (
    <Box>
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      {/* --- CA-1: Supplier Selection --- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SupplierIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Proveedor</Typography>
        </Box>

        <Autocomplete
          options={supplierOptions}
          getOptionLabel={(option) => option.company_name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={selectedSupplier}
          onChange={(_e, value) => {
            setSelectedSupplier(value);
            if (errors.supplier) {
              setErrors((prev) => { const { supplier, ...rest } = prev; return rest; });
            }
          }}
          loading={loadingSuppliers}
          noOptionsText="No hay proveedores disponibles"
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <li key={option.id} {...rest}>
                <Box>
                  <Typography variant="body1">{option.company_name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {option.contact_name} | {option.email}
                  </Typography>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Seleccionar proveedor *"
              placeholder="Buscar proveedor..."
              error={!!errors.supplier}
              helperText={errors.supplier}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingSuppliers ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Paper>

      {/* --- CA-2 & CA-3: Products --- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CartIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Productos de la Orden</Typography>
        </Box>

        <Autocomplete
          options={productOptions}
          getOptionLabel={(option) => `${option.name} (${option.sku})`}
          value={null}
          onChange={handleAddProduct}
          onInputChange={handleProductSearchChange}
          inputValue={productSearch}
          loading={loadingProducts}
          noOptionsText={
            productSearch.length < 2
              ? 'Escriba al menos 2 caracteres para buscar'
              : 'No se encontraron productos'
          }
          clearOnBlur={false}
          blurOnSelect
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <li key={option.id} {...rest}>
                <Box>
                  <Typography variant="body1">{option.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    SKU: {option.sku} | Costo: {formatCOP(option.cost_price)}
                  </Typography>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar producto por nombre o SKU"
              placeholder="Escriba para buscar y agregar..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <AddIcon color="action" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {loadingProducts ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {errors.items && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errors.items}
          </Alert>
        )}

        {orderItems.length > 0 && (
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>Cantidad</TableCell>
                  <TableCell align="right" sx={{ width: 140 }}>Precio Compra</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>Subtotal</TableCell>
                  <TableCell align="center" sx={{ width: 60 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell>
                      <Typography variant="body2">{item.product_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.product_sku} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity_ordered}
                        onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                        inputProps={{ min: 1, style: { textAlign: 'center' } }}
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.unit_cost}
                        onChange={(e) => handleCostChange(item.product_id, e.target.value)}
                        inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">COP</InputAdornment>,
                        }}
                        sx={{ width: 140 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCOP(item.subtotal)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveItem(item.product_id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {orderItems.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <CartIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">
              No hay productos en la orden. Use el buscador para agregar productos.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* --- CA-5/CA-6/CA-10: Totals & Additional Info --- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Totales y Detalles</Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Costo de Envío"
                  type="number"
                  fullWidth
                  size="small"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                  error={!!errors.shipping}
                  helperText={errors.shipping}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">COP</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Fecha Estimada de Entrega (opcional)"
                  type="date"
                  fullWidth
                  size="small"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  error={!!errors.expectedDeliveryDate}
                  helperText={errors.expectedDeliveryDate}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50', height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Resumen de la Orden
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Subtotal ({orderItems.length} producto{orderItems.length !== 1 ? 's' : ''})
                </Typography>
                <Typography variant="body2">{formatCOP(subtotal)}</Typography>
              </Box>

              {shipping > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Envío
                  </Typography>
                  <Typography variant="body2">+ {formatCOP(shipping)}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">TOTAL</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {formatCOP(total)}
                </Typography>
              </Box>

              {/* US-SUPP-010 CA-8: Comparación de totales antes/después */}
              {isEdit && Math.abs(total - originalTotal) > 0.01 && (
                <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light' }}>
                  <Typography variant="caption" color="text.secondary">
                    Total anterior: <strong>{formatCOP(originalTotal)}</strong>
                    {' | '}
                    Nuevo total: <strong>{formatCOP(total)}</strong>
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* US-SUPP-010 CA-7: Advertencia de cambios significativos */}
      {hasSignificantChange && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Esta edición incluye cambios significativos
          {itemsChanged ? ' (se agregaron o eliminaron productos)' : ` (el total varía más del ${SIGNIFICANT_CHANGE_THRESHOLD}%)`}.
          Verifique la información antes de guardar.
        </Alert>
      )}

      {/* --- Action Buttons --- */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={submitting || orderItems.length === 0 || !selectedSupplier}
        >
          {submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Guardar Orden de Compra'}
        </Button>
      </Box>
    </Box>
  );
};

export default PurchaseOrderForm;
