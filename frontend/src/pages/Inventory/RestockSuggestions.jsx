/**
 * RestockSuggestions – Sugerencias de Reabastecimiento
 * US-SUPP-015: Notificaciones de Reabastecimiento
 *
 * CA-1: Identifica productos con stock bajo
 * CA-2: Lista de productos que necesitan reabastecimiento
 * CA-3: Proveedor preferido sugerido por producto
 * CA-4: Cantidad sugerida basada en promedio de ventas
 * CA-5: Crear orden de compra directamente desde las sugerencias
 * CA-6: Agrupación por proveedor
 * CA-7: Marcar sugerencias como procesadas
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Skeleton,
  Divider,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  Checkbox,
} from '@mui/material';
import {
  Home as HomeIcon,
  Inventory as InventoryIcon,
  LocalShipping as SupplierIcon,
  ShoppingCart as OrderIcon,
  CheckCircle as ProcessIcon,
  Undo as UndoIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

const formatCurrency = (amount) =>
  amount === null || amount === undefined
    ? '-'
    : new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(amount);

// CA-6: Agrupa las sugerencias por proveedor preferido (o "sin proveedor")
const groupBySupplier = (suggestions) => {
  const groups = new Map();
  for (const s of suggestions) {
    const key = s.preferred_supplier?.supplier_id || 'none';
    if (!groups.has(key)) {
      groups.set(key, {
        supplierId: s.preferred_supplier?.supplier_id || null,
        supplierName: s.preferred_supplier?.supplier_name || 'Sin proveedor asignado',
        items: [],
      });
    }
    groups.get(key).items.push(s);
  }
  // Grupo "sin proveedor" al final
  return Array.from(groups.values()).sort((a, b) => {
    if (!a.supplierId) return 1;
    if (!b.supplierId) return -1;
    return a.supplierName.localeCompare(b.supplierName);
  });
};

const RestockSuggestions = () => {
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showProcessed, setShowProcessed] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryService.getRestockSuggestions(showProcessed);
      if (response.success) {
        setSuggestions(response.data || []);
      } else {
        setError(response.error?.message || 'Error al cargar sugerencias');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar sugerencias de reabastecimiento');
    } finally {
      setLoading(false);
    }
  }, [showProcessed]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const groups = useMemo(() => groupBySupplier(suggestions), [suggestions]);

  // CA-7: Marcar/reactivar sugerencias
  const handleToggleProcessed = async (productId, isDismissed) => {
    setProcessingId(productId);
    try {
      if (isDismissed) {
        await inventoryService.undismissRestockSuggestion(productId);
      } else {
        await inventoryService.dismissRestockSuggestion(productId);
      }
      await loadSuggestions();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } catch (err) {
      setError(err?.error?.message || 'Error al actualizar la sugerencia');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleSelect = (productId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  // CA-5: Crear orden de compra prellenada con los productos del grupo (o seleccionados)
  const handleCreateOrder = (group, onlySelected = false) => {
    const items = (onlySelected ? group.items.filter((i) => selectedIds.has(i.product_id)) : group.items)
      .map((s) => ({
        product_id: s.product_id,
        product_name: s.product_name,
        product_sku: s.product_sku,
        quantity_ordered: s.suggested_quantity,
        unit_cost: s.preferred_supplier?.preferential_price ?? 0,
      }));

    if (items.length === 0) return;

    navigate('/purchase-orders/new', {
      state: {
        prefill: {
          supplier: group.supplierId ? { id: group.supplierId, company_name: group.supplierName } : null,
          items,
        },
      },
    });
  };

  const renderSkeleton = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={150} />
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate('/dashboard')}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Inicio
        </Link>
        <Typography sx={{ display: 'flex', alignItems: 'center' }} color="text.primary">
          <InventoryIcon sx={{ mr: 0.5 }} fontSize="small" />
          Sugerencias de Reabastecimiento
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Sugerencias de Reabastecimiento
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Productos con stock en o por debajo del punto de reorden, agrupados por proveedor
          </Typography>
        </Box>
        <FormControlLabel
          control={<Switch checked={showProcessed} onChange={(e) => setShowProcessed(e.target.checked)} />}
          label="Mostrar procesadas"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <>
          {renderSkeleton()}
          {renderSkeleton()}
        </>
      ) : suggestions.length === 0 ? (
        <Alert severity="success">
          No hay productos que necesiten reabastecimiento en este momento.
        </Alert>
      ) : (
        groups.map((group) => {
          const groupSelectedCount = group.items.filter((i) => selectedIds.has(i.product_id)).length;
          return (
            <Paper key={group.supplierId || 'none'} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SupplierIcon color={group.supplierId ? 'primary' : 'disabled'} />
                  {group.supplierName}
                  <Chip label={`${group.items.length} producto${group.items.length !== 1 ? 's' : ''}`} size="small" />
                </Typography>
                {group.supplierId && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OrderIcon />}
                      onClick={() => handleCreateOrder(group, true)}
                      disabled={groupSelectedCount === 0}
                    >
                      Crear Orden ({groupSelectedCount} seleccionados)
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<OrderIcon />}
                      onClick={() => handleCreateOrder(group, false)}
                    >
                      Crear Orden con Todos
                    </Button>
                  </Box>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />

              {!group.supplierId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Estos productos no tienen un proveedor vinculado. Vincule un proveedor desde el perfil del
                  producto o del proveedor para poder crear una orden de compra directamente.
                </Alert>
              )}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {group.supplierId && <TableCell padding="checkbox" />}
                      <TableCell>Producto</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="right">Stock Actual</TableCell>
                      <TableCell align="right">Punto de Reorden</TableCell>
                      <TableCell align="right">Ventas Prom./Día</TableCell>
                      <TableCell align="right">Cantidad Sugerida</TableCell>
                      <TableCell align="right">Precio Preferencial</TableCell>
                      <TableCell align="center" sx={{ width: 100 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.items.map((s) => (
                      <TableRow key={s.product_id} hover>
                        {group.supplierId && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={selectedIds.has(s.product_id)}
                              onChange={() => handleToggleSelect(s.product_id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant="body2">{s.product_name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={s.product_sku} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            {s.is_out_of_stock && (
                              <Tooltip title="Sin stock">
                                <WarningIcon fontSize="small" color="error" />
                              </Tooltip>
                            )}
                            <Typography
                              variant="body2"
                              color={s.is_out_of_stock ? 'error.main' : 'text.primary'}
                              fontWeight={s.is_out_of_stock ? 'bold' : 'normal'}
                            >
                              {s.stock_quantity}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{s.reorder_point}</TableCell>
                        <TableCell align="right">{s.average_daily_sales}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">{s.suggested_quantity}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(s.preferred_supplier?.preferential_price)}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={s.is_dismissed ? 'Reactivar sugerencia' : 'Marcar como procesada'}>
                            <IconButton
                              size="small"
                              color={s.is_dismissed ? 'default' : 'success'}
                              onClick={() => handleToggleProcessed(s.product_id, s.is_dismissed)}
                              disabled={processingId === s.product_id}
                            >
                              {s.is_dismissed ? <UndoIcon fontSize="small" /> : <ProcessIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          );
        })
      )}
    </Container>
  );
};

export default RestockSuggestions;
