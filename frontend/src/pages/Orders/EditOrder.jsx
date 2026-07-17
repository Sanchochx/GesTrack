import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Alert,
  Button,
  Skeleton,
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingCart as OrdersIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import orderService from '../../services/orderService';
import OrderForm from '../../components/forms/OrderForm';

const NON_EDITABLE_STATUSES = ['Procesando', 'Enviado', 'Entregado', 'Cancelado'];

/**
 * EditOrder Page
 * US-ORD-008: Editar Pedido
 *
 * CA-1: Restricciones de edición por estado
 * CA-2: Modo de edición con formulario precargado
 */
const EditOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrderById(id);
      setOrder(response.data);
    } catch (err) {
      setError(err?.error?.message || 'Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleSuccess = (updatedOrder, message) => {
    navigate(`/orders/${updatedOrder.id}`, {
      state: { successMessage: message || `Pedido ${updatedOrder.order_number} actualizado exitosamente` },
    });
  };

  const handleCancel = () => {
    navigate(`/orders/${id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
        <Skeleton variant="text" width={300} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')}>
          Volver a Pedidos
        </Button>
      </Container>
    );
  }

  if (!order) return null;

  // CA-1: Solo pedidos Pendiente o Confirmado se pueden editar
  if (NON_EDITABLE_STATUSES.includes(order.status)) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Este pedido no puede editarse porque está en estado &quot;{order.status}&quot;.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/orders/${id}`)}>
          Volver al Pedido
        </Button>
      </Container>
    );
  }

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
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate(`/orders/${id}`)}
        >
          {order.order_number}
        </Link>
        <Typography sx={{ display: 'flex', alignItems: 'center' }} color="text.primary">
          <EditIcon sx={{ mr: 0.5 }} fontSize="small" />
          Editar
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Editar Pedido {order.order_number}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Modifique el cliente, los productos o los detalles del pedido y guarde los cambios.
        </Typography>
      </Box>

      {/* Order Form (edit mode) */}
      <OrderForm
        mode="edit"
        initialOrder={order}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Container>
  );
};

export default EditOrder;
