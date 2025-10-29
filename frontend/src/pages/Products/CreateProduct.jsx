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
  Inventory as ProductsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import ProductForm from '../../components/forms/ProductForm';

/**
 * CreateProduct Page
 * US-PROD-001: Create Product
 *
 * Page wrapper for ProductForm with:
 * - Success confirmation dialog (CA-7)
 * - Option to create another product
 * - Navigation to product details or list
 */
const CreateProduct = () => {
  const navigate = useNavigate();

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);

  /**
   * Handle successful product creation
   * US-PROD-001 - CA-7: Success confirmation
   */
  const handleSuccess = (product) => {
    setCreatedProduct(product);
    setShowSuccessDialog(true);
  };

  /**
   * Navigate to product details
   */
  const handleViewProduct = () => {
    if (createdProduct) {
      navigate(`/products/${createdProduct.id}`);
    }
  };

  /**
   * Create another product (reload page)
   */
  const handleCreateAnother = () => {
    setShowSuccessDialog(false);
    setCreatedProduct(null);
    // Reload the page to reset form
    window.location.reload();
  };

  /**
   * Go to product list
   */
  const handleGoToList = () => {
    navigate('/products', {
      state: { message: 'Producto creado exitosamente' }
    });
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
          onClick={() => navigate('/products')}
        >
          <ProductsIcon sx={{ mr: 0.5 }} fontSize="small" />
          Productos
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <AddIcon sx={{ mr: 0.5 }} fontSize="small" />
          Crear Producto
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Crear Nuevo Producto
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Complete el formulario para registrar un nuevo producto en el sistema.
          Los campos marcados con * son obligatorios.
        </Typography>
      </Box>

      {/* Product Form */}
      <ProductForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* Success Dialog - CA-7 */}
      <Dialog
        open={showSuccessDialog}
        onClose={handleGoToList}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ✓ Producto Creado Exitosamente
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            El producto <strong>{createdProduct?.name}</strong> (SKU: {createdProduct?.sku})
            ha sido registrado correctamente en el sistema.
          </Alert>
          <Typography variant="body2" color="textSecondary">
            ¿Qué desea hacer a continuación?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleViewProduct}
            disabled={!createdProduct}
          >
            Ver Detalles del Producto
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCreateAnother}
          >
            Crear Otro Producto
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={handleGoToList}
          >
            Ir a Lista de Productos
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateProduct;
