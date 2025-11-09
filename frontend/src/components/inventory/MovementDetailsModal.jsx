import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  Box,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Link,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as IncreaseIcon,
  TrendingDown as DecreaseIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link as RouterLink } from 'react-router-dom';
import MovementTypeChip from './MovementTypeChip';

/**
 * US-INV-003 CA-5: Movement Details Modal
 *
 * Modal que muestra información completa de un movimiento de inventario
 * - Toda la información del movimiento
 * - Link al producto
 * - Información del usuario
 * - Metadata adicional
 */

const MovementDetailsModal = ({ open, onClose, movement }) => {
  if (!movement) return null;

  // Formatear fecha completa
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE, dd 'de' MMMM 'de' yyyy 'a las' HH:mm:ss", { locale: es });
    } catch {
      return dateString;
    }
  };

  // Determinar si es aumento o disminución
  const isIncrease = movement.quantity > 0;
  const Icon = isIncrease ? IncreaseIcon : DecreaseIcon;
  const color = isIncrease ? 'success.main' : 'error.main';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Detalles del Movimiento
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Grid container spacing={3}>
          {/* Sección: Información del Movimiento */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Información del Movimiento
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                    Tipo de Movimiento
                  </TableCell>
                  <TableCell>
                    <MovementTypeChip
                      movementType={movement.movement_type}
                      size="medium"
                      showIcon={true}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Fecha y Hora
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(movement.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    ID del Movimiento
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                      {movement.id}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>

          {/* Sección: Producto */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Producto Afectado
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                    Nombre
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {movement.product_name}
                      </Typography>
                      <Link
                        component={RouterLink}
                        to={`/products/${movement.product_id}`}
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <OpenIcon fontSize="small" />
                      </Link>
                    </Box>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    SKU
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {movement.product_sku}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>

          {/* Sección: Cambio en Inventario */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Cambio en Inventario
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                    Cantidad
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Icon sx={{ color }} />
                      <Typography variant="h6" sx={{ color, fontWeight: 'bold' }}>
                        {isIncrease ? '+' : ''}{movement.quantity}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        unidades
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Stock Anterior
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {movement.previous_stock} unidades
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Stock Resultante
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {movement.new_stock} unidades
                      </Typography>
                      {movement.new_stock === 0 && (
                        <Chip label="SIN STOCK" size="small" color="error" />
                      )}
                      {movement.new_stock > 0 && movement.new_stock <= 10 && (
                        <Chip label="STOCK BAJO" size="small" color="warning" />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>

          {/* Sección: Usuario */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Usuario Responsable
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                    Nombre
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {movement.user_name}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>

          {/* Sección: Información Adicional */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Información Adicional
            </Typography>
            <Table size="small">
              <TableBody>
                {movement.reason && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                      Motivo
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {movement.reason}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {movement.reference && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Referencia
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {movement.reference}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {movement.notes && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Notas
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {movement.notes}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {!movement.reason && !movement.reference && !movement.notes && (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        No hay información adicional para este movimiento
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MovementDetailsModal;
