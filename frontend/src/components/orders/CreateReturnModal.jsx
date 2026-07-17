/**
 * CreateReturnModal – Modal para procesar una devolución de pedido
 * US-ORD-011: CA-2 (crear), CA-3 (selección de productos/cantidades),
 *             CA-4 (motivo), CA-5 (cálculo de monto)
 */
import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Alert,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';

export const RETURN_REASONS = [
  'Producto defectuoso/dañado',
  'Producto incorrecto (error en pedido)',
  'Cliente cambió de opinión',
  'Producto no cumple expectativas',
  'Duplicado',
  'Otro',
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

/**
 * @param {Object} order - Pedido con items [{ product_id, product_name, product_sku, quantity, unit_price }]
 * @param {Array} existingReturns - Devoluciones ya creadas para el pedido (no rechazadas cuentan)
 * @param {function} onConfirm - Callback({ items, reason, reason_detail, notes }) → Promise
 * @param {function} onClose
 * @param {boolean} loading
 * @param {string} [error]
 */
const CreateReturnModal = ({ order, existingReturns = [], onConfirm, onClose, loading = false, error = null }) => {
  const [selection, setSelection] = useState({}); // { [product_id]: { checked, quantity } }
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  // CA-3/CA-12: Cantidad ya devuelta (o en trámite) por producto
  const alreadyReturnedMap = useMemo(() => {
    const map = {};
    existingReturns
      .filter((r) => r.status !== 'Rechazada')
      .forEach((r) => {
        (r.items || []).forEach((item) => {
          map[item.product_id] = (map[item.product_id] || 0) + item.quantity;
        });
      });
    return map;
  }, [existingReturns]);

  const items = (order?.items || []).map((item) => ({
    ...item,
    remaining: item.quantity - (alreadyReturnedMap[item.product_id] || 0),
  }));

  const toggleItem = (productId, maxQty) => {
    setSelection((prev) => {
      const current = prev[productId];
      if (current?.checked) {
        const { [productId]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: { checked: true, quantity: maxQty === 1 ? 1 : 1 } };
    });
    setErrors((prev) => ({ ...prev, items: undefined }));
  };

  const setQuantity = (productId, value, maxQty) => {
    const qty = Math.max(1, Math.min(maxQty, Number(value) || 1));
    setSelection((prev) => ({ ...prev, [productId]: { checked: true, quantity: qty } }));
  };

  const selectedEntries = Object.entries(selection).filter(([, v]) => v.checked);
  const selectedCount = selectedEntries.length;

  const returnTotal = selectedEntries.reduce((sum, [productId, v]) => {
    const item = items.find((i) => i.product_id === productId);
    return sum + (item ? item.unit_price * v.quantity : 0);
  }, 0);

  const validate = () => {
    const newErrors = {};
    if (selectedCount === 0) {
      newErrors.items = 'Seleccione al menos un producto a devolver';
    }
    if (!reason) {
      newErrors.reason = 'Seleccione un motivo de devolución';
    }
    if (reason === 'Otro') {
      if (!reasonDetail.trim()) {
        newErrors.reasonDetail = 'Especifique el motivo de la devolución';
      } else if (reasonDetail.length > 300) {
        newErrors.reasonDetail = 'El motivo no puede exceder 300 caracteres';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm({
      items: selectedEntries.map(([productId, v]) => ({
        product_id: productId,
        quantity: v.quantity,
      })),
      reason,
      reason_detail: reason === 'Otro' ? reasonDetail.trim() : null,
      notes: notes.trim() || null,
    });
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog open onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentReturnIcon color="primary" />
        Nueva Devolución para Pedido {order?.order_number}
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* CA-2/CA-3: Selección de productos */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Productos del pedido
        </Typography>
        <TableContainer variant="outlined" component={Box} sx={{ mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox" />
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Comprado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio Unit.</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Cant. a devolver</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const sel = selection[item.product_id];
                const disabled = item.remaining <= 0;
                return (
                  <TableRow key={item.product_id} sx={{ opacity: disabled ? 0.5 : 1 }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={Boolean(sel?.checked)}
                        disabled={disabled}
                        onChange={() => toggleItem(item.product_id, item.remaining)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.product_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.product_sku}</Typography>
                      {disabled && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                          Sin unidades disponibles para devolución
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell align="center">
                      {sel?.checked && item.remaining > 1 ? (
                        <TextField
                          type="number"
                          size="small"
                          value={sel.quantity}
                          onChange={(e) => setQuantity(item.product_id, e.target.value, item.remaining)}
                          inputProps={{ min: 1, max: item.remaining, style: { textAlign: 'center', width: 50 } }}
                        />
                      ) : (
                        sel?.checked ? 1 : '-'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {errors.items && (
          <Typography variant="caption" color="error.main" sx={{ display: 'block', mb: 1 }}>
            {errors.items}
          </Typography>
        )}

        {/* CA-3: Resumen */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Devolviendo {selectedCount} producto(s) de {items.length} totales
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* CA-4: Motivo de devolución */}
        <FormControl fullWidth error={Boolean(errors.reason)} sx={{ mb: 2 }}>
          <InputLabel>Motivo de la devolución</InputLabel>
          <Select
            value={reason}
            label="Motivo de la devolución"
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((prev) => ({ ...prev, reason: undefined }));
            }}
          >
            {RETURN_REASONS.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
          {errors.reason && <FormHelperText>{errors.reason}</FormHelperText>}
        </FormControl>

        {reason === 'Otro' && (
          <TextField
            label="Especifique el motivo"
            multiline
            rows={2}
            fullWidth
            value={reasonDetail}
            onChange={(e) => {
              setReasonDetail(e.target.value);
              setErrors((prev) => ({ ...prev, reasonDetail: undefined }));
            }}
            error={Boolean(errors.reasonDetail)}
            helperText={errors.reasonDetail || `${reasonDetail.length}/300 caracteres`}
            inputProps={{ maxLength: 300 }}
            sx={{ mb: 2 }}
          />
        )}

        <TextField
          label="Notas sobre la devolución (opcional)"
          multiline
          rows={2}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          helperText={`${notes.length}/500 caracteres`}
          inputProps={{ maxLength: 500 }}
          sx={{ mb: 2 }}
        />

        {/* CA-5: Monto a reembolsar */}
        <Alert severity="info" icon={false}>
          <Typography variant="body1" fontWeight="bold">
            Monto a reembolsar: {formatCurrency(returnTotal)}
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AssignmentReturnIcon />}
        >
          {loading ? 'Procesando...' : 'Confirmar Devolución'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateReturnModal;
