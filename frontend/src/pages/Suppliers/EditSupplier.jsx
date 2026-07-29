/**
 * EditSupplier Page
 * US-SUPP-004: Editar Proveedor
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
  Snackbar,
  Skeleton,
} from '@mui/material';
import {
  Home as HomeIcon,
  LocalShipping as SuppliersIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import SupplierForm from '../../components/forms/SupplierForm';
import supplierService from '../../services/supplierService';

const EditSupplier = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadSupplier = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierService.getSupplier(id);
      if (response.success) {
        setSupplier(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar proveedor');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar proveedor');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSupplier();
  }, [loadSupplier]);

  const handleSuccess = (updatedSupplier) => {
    setSnackbar({
      open: true,
      message: `Proveedor ${updatedSupplier.company_name} actualizado correctamente`,
      severity: 'success',
    });

    setTimeout(() => {
      navigate(`/suppliers/${id}`, {
        state: { message: 'Proveedor actualizado exitosamente' }
      });
    }, 1500);
  };

  const handleCancel = () => {
    navigate(`/suppliers/${id}`);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Link component="button" onClick={() => navigate('/suppliers')} underline="hover">
          Volver a lista de proveedores
        </Link>
      </Container>
    );
  }

  if (!supplier) {
    return (
      <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
        <Alert severity="warning">Proveedor no encontrado</Alert>
        <Link component="button" onClick={() => navigate('/suppliers')} underline="hover" sx={{ mt: 2 }}>
          Volver a lista de proveedores
        </Link>
      </Container>
    );
  }

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
          onClick={() => navigate('/suppliers')}
        >
          <SuppliersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Proveedores
        </Link>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate(`/suppliers/${id}`)}
        >
          {supplier.company_name}
        </Link>
        <Typography sx={{ display: 'flex', alignItems: 'center' }} color="text.primary">
          <EditIcon sx={{ mr: 0.5 }} fontSize="small" />
          Editar
        </Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Editar Proveedor: {supplier.company_name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Modifique los campos que desea actualizar. Los campos marcados con * son obligatorios.
        </Typography>
      </Box>

      {!supplier.is_active && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Este proveedor está marcado como inactivo. Los cambios se guardarán pero el proveedor permanecerá inactivo.
        </Alert>
      )}

      <SupplierForm
        mode="edit"
        initialData={supplier}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

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

export default EditSupplier;
