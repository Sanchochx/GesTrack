/**
 * EditCustomer Page
 * US-CUST-005: Editar Información del Cliente
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  Snackbar,
  Skeleton,
} from '@mui/material';
import {
  Home as HomeIcon,
  People as CustomersIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import CustomerForm from '../../components/forms/CustomerForm';
import customerService from '../../services/customerService';

/**
 * EditCustomer - Página de edición de cliente
 * CA-1: Acceso desde perfil del cliente
 * CA-2: Formulario pre-llenado con datos actuales
 */
const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  /**
   * Cargar datos del cliente
   */
  const loadCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerService.getCustomer(id);
      if (response.success) {
        setCustomer(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar cliente');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar cliente');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  /**
   * CA-8: Handle successful update
   */
  const handleSuccess = (updatedCustomer) => {
    setSnackbar({
      open: true,
      message: `Cliente ${updatedCustomer.nombre_razon_social} actualizado correctamente`,
      severity: 'success',
    });

    // Navigate back to customer profile after a short delay
    setTimeout(() => {
      navigate(`/customers/${id}`, {
        state: { message: 'Cliente actualizado exitosamente' }
      });
    }, 1500);
  };

  /**
   * CA-9: Handle cancel
   */
  const handleCancel = () => {
    navigate(`/customers/${id}`);
  };

  /**
   * Close snackbar
   */
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={300} height={32} />
        </Box>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={400} height={48} />
          <Skeleton variant="text" width={500} height={24} />
        </Box>
        <Skeleton variant="rectangular" height={400} />
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Link
          component="button"
          onClick={() => navigate('/customers')}
          underline="hover"
        >
          Volver a lista de clientes
        </Link>
      </Container>
    );
  }

  // Customer not found
  if (!customer) {
    return (
      <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
        <Alert severity="warning">Cliente no encontrado</Alert>
        <Link
          component="button"
          onClick={() => navigate('/customers')}
          underline="hover"
          sx={{ mt: 2 }}
        >
          Volver a lista de clientes
        </Link>
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
          onClick={() => navigate('/customers')}
        >
          <CustomersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Clientes
        </Link>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate(`/customers/${id}`)}
        >
          {customer.nombre_razon_social}
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <EditIcon sx={{ mr: 0.5 }} fontSize="small" />
          Editar
        </Typography>
      </Breadcrumbs>

      {/* CA-2: Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Editar Cliente: {customer.nombre_razon_social}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Modifique los campos que desea actualizar. Los campos marcados con * son obligatorios.
        </Typography>
      </Box>

      {/* Customer not active warning */}
      {!customer.is_active && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Este cliente está marcado como inactivo. Los cambios se guardarán pero el cliente permanecerá inactivo.
        </Alert>
      )}

      {/* CA-2, CA-3: Customer Form in edit mode with pre-filled data */}
      <CustomerForm
        mode="edit"
        initialData={customer}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditCustomer;
