/**
 * ReceivePurchaseOrderModal – Registrar recepción de mercancía de una orden de compra
 * US-SUPP-008: CA-2 (lista de productos), CA-3 (cantidad recibida), CA-4 (razón de discrepancia)
 */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import purchaseOrderService from '../../services/purchaseOrderService';

const DISCREPANCY_REASONS = ['Faltante', 'Sobrante', 'Daño'];

const ReceivePurchaseOrderModal = ({ purchaseOrderId, orderNumber, onConfirm, onClose, loading = false }) => {
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [items, setItems] = useState([]); // [{ item_id, product_name, product_sku, quantity_ordered, quantity_received, discrepancy_reason, discrepancy_notes }]

  useEffect(() => {
    let cancelled = false;
    async function loadOrder() {
      setLoadingOrder(true);
      setLoadError(null);
      try {
        const result = await purchaseOrderService.getPurchaseOrder(purchaseOrderId);
        if (cancelled) return;
        const orderItems = (result.data?.items || []).map((item) => ({
          item_id: item.id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity_ordered: item.quantity_ordered,
          quantity_received: item.quantity_ordered,
          discrepancy_reason: '',
          discrepancy_notes: '',
        }));
        setItems(orderItems);
      } catch (err) {
        if (!cancelled) setLoadError(err?.error?.message || 'Error al cargar la orden de compra');
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    }
    loadOrder();
    return () => { cancelled = true; };
  }, [purchaseOrderId]);

  const handleQuantityChange = (itemId, value) => {
    const qty = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setItems((prev) =>
      prev.map((item) => (item.item_id === itemId ? { ...item, quantity_received: qty } : item))
    );
  };

  const handleReasonChange = (itemId, value) => {
    setItems((prev) =>
      prev.map((item) => (item.item_id === itemId ? { ...item, discrepancy_reason: value } : item))
    );
  };

  const handleNotesChange = (itemId, value) => {
    setItems((prev) =>
      prev.map((item) => (item.item_id === itemId ? { ...item, discrepancy_notes: value } : item))
    );
  };

  const hasDiscrepancy = (item) =>
    item.quantity_received !== '' && item.quantity_received !== item.quantity_ordered;

  // CA-4: Todas las discrepancias deben tener razón antes de poder confirmar
  const isValid =
    items.length > 0 &&
    items.every(
      (item) =>
        item.quantity_received !== '' &&
        item.quantity_received >= 0 &&
        (!hasDiscrepancy(item) || item.discrepancy_reason)
    );

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(
      items.map((item) => ({
        item_id: item.item_id,
        quantity_received: item.quantity_received,
        discrepancy_reason: hasDiscrepancy(item) ? item.discrepancy_reason : null,
        discrepancy_notes: hasDiscrepancy(item) ? item.discrepancy_notes.trim() || null : null,
      }))
    );
  };

  return (
    <Dialog open onClose={() => !loading && onClose()} maxWidth="md" fullWidth>
      <DialogTitle>Recibir Mercancía — Orden {orderNumber}</DialogTitle>

      <DialogContent dividers>
        {loadingOrder && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {loadError && <Alert severity="error">{loadError}</Alert>}

        {!loadingOrder && !loadError && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Indique la cantidad realmente recibida para cada producto. Si difiere de lo
              solicitado, deberá indicar la razón de la discrepancia.
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="center">Solicitado</TableCell>
                    <TableCell align="center" sx={{ width: 130 }}>Recibido</TableCell>
                    <TableCell sx={{ width: 180 }}>Razón de discrepancia</TableCell>
                    <TableCell>Notas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const discrepancy = hasDiscrepancy(item);
                    return (
                      <TableRow key={item.item_id}>
                        <TableCell>
                          <Typography variant="body2">{item.product_name}</Typography>
                          <Chip label={item.product_sku} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                        </TableCell>
                        <TableCell align="center">{item.quantity_ordered}</TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity_received}
                            onChange={(e) => handleQuantityChange(item.item_id, e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: 'center' } }}
                            sx={{ width: 90 }}
                            error={discrepancy && !item.discrepancy_reason}
                            color={discrepancy ? 'warning' : undefined}
                            focused={discrepancy || undefined}
                          />
                        </TableCell>
                        <TableCell>
                          {discrepancy && (
                            <TextField
                              select
                              size="small"
                              fullWidth
                              value={item.discrepancy_reason}
                              onChange={(e) => handleReasonChange(item.item_id, e.target.value)}
                              error={!item.discrepancy_reason}
                              helperText={!item.discrepancy_reason ? 'Requerido' : ''}
                            >
                              {DISCREPANCY_REASONS.map((reason) => (
                                <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                              ))}
                            </TextField>
                          )}
                        </TableCell>
                        <TableCell>
                          {discrepancy && (
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Notas (opcional)"
                              value={item.discrepancy_notes}
                              onChange={(e) => handleNotesChange(item.item_id, e.target.value)}
                              inputProps={{ maxLength: 200 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!isValid || loading || loadingOrder}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Guardando...' : 'Confirmar Recepción'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceivePurchaseOrderModal;
