import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import CustomerForm from '../forms/CustomerForm';

/**
 * CreateCustomerModal Component
 * US-CUST-010: Crear Cliente desde Pedido
 *
 * CA-2: Modal de registro rápido de cliente
 * CA-3: Formulario completo con campos requeridos y opcionales
 * CA-4: Validaciones en tiempo real (delegadas a CustomerForm)
 * CA-6: Cancelación con confirmación si hay datos (delegada a CustomerForm)
 * CA-9: Manejo de errores sin cerrar el modal (delegado a CustomerForm)
 *
 * Props:
 * - open: boolean - controla visibilidad del modal
 * - onClose(): callback para cerrar sin crear
 * - onCustomerCreated(customer): callback con el cliente creado
 */
const CreateCustomerModal = ({ open, onClose, onCustomerCreated }) => {
  const handleSuccess = (customer) => {
    onCustomerCreated(customer);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6">Crear nuevo cliente</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <CustomerForm
          onSuccess={handleSuccess}
          onCancel={onClose}
          mode="create"
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateCustomerModal;
