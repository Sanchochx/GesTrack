import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

/**
 * ProductList Page
 * Placeholder for US-PROD-002: List Products
 *
 * This page will be fully implemented in US-PROD-002
 * Currently provides navigation to create product page
 */
const ProductList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(null);

  // Show success message if coming from create/edit
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleCreateProduct = () => {
    navigate('/products/new');
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Productos
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Gestión del catálogo de productos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProduct}
        >
          Crear Producto
        </Button>
      </Box>

      {/* Placeholder Content */}
      <Alert severity="info">
        La lista de productos será implementada en US-PROD-002.
        Por ahora, puede crear nuevos productos usando el botón "Crear Producto".
      </Alert>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductList;
