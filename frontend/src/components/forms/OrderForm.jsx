import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  MenuItem,
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
  PersonAdd as PersonAddIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import customerService from '../../services/customerService';
import productService from '../../services/productService';
import orderService from '../../services/orderService';
import authService from '../../services/authService';
import CreateCustomerModal from '../customers/CreateCustomerModal';

// US-ORD-014 CA-6: Motivos predefinidos para descuentos en pedidos
const DISCOUNT_REASONS = [
  'Promoción especial',
  'Cliente frecuente / VIP',
  'Liquidación',
  'Compensación por inconveniente',
  'Descuento autorizado por gerencia',
  'Otro',
];

// US-ORD-014 CA-7: Umbral de descuento (%) a partir del cual se requiere ser Admin
const DISCOUNT_AUTHORIZATION_THRESHOLD = 20;

const formatCOP = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

// US-ORD-013 CA-3: Umbral por defecto si el producto no trae reorder_point
const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const getStockLevel = (stock, reorderPoint) => {
  const threshold = reorderPoint ?? DEFAULT_LOW_STOCK_THRESHOLD;
  if (stock <= 0) return 'out';
  if (stock <= threshold) return 'low';
  return 'normal';
};

/**
 * OrderForm Component
 * US-ORD-001: Crear Pedido
 * US-ORD-008: Editar Pedido (mode="edit")
 * US-ORD-013: Validación de Stock al Crear Pedido
 *
 * CA-1: Selección de cliente
 * CA-2: Agregar productos al pedido
 * CA-3: Validación de stock en tiempo real
 * CA-4: Gestión de items del pedido
 * CA-6: Cálculo de totales
 * CA-7: Validaciones del formulario
 *
 * US-ORD-008:
 * CA-3: Confirmación al cambiar de cliente
 * CA-4/CA-5/CA-6: Agregar/eliminar productos y modificar cantidades con validación de stock
 * CA-7: Justificación de cambios de precio > 10%
 * CA-8: Comparación de totales antes/después
 *
 * US-ORD-013:
 * CA-2: Mensajes de error de stock con disponible/solicitado/máximo
 * CA-3: Indicador de stock por umbrales (reorder_point), deshabilita productos sin stock, tooltip
 * CA-4: Botón "Máx." para establecer cantidad al stock disponible
 * CA-9: Advertencia cuando el stock restante queda bajo tras agregar el item
 */
const OrderForm = ({ onSuccess, onCancel, mode = 'create', initialOrder = null, preselectedCustomerId = null }) => {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();

  // Customer state (CA-1)
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // US-ORD-008 CA-3: Confirmación de cambio de cliente
  const [pendingCustomerChange, setPendingCustomerChange] = useState(null);
  const [showCustomerChangeConfirm, setShowCustomerChangeConfirm] = useState(false);
  const originalCustomerId = initialOrder?.customer?.id || null;

  // Product search state (CA-2)
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Order items state (CA-4)
  const [orderItems, setOrderItems] = useState([]);
  const [loadingInitialItems, setLoadingInitialItems] = useState(isEdit);

  // US-ORD-008 CA-5: Confirmación de eliminación de producto
  const [removeConfirm, setRemoveConfirm] = useState(null);

  // Totals state (CA-6)
  const [taxPercentage, setTaxPercentage] = useState('0');
  const [shippingCost, setShippingCost] = useState('0');
  // US-ORD-014: Descuento a nivel de pedido
  const [discountAmount, setDiscountAmount] = useState('0');
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' | 'percentage'
  const [discountReason, setDiscountReason] = useState('');
  const [discountReasonDetail, setDiscountReasonDetail] = useState('');
  const [notes, setNotes] = useState('');

  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';

  // US-ORD-008 CA-7: Justificación de cambio de precio
  const [priceJustification, setPriceJustification] = useState('');

  // US-ORD-008 CA-10: Motivo de edición
  const [editReason, setEditReason] = useState('');

  // Form state
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // CA-2: Create customer modal state (US-CUST-010)
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [customerSuccessMessage, setCustomerSuccessMessage] = useState(null);

  // Debounce refs
  const customerDebounceRef = useRef(null);
  const productDebounceRef = useRef(null);

  // --- US-ORD-008: Preload form with existing order data ---
  useEffect(() => {
    if (!isEdit || !initialOrder) return;
    let cancelled = false;

    setSelectedCustomer(initialOrder.customer || null);
    setCustomerSearch(initialOrder.customer?.nombre_razon_social || '');
    setTaxPercentage(String(initialOrder.tax_percentage ?? 0));
    setShippingCost(String(initialOrder.shipping_cost ?? 0));
    if (initialOrder.discount_type && initialOrder.discount_value != null) {
      setDiscountType(initialOrder.discount_type);
      setDiscountAmount(String(initialOrder.discount_value));
    } else {
      setDiscountType('fixed');
      setDiscountAmount('0');
    }
    const reason = initialOrder.discount_reason || '';
    if (reason && !DISCOUNT_REASONS.includes(reason)) {
      setDiscountReason('Otro');
      setDiscountReasonDetail(reason);
    } else {
      setDiscountReason(reason);
      setDiscountReasonDetail('');
    }
    setNotes(initialOrder.notes || '');

    async function loadItems() {
      setLoadingInitialItems(true);
      try {
        const items = await Promise.all(
          (initialOrder.items || []).map(async (item) => {
            let stockAvailable = item.quantity;
            let reorderPoint = null;
            try {
              const res = await productService.getProduct(item.product_id);
              const product = res.data || res;
              stockAvailable = (product.stock_quantity || 0) + item.quantity;
              reorderPoint = product.reorder_point ?? null;
            } catch {
              // Si falla, se usa la cantidad actual como referencia mínima
            }
            return {
              product_id: item.product_id,
              product_name: item.product_name,
              product_sku: item.product_sku,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              stock_available: stockAvailable,
              reorder_point: reorderPoint,
              original_quantity: item.quantity,
              original_unit_price: item.unit_price,
            };
          })
        );
        if (!cancelled) setOrderItems(items);
      } finally {
        if (!cancelled) setLoadingInitialItems(false);
      }
    }
    loadItems();

    return () => {
      cancelled = true;
    };
  }, [isEdit, initialOrder]);

  // CA-10 (US-ORD-010): Preseleccionar cliente al crear pedido desde su historial
  useEffect(() => {
    if (isEdit || !preselectedCustomerId) return;
    let cancelled = false;

    async function loadPreselectedCustomer() {
      try {
        const response = await customerService.getCustomer(preselectedCustomerId);
        const customerData = response.data || response;
        if (!cancelled && customerData) {
          setSelectedCustomer(customerData);
          setCustomerSearch(customerData.nombre_razon_social || '');
        }
      } catch {
        // Si falla, el usuario simplemente selecciona el cliente manualmente
      }
    }
    loadPreselectedCustomer();

    return () => {
      cancelled = true;
    };
  }, [isEdit, preselectedCustomerId]);

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

  // US-ORD-008 CA-3: Interceptar cambio de cliente para confirmar
  const handleCustomerChange = (event, value) => {
    if (isEdit && originalCustomerId && value?.id !== originalCustomerId) {
      setPendingCustomerChange(value);
      setShowCustomerChangeConfirm(true);
      return;
    }
    setSelectedCustomer(value);
    if (errors.customer) {
      setErrors((prev) => { const { customer, ...rest } = prev; return rest; });
    }
  };

  const confirmCustomerChange = () => {
    setSelectedCustomer(pendingCustomerChange);
    setCustomerSearch(pendingCustomerChange?.nombre_razon_social || '');
    if (errors.customer) {
      setErrors((prev) => { const { customer, ...rest } = prev; return rest; });
    }
    setShowCustomerChangeConfirm(false);
    setPendingCustomerChange(null);
  };

  const cancelCustomerChange = () => {
    setShowCustomerChangeConfirm(false);
    setPendingCustomerChange(null);
  };

  // CA-5 & CA-8: Handle new customer created from modal (US-CUST-010)
  const handleCustomerCreated = (newCustomer) => {
    setSelectedCustomer(newCustomer);
    setCustomerSearch(newCustomer.nombre_razon_social || '');
    setShowCreateCustomerModal(false);
    setCustomerSuccessMessage(`Cliente ${newCustomer.nombre_razon_social} creado correctamente`);
    if (errors.customer) {
      setErrors((prev) => { const { customer, ...rest } = prev; return rest; });
    }
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
      if (newQty > existing.stock_available) {
        setErrors((prev) => ({
          ...prev,
          stock: `Stock insuficiente para ${product.name}. Disponible: ${existing.stock_available} unidades. Solicitado: ${newQty}`,
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
      // CA-3: Check stock before adding (los productos sin stock ya están deshabilitados en el buscador)
      if (product.stock_quantity < 1) {
        setErrors((prev) => ({
          ...prev,
          stock: `Stock insuficiente para ${product.name}. Disponible: 0 unidades. Solicitado: 1`,
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
          reorder_point: product.reorder_point ?? null,
          original_quantity: undefined,
          original_unit_price: undefined,
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

    // CA-3/CA-4/CA-6: Validate stock; el campo se revierte al no actualizar el estado
    if (qty > item.stock_available) {
      setErrors((prev) => ({
        ...prev,
        stock: `Stock insuficiente para ${item.product_name}. Disponible: ${item.stock_available} unidades. Solicitado: ${qty}. Máximo disponible: ${item.stock_available}`,
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

  // CA-4: Establece la cantidad al máximo stock disponible
  const handleSetMaxQuantity = (productId) => {
    const item = orderItems.find((i) => i.product_id === productId);
    if (!item) return;
    setErrors((prev) => {
      const { stock, ...rest } = prev;
      return rest;
    });
    setOrderItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: i.stock_available, subtotal: i.stock_available * i.unit_price }
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

  // US-ORD-008 CA-5: Eliminar producto con confirmación y mínimo 1 requerido
  const handleRemoveItem = (productId) => {
    if (!isEdit) {
      setOrderItems((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }

    if (orderItems.length <= 1) {
      setErrors((prev) => ({
        ...prev,
        items: 'El pedido debe tener al menos un producto. No se puede eliminar el último.',
      }));
      return;
    }

    const item = orderItems.find((i) => i.product_id === productId);
    setRemoveConfirm({ productId, productName: item?.product_name || 'este producto' });
  };

  const confirmRemoveItem = () => {
    if (removeConfirm) {
      setOrderItems((prev) => prev.filter((i) => i.product_id !== removeConfirm.productId));
      setErrors((prev) => { const { items, ...rest } = prev; return rest; });
    }
    setRemoveConfirm(null);
  };

  // --- CA-6: Totals Calculation ---
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxPct = parseFloat(taxPercentage) || 0;
  const shipping = parseFloat(shippingCost) || 0;
  const discountInput = parseFloat(discountAmount) || 0;
  const actualDiscount = discountType === 'percentage'
    ? subtotal * (discountInput / 100)
    : discountInput;
  // CA-4: El impuesto se calcula sobre el subtotal después del descuento
  const netSubtotal = subtotal - actualDiscount;
  const taxAmount = netSubtotal * (taxPct / 100);
  const total = netSubtotal + taxAmount + shipping;
  const discountPercentage = subtotal > 0
    ? discountType === 'percentage'
      ? discountInput
      : (actualDiscount / subtotal) * 100
    : 0;
  // CA-7: Solo Admin puede aplicar descuentos mayores al umbral
  const discountNeedsAdmin = discountPercentage > DISCOUNT_AUTHORIZATION_THRESHOLD && !isAdmin;

  // US-ORD-008 CA-7: Productos con cambio de precio > 10%
  const priceChangedItems = isEdit
    ? orderItems.filter((item) => {
        if (item.original_unit_price == null || item.original_unit_price <= 0) return false;
        const changePct = Math.abs((item.unit_price - item.original_unit_price) / item.original_unit_price) * 100;
        return changePct > 10;
      })
    : [];

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

    if (taxPct > 100) {
      newErrors.tax = 'El impuesto no puede exceder 100%';
    }

    if (shipping < 0) {
      newErrors.shipping = 'El costo de envío no puede ser negativo';
    }

    if (discountInput < 0) {
      newErrors.discount = 'El descuento no puede ser negativo';
    }

    if (discountType === 'percentage' && discountInput > 100) {
      newErrors.discount = 'El descuento no puede exceder 100%';
    }

    // CA-3: El descuento de monto fijo no puede exceder el subtotal
    if (discountType === 'fixed' && discountInput > subtotal) {
      newErrors.discount = 'El descuento no puede ser mayor al subtotal';
    }

    // CA-6: Motivo del descuento requerido
    if (discountInput > 0) {
      if (!discountReason) {
        newErrors.discountReason = 'Debe seleccionar un motivo para el descuento';
      } else if (discountReason === 'Otro' && !discountReasonDetail.trim()) {
        newErrors.discountReasonDetail = 'Debe especificar el motivo del descuento';
      } else if (discountReasonDetail.length > 200) {
        newErrors.discountReasonDetail = 'El motivo no puede exceder 200 caracteres';
      }
    }

    // CA-7: Descuento >20% requiere ser Admin
    if (discountNeedsAdmin) {
      newErrors.discount =
        'Los descuentos mayores al 20% requieren autorización de un Administrador. ' +
        'Solicite a un Administrador que cree o apruebe este pedido.';
    }

    // US-ORD-008 CA-7: Justificación de cambio de precio > 10%
    if (isEdit && priceChangedItems.length > 0 && !priceJustification.trim()) {
      newErrors.priceJustification =
        'Se requiere justificación cuando el precio unitario cambia más del 10%';
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
        discount_type: discountInput > 0 ? discountType : null,
        discount_value: discountInput > 0 ? discountInput : 0,
        discount_reason: discountInput > 0 ? discountReason : null,
        discount_reason_detail: discountInput > 0 && discountReason === 'Otro'
          ? discountReasonDetail.trim()
          : null,
        notes: notes.trim() || null,
      };

      let result;
      if (isEdit) {
        orderData.price_justification = priceJustification.trim() || null;
        orderData.edit_reason = editReason.trim() || null;
        orderData.expected_updated_at = initialOrder.updated_at;
        result = await orderService.updateOrder(initialOrder.id, orderData);
      } else {
        result = await orderService.createOrder(orderData);
      }

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
      } else if (error?.error?.code === 'CONFLICT') {
        setSubmitError(
          error.error.message || 'El pedido fue modificado por otro usuario. Recargue la página e intente de nuevo.'
        );
      } else if (error?.error?.code === 'DISCOUNT_AUTHORIZATION_REQUIRED') {
        setSubmitError(error.error.message);
      } else {
        setSubmitError(
          error?.error?.message || `Error al ${isEdit ? 'editar' : 'crear'} el pedido`
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

        {/* CA-5: Success message after customer creation */}
        {customerSuccessMessage && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setCustomerSuccessMessage(null)}
          >
            {customerSuccessMessage}
          </Alert>
        )}

        {/* CA-1: Search + new customer button */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
        <Autocomplete
          options={customerOptions}
          getOptionLabel={(option) =>
            `${option.nombre_razon_social} - ${option.numero_documento || ''}`
          }
          value={selectedCustomer}
          onChange={handleCustomerChange}
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
          </Box>

          {/* CA-1: "+ Nuevo Cliente" button */}
          <Tooltip title="Crear nuevo cliente">
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => setShowCreateCustomerModal(true)}
              sx={{ height: 56, whiteSpace: 'nowrap' }}
            >
              Nuevo Cliente
            </Button>
          </Tooltip>
        </Box>

        {/* Selected customer info */}
        {selectedCustomer && (
          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Nombre</Typography>
                    <Typography variant="body2">{selectedCustomer.nombre_razon_social}</Typography>
                  </Box>
                  <Tooltip title="Ver historial de pedidos de este cliente">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/customers/${selectedCustomer.id}/orders`)}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">Documento</Typography>
                <Typography variant="body2">
                  {selectedCustomer.tipo_documento || '-'}: {selectedCustomer.numero_documento || '-'}
                </Typography>
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
          getOptionDisabled={(option) => option.stock_quantity <= 0}
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
            const stockLevel = getStockLevel(option.stock_quantity, option.reorder_point);
            const stockColor = stockLevel === 'out' ? 'error' : stockLevel === 'low' ? 'warning' : 'success';
            const stockLabel = stockLevel === 'out' ? 'Sin stock' : `Stock: ${option.stock_quantity}`;
            return (
              <li key={option.id} {...rest}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      SKU: {option.sku} | Precio: {formatCOP(option.sale_price)}
                    </Typography>
                  </Box>
                  <Tooltip
                    title={
                      stockLevel === 'out'
                        ? 'Este producto no tiene stock disponible'
                        : `Stock disponible: ${option.stock_quantity} unidades`
                    }
                  >
                    <Chip
                      size="small"
                      label={stockLabel}
                      color={stockColor}
                      variant="outlined"
                    />
                  </Tooltip>
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
        {loadingInitialItems && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loadingInitialItems && orderItems.length > 0 && (
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
                {orderItems.map((item) => {
                  const priceChanged = isEdit && item.original_unit_price != null && item.original_unit_price > 0
                    && Math.abs((item.unit_price - item.original_unit_price) / item.original_unit_price) * 100 > 10;
                  // CA-9: stock restante después de este item, para advertir si queda bajo
                  const remainingAfterItem = item.stock_available - item.quantity;
                  const remainingLevel = getStockLevel(remainingAfterItem, item.reorder_point);
                  const stockChipColor = remainingLevel === 'low' ? 'warning' : 'success';
                  return (
                  <TableRow key={item.product_id}>
                    <TableCell>
                      <Typography variant="body2">{item.product_name}</Typography>
                      {isEdit && item.original_quantity === undefined && (
                        <Chip label="Nuevo" size="small" color="info" variant="outlined" sx={{ mt: 0.5 }} />
                      )}
                      {/* CA-9: Advertencia de stock bajo (suficiente pero limitado) */}
                      {remainingLevel === 'low' && (
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                          Solo quedarán {remainingAfterItem} unidades disponibles
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={item.product_sku} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                          inputProps={{ min: 1, max: item.stock_available, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                          error={item.quantity > item.stock_available}
                        />
                        {/* CA-4: Botón para establecer cantidad al máximo disponible */}
                        {item.quantity < item.stock_available && (
                          <Tooltip title={`Establecer al máximo disponible (${item.stock_available})`}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleSetMaxQuantity(item.product_id)}
                              sx={{ minWidth: 'auto', px: 0.5, fontSize: '0.7rem' }}
                            >
                              Máx.
                            </Button>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={`Stock disponible: ${item.stock_available} unidades`}>
                        <Chip
                          size="small"
                          icon={<InventoryIcon />}
                          label={item.stock_available}
                          color={stockChipColor}
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
                        color={priceChanged ? 'warning' : undefined}
                        focused={priceChanged || undefined}
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* US-ORD-008 CA-7: Justificación de cambio de precio */}
        {isEdit && priceChangedItems.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 1 }}>
              El precio cambió más del 10% para: {priceChangedItems.map((i) => i.product_name).join(', ')}.
              Se requiere justificación.
            </Alert>
            <TextField
              label="Justificación del cambio de precio *"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={priceJustification}
              onChange={(e) => setPriceJustification(e.target.value)}
              error={!!errors.priceJustification}
              helperText={errors.priceJustification}
            />
          </Box>
        )}

        {!loadingInitialItems && orderItems.length === 0 && (
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
                <Box sx={{ mb: 1 }}>
                  <ToggleButtonGroup
                    value={discountType}
                    exclusive
                    onChange={(e, val) => { if (val) { setDiscountType(val); setDiscountAmount('0'); } }}
                    size="small"
                    aria-label="tipo de descuento"
                  >
                    <ToggleButton value="fixed">Monto fijo</ToggleButton>
                    <ToggleButton value="percentage">Porcentaje</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <TextField
                  label={discountType === 'percentage' ? 'Descuento (%)' : 'Descuento'}
                  type="number"
                  fullWidth
                  size="small"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  inputProps={{ min: 0, step: 0.01, ...(discountType === 'percentage' ? { max: 100 } : {}) }}
                  error={!!errors.discount}
                  helperText={
                    errors.discount ||
                    (discountType === 'percentage' && discountInput > 0
                      ? `= ${formatCOP(actualDiscount)}`
                      : discountType === 'fixed' && discountPercentage > 0
                      ? `${discountPercentage.toFixed(1)}% del subtotal`
                      : '')
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {discountType === 'percentage' ? '%' : 'COP'}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* CA-6: Motivo del descuento */}
              {discountInput > 0 && (
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Motivo del descuento *"
                    fullWidth
                    size="small"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    error={!!errors.discountReason}
                    helperText={errors.discountReason}
                  >
                    {DISCOUNT_REASONS.map((reason) => (
                      <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              {discountInput > 0 && discountReason === 'Otro' && (
                <Grid item xs={12}>
                  <TextField
                    label="Especifique el motivo *"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={discountReasonDetail}
                    onChange={(e) => setDiscountReasonDetail(e.target.value)}
                    inputProps={{ maxLength: 200 }}
                    error={!!errors.discountReasonDetail}
                    helperText={
                      errors.discountReasonDetail || `${discountReasonDetail.length}/200 caracteres`
                    }
                  />
                </Grid>
              )}

              {/* CA-7: Advertencia de autorización para descuentos > 20% */}
              {discountPercentage > DISCOUNT_AUTHORIZATION_THRESHOLD && (
                <Grid item xs={12}>
                  <Alert severity={discountNeedsAdmin ? 'error' : 'warning'}>
                    {discountNeedsAdmin
                      ? 'Descuentos mayores al 20% requieren autorización de administrador. Solicite a un Administrador que cree o apruebe este pedido.'
                      : 'Descuento superior al 20%, aplicado con autorización de Administrador.'}
                  </Alert>
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

              {/* US-ORD-008 CA-10: Motivo de edición (opcional) */}
              {isEdit && (
                <Grid item xs={12}>
                  <TextField
                    label="Motivo de edición (opcional)"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Ej: corrección de cantidad solicitada por el cliente"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HistoryIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}
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

              {actualDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="error">
                    Descuento ({discountPercentage.toFixed(1)}%)
                  </Typography>
                  <Typography variant="body2" color="error">
                    - {formatCOP(actualDiscount)}
                  </Typography>
                </Box>
              )}

              {actualDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Subtotal neto
                  </Typography>
                  <Typography variant="body2">{formatCOP(netSubtotal)}</Typography>
                </Box>
              )}

              {taxPct > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Impuesto ({taxPct}%)
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

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">TOTAL</Typography>
                <Typography
                  variant="h6"
                  color={total < 0 ? 'error' : actualDiscount > 0 ? 'success.main' : 'primary'}
                  fontWeight="bold"
                >
                  {formatCOP(total)}
                </Typography>
              </Box>

              {/* US-ORD-008 CA-8: Comparación de totales antes/después */}
              {isEdit && initialOrder && Math.abs(total - (initialOrder.total || 0)) > 0.01 && (
                <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light' }}>
                  <Typography variant="caption" color="text.secondary">
                    Total anterior: <strong>{formatCOP(initialOrder.total)}</strong>
                    {' | '}
                    Nuevo total: <strong>{formatCOP(total)}</strong>
                  </Typography>
                </Box>
              )}

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
          disabled={submitting || orderItems.length === 0 || !selectedCustomer || loadingInitialItems || discountNeedsAdmin}
        >
          {submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Guardar Pedido'}
        </Button>
      </Box>

      {/* CA-2: Create Customer Modal (US-CUST-010) */}
      <CreateCustomerModal
        open={showCreateCustomerModal}
        onClose={() => setShowCreateCustomerModal(false)}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* US-ORD-008 CA-3: Confirmar cambio de cliente */}
      <Dialog open={showCustomerChangeConfirm} onClose={cancelCustomerChange} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar cliente del pedido</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de cambiar el cliente de este pedido?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelCustomerChange}>Cancelar</Button>
          <Button variant="contained" onClick={confirmCustomerChange}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* US-ORD-008 CA-5: Confirmar eliminación de producto */}
      <Dialog open={!!removeConfirm} onClose={() => setRemoveConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar producto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Eliminar {removeConfirm?.productName} del pedido?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveConfirm(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={confirmRemoveItem}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderForm;
