import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Alert,
} from '@mui/material';
import {
  Home as HomeIcon,
  People as CustomersIcon,
  PersonAdd as AddIcon,
} from '@mui/icons-material';

/**
 * CustomerList Page (Placeholder)
 * US-CUST-001: Navigation target for customer list
 * Full implementation in US-CUST-002
 */
const CustomerList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

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
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <CustomersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Clientes
        </Typography>
      </Breadcrumbs>

      {/* Success message from creation */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => {}}>
          {successMessage}
        </Alert>
      )}

      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/customers/new')}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {/* Placeholder content */}
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <CustomersIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          Lista de Clientes
        </Typography>
        <Typography variant="body2">
          La lista completa de clientes se implementará en US-CUST-002.
          Por ahora, puede registrar nuevos clientes usando el botón superior.
        </Typography>
      </Box>
    </Container>
  );
};

export default CustomerList;
