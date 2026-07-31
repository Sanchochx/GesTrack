import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  LocalShipping as PurchaseOrdersIcon,
  AddShoppingCart as AddOrderIcon,
} from '@mui/icons-material';
import PurchaseOrderForm from '../../components/forms/PurchaseOrderForm';

/**
 * CreatePurchaseOrder Page
 * US-SUPP-005: Crear Orden de Compra
 */
const CreatePurchaseOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // US-SUPP-015 CA-5: Prefill de proveedor/productos desde sugerencias de reabastecimiento
  const prefill = location.state?.prefill || null;

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSuccess = (purchaseOrder, message) => {
    setCreatedOrder(purchaseOrder);
    setSuccessMessage(message || `Orden de compra ${purchaseOrder.order_number} creada exitosamente`);
    setShowSuccessDialog(true);
  };

  const handleCreateAnother = () => {
    setShowSuccessDialog(false);
    setCreatedOrder(null);
    window.location.reload();
  };

  const handleGoToList = () => {
    navigate('/purchase-orders');
  };

  const handleCancel = () => {
    navigate('/purchase-orders');
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
          onClick={() => navigate('/purchase-orders')}
        >
          <PurchaseOrdersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Órdenes de Compra
        </Link>
        <Typography sx={{ display: 'flex', alignItems: 'center' }} color="text.primary">
          <AddOrderIcon sx={{ mr: 0.5 }} fontSize="small" />
          Nueva Orden de Compra
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Crear Orden de Compra
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Seleccione un proveedor, agregue productos y configure los detalles de la orden.
        </Typography>
      </Box>

      {prefill && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Orden prellenada desde las sugerencias de reabastecimiento. Verifique cantidades y precios antes de guardar.
        </Alert>
      )}

      {/* Purchase Order Form */}
      <PurchaseOrderForm onSuccess={handleSuccess} onCancel={handleCancel} prefill={prefill} />

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={handleCreateAnother} maxWidth="sm" fullWidth>
        <DialogTitle>Orden de Compra Creada Exitosamente</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
          {createdOrder && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Orden:</strong> {createdOrder.order_number}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Proveedor:</strong> {createdOrder.supplier?.company_name}
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
          <Button fullWidth variant="contained" onClick={handleCreateAnother}>
            Crear Otra Orden de Compra
          </Button>
          <Button fullWidth variant="text" onClick={handleGoToList}>
            Ver Órdenes de Compra
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreatePurchaseOrder;
