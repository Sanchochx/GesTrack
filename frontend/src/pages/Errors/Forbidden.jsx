import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import HomeIcon from '@mui/icons-material/Home';

/**
 * Página de Error 403 - Acceso Denegado
 * US-AUTH-005 CA-6: Página de error cuando el usuario no tiene permisos
 */
function Forbidden() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    // Redirigir al dashboard según el rol del usuario
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            width: '100%'
          }}
        >
          {/* Icono de acceso denegado */}
          <BlockIcon
            sx={{
              fontSize: 100,
              color: 'error.main',
              mb: 2
            }}
          />

          {/* Código de error */}
          <Typography variant="h1" component="h1" gutterBottom>
            403
          </Typography>

          {/* Título del error */}
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ mb: 2 }}
          >
            Acceso Denegado
          </Typography>

          {/* Mensaje descriptivo (CA-6: mensaje claro) */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            No tienes permisos para acceder a esta página.
            <br />
            Por favor, contacta a tu administrador si crees que esto es un error.
          </Typography>

          {/* Botón para regresar al dashboard (CA-6) */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
          >
            Volver al Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

export default Forbidden;
