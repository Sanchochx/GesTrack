import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Home as HomeIcon,
  LocalShipping as PurchaseOrdersIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import PurchaseOrderForm from '../../components/forms/PurchaseOrderForm';
import purchaseOrderService from '../../services/purchaseOrderService';

/**
 * EditPurchaseOrder Page
 * US-SUPP-010: Editar Orden de Compra
 */
const EditPurchaseOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadOrder() {
      setLoading(true);
      setError(null);
      try {
        const result = await purchaseOrderService.getPurchaseOrder(id);
        if (cancelled) return;
        if (result.data.status !== 'Pendiente') {
          setError(`Esta orden no puede editarse porque está en estado "${result.data.status}"`);
        }
        setOrder(result.data);
      } catch (err) {
        if (!cancelled) setError(err?.error?.message || 'Error al cargar la orden de compra');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOrder();
    return () => { cancelled = true; };
  }, [id]);

  const handleSuccess = (updatedOrder, message) => {
    navigate(`/purchase-orders/${updatedOrder.id}`, {
      state: { message: message || `Orden ${updatedOrder.order_number} actualizada exitosamente` },
    });
  };

  const handleCancel = () => navigate(`/purchase-orders/${id}`);

  return (
    <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
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
          <EditIcon sx={{ mr: 0.5 }} fontSize="small" />
          Editar Orden
        </Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Editar Orden de Compra
        </Typography>
        {order && (
          <Typography variant="body2" color="textSecondary">
            {order.order_number}
          </Typography>
        )}
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {!loading && order && order.status === 'Pendiente' && (
        <PurchaseOrderForm mode="edit" initialOrder={order} onSuccess={handleSuccess} onCancel={handleCancel} />
      )}
    </Container>
  );
};

export default EditPurchaseOrder;
