import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Alert } from '@mui/material';
import authService from '../../services/authService';

/**
 * Dashboard para usuarios con rol Admin
 * US-AUTH-002 - CA-6: Redirección por rol
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'Admin') {
      // Redirigir si no tiene el rol correcto
      navigate('/dashboard');
      return;
    }

    setUser(currentUser);
  }, [navigate]);

  if (!user) return null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        {/* Mensaje de bienvenida (CA-3) */}
        <Alert severity="success" sx={{ mb: 3 }}>
          ¡Bienvenido/a, {user.full_name}!
        </Alert>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard de Administrador
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Acceso completo a todas las funcionalidades del sistema
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información del usuario:
            </Typography>
            <Typography variant="body2">
              <strong>Nombre:</strong> {user.full_name}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {user.email}
            </Typography>
            <Typography variant="body2">
              <strong>Rol:</strong> {user.role}
            </Typography>
          </Box>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Este dashboard será implementado en futuras historias de usuario.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
