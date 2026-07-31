/**
 * SupplierProductsPanel – Productos que provee un proveedor
 * US-SUPP-014: Productos por Proveedor
 *
 * CA-1: Lista de productos que provee el proveedor
 * CA-2: Vincular productos existentes al proveedor
 * CA-3: Precio preferencial por producto y proveedor
 * CA-4: Último precio de compra por producto
 * CA-5: Proveedor preferido para cada producto
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Autocomplete,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Skeleton,
} from '@mui/material';
import {
  Inventory2 as ProductsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import supplierService from '../../services/supplierService';
import productService from '../../services/productService';

const formatCurrency = (amount) =>
  amount === null || amount === undefined
    ? '-'
    : new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(amount);

function LinkProductDialog({ onClose, onSaved, existingProductIds }) {
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [preferentialPrice, setPreferentialPrice] = useState('');
  const [isPreferred, setIsPreferred] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  const searchProducts = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setProductOptions([]);
      return;
    }
    setLoadingProducts(true);
    try {
      const result = await productService.getProducts({ search: query, limit: 10, is_active: 'true' });
      setProductOptions((result.data || []).filter((p) => !existingProductIds.includes(p.id)));
    } catch {
      setProductOptions([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [existingProductIds]);

  const handleSearchChange = (event, value) => {
    setProductSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(value), 300);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleSave = async () => {
    if (!selectedProduct) {
      setError('Debe seleccionar un producto');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSaved({
        product_id: selectedProduct.id,
        preferential_price: preferentialPrice !== '' ? parseFloat(preferentialPrice) : null,
        is_preferred: isPreferred,
      });
    } catch (err) {
      setError(err?.error?.message || 'Error al vincular el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Vincular Producto al Proveedor</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Autocomplete
          options={productOptions}
          getOptionLabel={(option) => `${option.name} (${option.sku})`}
          value={selectedProduct}
          onChange={(_e, value) => setSelectedProduct(value)}
          onInputChange={handleSearchChange}
          inputValue={productSearch}
          loading={loadingProducts}
          noOptionsText={
            productSearch.length < 2 ? 'Escriba al menos 2 caracteres para buscar' : 'No se encontraron productos'
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar producto por nombre o SKU"
              autoFocus
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingProducts ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Precio Preferencial (opcional)"
          type="number"
          fullWidth
          size="small"
          value={preferentialPrice}
          onChange={(e) => setPreferentialPrice(e.target.value)}
          inputProps={{ min: 0, step: 0.01 }}
          InputProps={{ startAdornment: <InputAdornment position="start">COP</InputAdornment> }}
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={<Checkbox checked={isPreferred} onChange={(e) => setIsPreferred(e.target.checked)} />}
          label="Marcar como proveedor preferido de este producto"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !selectedProduct}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Guardando...' : 'Vincular'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditLinkDialog({ link, onClose, onSaved }) {
  const [preferentialPrice, setPreferentialPrice] = useState(
    link.preferential_price !== null ? String(link.preferential_price) : ''
  );
  const [isPreferred, setIsPreferred] = useState(link.is_preferred);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSaved({
        preferential_price: preferentialPrice !== '' ? parseFloat(preferentialPrice) : null,
        is_preferred: isPreferred,
      });
    } catch (err) {
      setError(err?.error?.message || 'Error al actualizar el vínculo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Vínculo — {link.product_name}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          label="Precio Preferencial (opcional)"
          type="number"
          fullWidth
          size="small"
          value={preferentialPrice}
          onChange={(e) => setPreferentialPrice(e.target.value)}
          inputProps={{ min: 0, step: 0.01 }}
          InputProps={{ startAdornment: <InputAdornment position="start">COP</InputAdornment> }}
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={<Checkbox checked={isPreferred} onChange={(e) => setIsPreferred(e.target.checked)} />}
          label="Marcar como proveedor preferido de este producto"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function SupplierProductsPanel({ supplierId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editLink, setEditLink] = useState(null);
  const [removing, setRemoving] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierService.getSupplierProducts(supplierId);
      if (response.success) {
        setProducts(response.data || []);
      } else {
        setError(response.error?.message || 'Error al cargar productos del proveedor');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar productos del proveedor');
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleLinkSaved = async (data) => {
    const response = await supplierService.linkSupplierProduct(supplierId, data);
    if (response.success) {
      setLinkDialogOpen(false);
      loadProducts();
    }
  };

  const handleEditSaved = async (data) => {
    const response = await supplierService.updateSupplierProduct(supplierId, editLink.product_id, data);
    if (response.success) {
      setEditLink(null);
      loadProducts();
    }
  };

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      await supplierService.unlinkSupplierProduct(supplierId, productId);
      loadProducts();
    } catch (err) {
      setError(err?.error?.message || 'Error al desvincular el producto');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ProductsIcon color="primary" />
          Productos que Provee
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setLinkDialogOpen(true)}>
          Vincular Producto
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Skeleton variant="rectangular" height={120} />
      ) : products.length === 0 ? (
        <Alert severity="info">Este proveedor aún no tiene productos vinculados.</Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Precio Preferencial</TableCell>
                <TableCell align="right">Último Precio de Compra</TableCell>
                <TableCell align="center">Preferido</TableCell>
                <TableCell align="center" sx={{ width: 90 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((link) => (
                <TableRow key={link.id} hover>
                  <TableCell>{link.product_name}</TableCell>
                  <TableCell>
                    <Chip label={link.product_sku} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(link.preferential_price)}</TableCell>
                  <TableCell align="right">{formatCurrency(link.last_purchase_price)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={link.is_preferred ? 'Proveedor preferido para este producto' : 'No es el preferido'}>
                      {link.is_preferred ? (
                        <StarIcon fontSize="small" color="warning" />
                      ) : (
                        <StarBorderIcon fontSize="small" color="disabled" />
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => setEditLink(link)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemove(link.product_id)}
                      disabled={removing === link.product_id}
                    >
                      {removing === link.product_id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {linkDialogOpen && (
        <LinkProductDialog
          onClose={() => setLinkDialogOpen(false)}
          onSaved={handleLinkSaved}
          existingProductIds={products.map((p) => p.product_id)}
        />
      )}

      {editLink && (
        <EditLinkDialog link={editLink} onClose={() => setEditLink(null)} onSaved={handleEditSaved} />
      )}
    </Paper>
  );
}
