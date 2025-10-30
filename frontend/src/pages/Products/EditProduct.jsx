import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material';

/**
 * EditProduct - Página de edición de producto (Placeholder)
 * Muestra mensaje que la funcionalidad está en desarrollo
 * La implementación completa será parte de US-PROD-005
 */
const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/products/${id}`);
  };

  const handleBackToList = () => {
    navigate('/products');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ConstructionIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />

        <Typography variant="h4" gutterBottom>
          Funcionalidad en Desarrollo
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          La edición de productos está planificada para implementarse en la historia de usuario{' '}
          <strong>US-PROD-005: Editar Producto</strong>.
        </Typography>

        <Alert severity="info" sx={{ mt: 3, mb: 3, textAlign: 'left' }}>
          <Typography variant="subtitle2" gutterBottom>
            Funcionalidades planificadas:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Cargar datos actuales del producto</li>
            <li>Editar nombre, descripción y SKU</li>
            <li>Modificar precios (costo y venta)</li>
            <li>Cambiar categoría</li>
            <li>Actualizar niveles de stock</li>
            <li>Cambiar o eliminar imagen del producto</li>
            <li>Validaciones en tiempo real</li>
          </ul>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Ver Detalles del Producto
          </Button>
          <Button
            variant="contained"
            onClick={handleBackToList}
          >
            Volver a Lista de Productos
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditProduct;
