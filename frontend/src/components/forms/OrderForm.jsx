import { useState, useEffect, useCallback, useRef } from 'react';
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
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import customerService from '../../services/customerService';
import productService from '../../services/productService';
import orderService from '../../services/orderService';

const formatCOP = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

/**
 * OrderForm Component
 * US-ORD-001: Crear Pedido
 *
 * CA-1: Selección de cliente
 * CA-2: Agregar productos al pedido
 * CA-3: Validación de stock en tiempo real
 * CA-4: Gestión de items del pedido
 * CA-6: Cálculo de totales
 * CA-7: Validaciones del formulario
 */
const OrderForm = ({ onSuccess, onCancel }) => {
  // Customer state (CA-1)
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Product search state (CA-2)
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Order items state (CA-4)
  const [orderItems, setOrderItems] = useState([]);

  // Totals state (CA-6)
  const [taxPercentage, setTaxPercentage] = useState('0');
  const [shippingCost, setShippingCost] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [discountJustification, setDiscountJustification] = useState('');
  const [notes, setNotes] = useState('');

  // Form state
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounce refs
  const customerDebounceRef = useRef(null);
  const productDebounceRef = useRef(null);

  // --- CA-1: Customer Search ---
  const searchCustomers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setCustomerOptions([]);
      return;
    }
    setLoadingCustomers(true);
    try {
      const result = await customerService.getCustomers({
        search: query,
        limit: 10,
        is_active: 'true',
      });
      setCustomerOptions(result.data || []);
    } catch {
      setCustomerOptions([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const handleCustomerSearchChange = (event, value) => {
    setCustomerSearch(value);
    if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
    customerDebounceRef.current = setTimeout(() => {
      searchCustomers(value);
    }, 300);
  };

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

    // Check if product already in list
    const existing = orderItems.find((item) => item.product_id === product.id);
    if (existing) {
      // Increment quantity if stock allows
      const newQty = existing.quantity + 1;
      if (newQty > product.stock_quantity) {
        setErrors((prev) => ({
          ...prev,
          stock: `Stock insuficiente para ${product.name}. Disponible: ${product.stock_quantity}`,
        }));
        return;
      }
      setOrderItems((prev) =>
        prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: newQty, subtotal: newQty * item.unit_price }
            : item
        )
      );
    } else {
      // CA-3: Check stock before adding
      if (product.stock_quantity < 1) {
        setErrors((prev) => ({
          ...prev,
          stock: `${product.name} no tiene stock disponible`,
        }));
        return;
      }

      setOrderItems((prev) => [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: 1,
          unit_price: parseFloat(product.sale_price) || 0,
          subtotal: parseFloat(product.sale_price) || 0,
          stock_available: product.stock_quantity,
        },
      ]);
    }

    // Clear stock error and product search
    setErrors((prev) => {
      const { stock, items, ...rest } = prev;
      return rest;
    });
    setProductSearch('');
    setProductOptions([]);
  };

  // --- CA-4: Item Management ---
  const handleQuantityChange = (productId, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    if (qty < 1) return;

    const item = orderItems.find((i) => i.product_id === productId);
    if (!item) return;

    // CA-3: Validate stock
    if (qty > item.stock_available) {
      setErrors((prev) => ({
        ...prev,
        stock: `Stock insuficiente para ${item.product_name}. Disponible: ${item.stock_available}`,
      }));
      return;
    }

    setErrors((prev) => {
      const { stock, ...rest } = prev;
      return rest;
    });

    setOrderItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: qty, subtotal: qty * i.unit_price }
          : i
      )
    );
  };

  const handlePriceChange = (productId, newPrice) => {
    const price = parseFloat(newPrice) || 0;
    if (price < 0) return;

    setOrderItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, unit_price: price, subtotal: i.quantity * price }
          : i
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setOrderItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  // --- CA-6: Totals Calculation ---
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxPct = parseFloat(taxPercentage) || 0;
  const taxAmount = subtotal * (taxPct / 100);
  const shipping = parseFloat(shippingCost) || 0;
  const discount = parseFloat(discountAmount) || 0;
  const total = subtotal + taxAmount + shipping - discount;
  const discountPercentage = subtotal > 0 ? (discount / subtotal) * 100 : 0;

  // --- CA-7: Validation ---
  const validateForm = () => {
    const newErrors = {};

    if (!selectedCustomer) {
      newErrors.customer = 'Debe seleccionar un cliente';
    }

    if (orderItems.length === 0) {
      newErrors.items = 'Debe agregar al menos un producto al pedido';
    }

    for (const item of orderItems) {
      if (item.quantity < 1) {
        newErrors.items = 'Todas las cantidades deben ser al menos 1';
        break;
      }
      if (item.unit_price <= 0) {
        newErrors.items = 'Todos los precios deben ser mayores a 0';
        break;
      }
    }

    if (taxPct < 0) {
      newErrors.tax = 'El impuesto no puede ser negativo';
    }

    if (shipping < 0) {
      newErrors.shipping = 'El costo de envío no puede ser negativo';
    }

    if (discount < 0) {
      newErrors.discount = 'El descuento no puede ser negativo';
    }

    // CA-7: Discount >20% requires justification
    if (discountPercentage > 20 && !discountJustification.trim()) {
      newErrors.discountJustification =
        'Se requiere justificación para descuentos mayores al 20%';
    }

    if (notes.length > 500) {
      newErrors.notes = 'Las notas no pueden exceder 500 caracteres';
    }

    if (total < 0) {
      newErrors.total = 'El total no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- CA-8: Submit ---
  const handleSubmit = async () => {
    setSubmitError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const orderData = {
        customer_id: selectedCustomer.id,
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        tax_percentage: taxPct,
        shipping_cost: shipping,
        discount_amount: discount,
        discount_justification: discountJustification.trim() || null,
        notes: notes.trim() || null,
      };

      const result = await orderService.createOrder(orderData);

      if (result.success && onSuccess) {
        onSuccess(result.data, result.message);
      }
    } catch (error) {
      // CA-9: Handle specific errors
      if (error?.error?.code === 'INSUFFICIENT_STOCK') {
        setSubmitError(error.error.message);
        if (error.error.details) {
          setErrors((prev) => ({
            ...prev,
            stock: error.error.details
              .map(
                (d) =>
                  `${d.product_name}: disponible ${d.available}, solicitado ${d.requested}`
              )
              .join('. '),
          }));
        }
      } else {
        setSubmitError(
          error?.error?.message || 'Error al crear el pedido'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
      if (productDebounceRef.current) clearTimeout(productDebounceRef.current);
    };
  }, []);

  return (
    <Box>
      {/* Submit Error */}
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      {/* Stock Error */}
      {errors.stock && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setErrors((prev) => { const { stock, ...rest } = prev; return rest; })}>
          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />
          {errors.stock}
        </Alert>
      )}

      {/* --- CA-1: Customer Selection --- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Cliente</Typography>
        </Box>

        <Autocomplete
          options={customerOptions}
          getOptionLabel={(option) =>
            `${option.nombre_razon_social} - ${option.numero_documento || ''}`
          }
          value={selectedCustomer}
          onChange={(event, value) => {
            setSelectedCustomer(value);
            if (errors.customer) {
              setErrors((prev) => { const { customer, ...rest } = prev; return rest; });
            }
          }}
          onInputChange={handleCustomerSearchChange}
          inputValue={customerSearch}
          loading={loadingCustomers}
          noOptionsText={
            customerSearch.length < 2
              ? 'Escriba al menos 2 caracteres para buscar'
              : 'No se encontraron clientes'
          }
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <li key={option.id} {...rest}>
                <Box>
                  <Typography variant="body1">{option.nombre_razon_social}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {option.correo} {option.telefono_movil ? `| ${option.telefono_movil}` : ''}
                  </Typography>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar cliente por nombre, email o teléfono *"
              placeholder="Escriba para buscar..."
              error={!!errors.customer}
              helperText={errors.customer}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {loadingCustomers ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {/* Selected customer info */}
        {selectedCustomer && (
          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">Nombre</Typography>
                <Typography variant="body2">{selectedCustomer.nombre_razon_social}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">Documento</Typography>
                <Typography variant="body2">{selectedCustomer.tipo_documento}: {selectedCustomer.numero_documento}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">Correo</Typography>
                <Typography variant="body2">{selectedCustomer.correo || '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Paper>

      {/* --- CA-2 & CA-4: Products --- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CartIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Productos del Pedido</Typography>
        </Box>

        {/* Product search */}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      SKU: {option.sku} | Precio: {formatCOP(option.sale_price)}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={`Stock: ${option.stock_quantity}`}
                    color={option.stock_quantity > 0 ? 'success' : 'error'}
                    variant="outlined"
                  />
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

        {/* Items table */}
        {orderItems.length > 0 && (
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>Cantidad</TableCell>
                  <TableCell align="center" sx={{ width: 80 }}>Stock</TableCell>
                  <TableCell align="right" sx={{ width: 140 }}>Precio Unit.</TableCell>
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
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                        inputProps={{ min: 1, max: item.stock_available, style: { textAlign: 'center' } }}
                        sx={{ width: 80 }}
                        error={item.quantity > item.stock_available}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Stock disponible">
                        <Chip
                          size="small"
                          icon={<InventoryIcon />}
                          label={item.stock_available}
                          color={item.stock_available > item.quantity ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.unit_price}
                        onChange={(e) => handlePriceChange(item.product_id, e.target.value)}
                        inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">COP</InputAdornment>,
                        }}
                        sx={{ width: 130 }}
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
              No hay productos en el pedido. Use el buscador para agregar productos.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* --- CA-6: Totals & Additional Info --- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Totales y Detalles</Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Left column: Additional fields */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Impuesto (%)"
                  type="number"
                  fullWidth
                  size="small"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                  error={!!errors.tax}
                  helperText={errors.tax}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
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
                  label="Descuento"
                  type="number"
                  fullWidth
                  size="small"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                  error={!!errors.discount}
                  helperText={
                    errors.discount ||
                    (discountPercentage > 0
                      ? `${discountPercentage.toFixed(1)}% del subtotal`
                      : '')
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">COP</InputAdornment>,
                  }}
                />
              </Grid>

              {/* CA-7: Discount justification when >20% */}
              {discountPercentage > 20 && (
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    Descuento superior al 20%. Se requiere justificación.
                  </Alert>
                  <TextField
                    label="Justificación del descuento *"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={discountJustification}
                    onChange={(e) => setDiscountJustification(e.target.value)}
                    error={!!errors.discountJustification}
                    helperText={errors.discountJustification}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  label="Notas del pedido"
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  inputProps={{ maxLength: 500 }}
                  error={!!errors.notes}
                  helperText={
                    errors.notes || `${notes.length}/500 caracteres`
                  }
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Right column: Totals summary */}
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{ p: 3, bgcolor: 'grey.50', height: '100%' }}
            >
              <Typography variant="h6" gutterBottom>
                Resumen del Pedido
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Subtotal ({orderItems.length} producto{orderItems.length !== 1 ? 's' : ''})
                </Typography>
                <Typography variant="body2">{formatCOP(subtotal)}</Typography>
              </Box>

              {taxPct > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Impuestos ({taxPct}%)
                  </Typography>
                  <Typography variant="body2">+ {formatCOP(taxAmount)}</Typography>
                </Box>
              )}

              {shipping > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Envío
                  </Typography>
                  <Typography variant="body2">+ {formatCOP(shipping)}</Typography>
                </Box>
              )}

              {discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="error">
                    Descuento
                  </Typography>
                  <Typography variant="body2" color="error">
                    - {formatCOP(discount)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total</Typography>
                <Typography
                  variant="h6"
                  color={total < 0 ? 'error' : 'primary'}
                  fontWeight="bold"
                >
                  {formatCOP(total)}
                </Typography>
              </Box>

              {errors.total && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.total}
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* --- CA-8: Action Buttons --- */}
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
          disabled={submitting || orderItems.length === 0 || !selectedCustomer}
        >
          {submitting ? 'Guardando...' : 'Guardar Pedido'}
        </Button>
      </Box>
    </Box>
  );
};

export default OrderForm;
