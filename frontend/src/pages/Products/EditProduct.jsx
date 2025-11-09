import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import ProductForm from '../../components/forms/ProductForm';
import productService from '../../services/productService';

/**
 * EditProduct - Página de edición de producto
 * US-PROD-005: Editar Producto
 *
 * Funcionalidades:
 * - Cargar datos actuales del producto (CA-1)
 * - Usar ProductForm en modo edición
 * - Navegar de regreso después de guardar (CA-9)
 * - Manejo de errores (CA-10)
 */
const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Cargar datos del producto
  useEffect(() => {
    loadProduct();
  }, [id]);

  /**
   * US-PROD-005 CA-1: Cargar datos actuales del producto
   */
  const loadProduct = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await productService.getProduct(id);
      if (response.success) {
        setProductData(response.data);
      } else {
        setError('No se pudo cargar el producto');
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError(err.error?.message || 'Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  /**
   * US-PROD-005 CA-9: Handle success after saving
   */
  const handleSuccess = (data, message) => {
    setSuccessMessage(message);
    setShowSnackbar(true);
    // Wait a moment before navigating to show the success message
    setTimeout(() => {
      navigate(`/products/${id}`);
    }, 1500);
  };

  /**
   * Handle cancel - go back to product details
   */
  const handleCancel = () => {
    navigate(`/products/${id}`);
  };

  /**
   * Handle back button click
   */
  const handleBack = () => {
    navigate(`/products/${id}`);
  };

  /**
   * Close snackbar
   */
  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando producto...
        </Typography>
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Volver
          </Button>
          <Button
            variant="contained"
            onClick={loadProduct}
          >
            Reintentar
          </Button>
        </Box>
      </Container>
    );
  }

  // Product not found
  if (!productData) {
    return (
      <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Producto no encontrado
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
        >
          Volver a Lista de Productos
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
      {/* Back button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Volver a Detalles
        </Button>
      </Box>

      {/* Product Form */}
      <ProductForm
        initialData={productData}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditProduct;
