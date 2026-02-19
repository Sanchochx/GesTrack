import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingCart as OrdersIcon,
  AddShoppingCart as AddOrderIcon,
} from '@mui/icons-material';
import OrderForm from '../../components/forms/OrderForm';

/**
 * CreateOrder Page
 * US-ORD-001: Crear Pedido
 *
 * CA-8: Guardado y confirmación
 * CA-9: Manejo de errores
 */
const CreateOrder = () => {
  const navigate = useNavigate();

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * CA-8: Handle successful order creation
   */
  const handleSuccess = (order, message) => {
    setCreatedOrder(order);
    setSuccessMessage(message || `Pedido ${order.order_number} creado exitosamente`);
    setShowSuccessDialog(true);
  };

  /**
   * CA-8: Navigate to order details
   */
  const handleViewOrder = () => {
    // TODO: Navigate to order detail when implemented
    // For now, go to orders list placeholder
    navigate('/orders');
  };

  /**
   * CA-8: Create another order
   */
  const handleCreateAnother = () => {
    setShowSuccessDialog(false);
    setCreatedOrder(null);
    window.location.reload();
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigate('/dashboard');
  };

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
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate('/orders')}
        >
          <OrdersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Pedidos
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <AddOrderIcon sx={{ mr: 0.5 }} fontSize="small" />
          Nuevo Pedido
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Crear Nuevo Pedido
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Seleccione un cliente, agregue productos y configure los detalles del pedido.
        </Typography>
      </Box>

      {/* Order Form */}
      <OrderForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* CA-8: Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={handleCreateAnother}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Pedido Creado Exitosamente
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
          {createdOrder && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Pedido:</strong> {createdOrder.order_number}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Cliente:</strong> {createdOrder.customer?.nombre_razon_social}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Total:</strong> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(createdOrder.total || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Items:</strong> {createdOrder.items_count} producto{createdOrder.items_count !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="textSecondary">
            ¿Qué desea hacer a continuación?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleViewOrder}
            disabled={!createdOrder}
          >
            Ver Detalles del Pedido
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCreateAnother}
          >
            Crear Otro Pedido
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/dashboard')}
          >
            Ir al Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateOrder;
