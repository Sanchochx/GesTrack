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
  People as CustomersIcon,
  PersonAdd as AddIcon,
} from '@mui/icons-material';
import CustomerForm from '../../components/forms/CustomerForm';

/**
 * CreateCustomer Page
 * US-CUST-001: Registrar Nuevo Cliente
 *
 * CA-1: Formulario accesible desde "+ Nuevo Cliente"
 * CA-9: Confirmación y opciones post-creación
 */
const CreateCustomer = () => {
  const navigate = useNavigate();

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState(null);

  /**
   * CA-9: Handle successful customer creation
   */
  const handleSuccess = (customer) => {
    setCreatedCustomer(customer);
    setShowSuccessDialog(true);
  };

  /**
   * Navigate to customer profile
   */
  const handleViewCustomer = () => {
    if (createdCustomer) {
      navigate(`/customers/${createdCustomer.id}`);
    }
  };

  /**
   * CA-9: Register another customer
   */
  const handleCreateAnother = () => {
    setShowSuccessDialog(false);
    setCreatedCustomer(null);
    window.location.reload();
  };

  /**
   * Go to customer list
   */
  const handleGoToList = () => {
    navigate('/customers', {
      state: { message: 'Cliente registrado exitosamente' }
    });
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigate('/customers');
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
          onClick={() => navigate('/customers')}
        >
          <CustomersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Clientes
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <AddIcon sx={{ mr: 0.5 }} fontSize="small" />
          Registrar Cliente
        </Typography>
      </Breadcrumbs>

      {/* CA-1: Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Registrar Nuevo Cliente
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Complete el formulario para registrar un nuevo cliente en el sistema.
          Los campos marcados con * son obligatorios.
        </Typography>
      </Box>

      {/* Customer Form */}
      <CustomerForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* CA-9: Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={handleGoToList}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Cliente Registrado Exitosamente
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            El cliente <strong>{createdCustomer?.full_name}</strong> ha sido
            registrado correctamente en el sistema.
          </Alert>
          <Typography variant="body2" color="textSecondary">
            ¿Qué desea hacer a continuación?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleViewCustomer}
            disabled={!createdCustomer}
          >
            Ver Perfil del Cliente
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCreateAnother}
          >
            Registrar Otro Cliente
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={handleGoToList}
          >
            Ir a Lista de Clientes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateCustomer;
