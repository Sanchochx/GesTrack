/**
 * PrintableOrder – Formato imprimible del pedido
 * US-ORD-012: CA-2 a CA-6
 *
 * Solo visible durante la impresión (ver reglas @media print en index.css).
 */
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider } from '@mui/material';
import { COMPANY_INFO } from '../../utils/companyConfig';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const PrintableOrder = ({ order }) => {
  if (!order) return null;

  const subtotalAfterDiscount = (order.subtotal || 0) - (order.discount_amount || 0);

  return (
    <Box className="printable-order-root" sx={{ p: 4, color: '#000', bgcolor: '#fff' }}>
      {/* CA-2: Cabecera */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">{COMPANY_INFO.name}</Typography>
          <Typography variant="body2">{COMPANY_INFO.address}</Typography>
          <Typography variant="body2">{COMPANY_INFO.phone} · {COMPANY_INFO.email}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" fontWeight="bold">PEDIDO</Typography>
          <Typography variant="body1" fontWeight="bold">{order.order_number}</Typography>
          <Typography variant="body2">Fecha: {formatDate(order.created_at)}</Typography>
          <Typography variant="body2">Estado: {order.status}</Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: '#000', mb: 2 }} />

      {/* CA-3: Información del cliente */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Entregar a</Typography>
        <Typography variant="body2">{order.customer?.nombre_razon_social || '-'}</Typography>
        <Typography variant="body2">
          {[order.customer?.direccion, order.customer?.municipio_ciudad, order.customer?.departamento]
            .filter(Boolean)
            .join(', ') || '-'}
        </Typography>
        <Typography variant="body2">Teléfono: {order.customer?.telefono_movil || '-'}</Typography>
        <Typography variant="body2">Email: {order.customer?.correo || '-'}</Typography>
      </Box>

      {/* CA-4: Tabla de productos */}
      <Table size="small" sx={{ mb: 2, '& td, & th': { borderColor: '#000', border: '1px solid #000' } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">Cant.</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio Unit.</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(order.items || []).map((item) => (
            <TableRow key={item.id}>
              <TableCell align="right">{item.quantity}</TableCell>
              <TableCell>{item.product_name}</TableCell>
              <TableCell>{item.product_sku}</TableCell>
              <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
              <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* CA-5: Desglose de totales */}
      <Box sx={{ maxWidth: 320, ml: 'auto', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">Subtotal</Typography>
          <Typography variant="body2">{formatCurrency(order.subtotal)}</Typography>
        </Box>
        {order.discount_amount > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Descuento</Typography>
              <Typography variant="body2">-{formatCurrency(order.discount_amount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Subtotal neto</Typography>
              <Typography variant="body2">{formatCurrency(subtotalAfterDiscount)}</Typography>
            </Box>
          </>
        )}
        {order.tax_percentage > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">IVA ({order.tax_percentage}%)</Typography>
            <Typography variant="body2">{formatCurrency(order.tax_amount)}</Typography>
          </Box>
        )}
        {order.shipping_cost > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Envío</Typography>
            <Typography variant="body2">{formatCurrency(order.shipping_cost)}</Typography>
          </Box>
        )}
        <Divider sx={{ borderColor: '#000', my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body1" fontWeight="bold">TOTAL</Typography>
          <Typography variant="body1" fontWeight="bold">{formatCurrency(order.total)}</Typography>
        </Box>
      </Box>

      {/* US-ORD-014 CA-9: Motivo del descuento aplicado */}
      {order.discount_amount > 0 && order.discount_justification && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">Motivo del descuento</Typography>
          <Typography variant="body2">{order.discount_justification}</Typography>
        </Box>
      )}

      {/* CA-6: Información adicional */}
      {order.notes && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">Notas</Typography>
          <Typography variant="body2">{order.notes}</Typography>
        </Box>
      )}
      <Box sx={{ mb: 4 }}>
        <Typography variant="caption">{COMPANY_INFO.terms}</Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, gap: 4 }}>
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Divider sx={{ borderColor: '#000', mb: 0.5 }} />
          <Typography variant="body2">Firma del Vendedor</Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Divider sx={{ borderColor: '#000', mb: 0.5 }} />
          <Typography variant="body2">Firma del Cliente</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PrintableOrder;
