/**
 * PaymentHistory – Historial de pagos de un pedido con resumen de saldo
 * US-ORD-004: CA-5 (historial), CA-3 (saldo pendiente)
 */
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (isoString) => {
  if (!isoString) return '-';
  // payment_date is a date string (YYYY-MM-DD), parse without timezone issues
  const [year, month, day] = isoString.split('T')[0].split('-');
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * @param {Array} payments - Lista de pagos
 * @param {number} amountPaid - Total pagado
 * @param {number} pendingBalance - Saldo pendiente
 * @param {number} total - Total del pedido
 */
const PaymentHistory = ({ payments = [], amountPaid = 0, pendingBalance = 0, total = 0 }) => {
  return (
    <Box>
      {/* Resumen de saldo (CA-3) */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
          <Typography variant="body2" color="text.secondary">Total del pedido</Typography>
          <Typography variant="body2" fontWeight="medium">{formatCurrency(total)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
          <Typography variant="body2" color="text.secondary">Total pagado</Typography>
          <Typography variant="body2" fontWeight="medium" color="success.main">
            {formatCurrency(amountPaid)}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
          <Typography variant="body2" fontWeight="bold">Saldo pendiente</Typography>
          <Typography
            variant="body2"
            fontWeight="bold"
            color={pendingBalance > 0 ? 'error.main' : 'success.main'}
          >
            {formatCurrency(pendingBalance)}
          </Typography>
        </Box>
      </Box>

      {/* Tabla de pagos (CA-5) */}
      {payments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Sin pagos registrados
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }} align="right">Monto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Método</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Notas</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Registrado por</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    {formatDate(payment.payment_date)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'medium', color: 'success.main' }}>
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    {payment.payment_method}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {payment.notes || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {payment.created_by_name || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PaymentHistory;
