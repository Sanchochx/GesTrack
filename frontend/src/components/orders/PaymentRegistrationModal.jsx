/**
 * PaymentRegistrationModal – Modal para registrar un pago de pedido
 * US-ORD-004: CA-2 (formulario), CA-7 (validaciones), CA-10 (feedback)
 */
import { useState } from 'react';
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
  InputAdornment,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';

const PAYMENT_METHODS = [
  'Efectivo',
  'Tarjeta Débito',
  'Tarjeta Crédito',
  'Transferencia',
  'Otro',
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const today = () => new Date().toISOString().split('T')[0];

/**
 * @param {number} pendingBalance - Saldo pendiente del pedido
 * @param {function} onConfirm - Callback(paymentData) → Promise
 * @param {function} onClose - Callback al cerrar
 * @param {boolean} loading - Estado de carga
 */
const PaymentRegistrationModal = ({ pendingBalance = 0, onConfirm, onClose, loading = false }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  // CA-7: Validar campos antes de enviar
  const validate = () => {
    const newErrors = {};
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'El monto debe ser mayor a $0';
    } else if (amountNum > pendingBalance + 0.005) {
      newErrors.amount = `El monto excede el saldo pendiente de ${formatCurrency(pendingBalance)}`;
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Seleccione un método de pago';
    }

    if (!paymentDate) {
      newErrors.paymentDate = 'Seleccione una fecha';
    }

    if (notes.length > 200) {
      newErrors.notes = 'Las notas no pueden superar 200 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm({
      amount: parseFloat(parseFloat(amount).toFixed(2)),
      payment_method: paymentMethod,
      payment_date: paymentDate,
      notes: notes.trim() || null,
    });
  };

  // CA-7: Prellenar con saldo completo
  const handleFillBalance = () => {
    setAmount(pendingBalance.toFixed(2));
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon />
        Registrar Pago
      </DialogTitle>

      <DialogContent dividers>
        {/* Saldo pendiente */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1.5,
            mb: 2,
            bgcolor: pendingBalance > 0 ? 'error.50' : 'success.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: pendingBalance > 0 ? 'error.200' : 'success.200',
          }}
        >
          <Typography variant="body2" color="text.secondary">Saldo pendiente</Typography>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color={pendingBalance > 0 ? 'error.main' : 'success.main'}
          >
            {formatCurrency(pendingBalance)}
          </Typography>
        </Box>

        {/* Monto (CA-2) */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Monto del pago"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setErrors((prev) => ({ ...prev, amount: undefined }));
            }}
            error={Boolean(errors.amount)}
            helperText={errors.amount}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: 0.01, step: 0.01 },
            }}
          />
          {/* CA-7: Opción "Pagar saldo completo" */}
          <Button
            variant="outlined"
            size="small"
            onClick={handleFillBalance}
            sx={{ mt: 1, whiteSpace: 'nowrap', minWidth: 'auto', flexShrink: 0 }}
          >
            Saldo completo
          </Button>
        </Box>

        {/* Método de pago (CA-2) */}
        <FormControl fullWidth error={Boolean(errors.paymentMethod)} sx={{ mb: 2 }}>
          <InputLabel>Método de pago</InputLabel>
          <Select
            value={paymentMethod}
            label="Método de pago"
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
            }}
          >
            {PAYMENT_METHODS.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
          {errors.paymentMethod && (
            <FormHelperText>{errors.paymentMethod}</FormHelperText>
          )}
        </FormControl>

        {/* Fecha del pago (CA-2) */}
        <TextField
          label="Fecha del pago"
          type="date"
          value={paymentDate}
          onChange={(e) => {
            setPaymentDate(e.target.value);
            setErrors((prev) => ({ ...prev, paymentDate: undefined }));
          }}
          error={Boolean(errors.paymentDate)}
          helperText={errors.paymentDate}
          fullWidth
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
        />

        {/* Notas (CA-2) */}
        <TextField
          label="Notas / Referencia (opcional)"
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={Boolean(errors.notes)}
          helperText={errors.notes || `${notes.length}/200 caracteres`}
          fullWidth
          inputProps={{ maxLength: 200 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Registrando...' : 'Registrar Pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentRegistrationModal;
