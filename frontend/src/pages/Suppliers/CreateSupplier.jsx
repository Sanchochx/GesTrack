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
  LocalShipping as SuppliersIcon,
  PersonAdd as AddIcon,
} from '@mui/icons-material';
import SupplierForm from '../../components/forms/SupplierForm';

/**
 * CreateSupplier Page
 * US-SUPP-001: Registrar Proveedor
 */
const CreateSupplier = () => {
  const navigate = useNavigate();

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdSupplier, setCreatedSupplier] = useState(null);

  const handleSuccess = (supplier) => {
    setCreatedSupplier(supplier);
    setShowSuccessDialog(true);
  };

  const handleCreateAnother = () => {
    setShowSuccessDialog(false);
    setCreatedSupplier(null);
    window.location.reload();
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

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
        <Typography sx={{ display: 'flex', alignItems: 'center' }} color="inherit">
          <SuppliersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Proveedores
        </Typography>
        <Typography sx={{ display: 'flex', alignItems: 'center' }} color="text.primary">
          <AddIcon sx={{ mr: 0.5 }} fontSize="small" />
          Registrar Proveedor
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Registrar Nuevo Proveedor
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Complete el formulario para registrar un nuevo proveedor en el sistema.
          Los campos marcados con * son obligatorios.
        </Typography>
      </Box>

      {/* Supplier Form */}
      <SupplierForm onSuccess={handleSuccess} onCancel={handleCancel} />

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onClose={handleGoToDashboard} maxWidth="sm" fullWidth>
        <DialogTitle>Proveedor Registrado Exitosamente</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            El proveedor <strong>{createdSupplier?.company_name}</strong> ha sido
            registrado correctamente en el sistema.
          </Alert>
          <Typography variant="body2" color="textSecondary">
            ¿Qué desea hacer a continuación?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1 }}>
          <Button fullWidth variant="contained" onClick={handleCreateAnother}>
            Registrar Otro Proveedor
          </Button>
          <Button fullWidth variant="text" onClick={handleGoToDashboard}>
            Ir al Inicio
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateSupplier;
