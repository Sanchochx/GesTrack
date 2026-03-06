import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Avatar } from '@mui/material';
import { PointOfSale as SalesIcon } from '@mui/icons-material';
import authService from '../../services/authService';

/**
 * Dashboard para usuarios con rol Personal de Ventas
 * US-AUTH-002 - CA-6: Redirección por rol
 */
const SalesDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'Personal de Ventas') {
      // Redirigir si no tiene el rol correcto
      navigate('/dashboard');
      return;
    }

    setUser(currentUser);
  }, [navigate]);

  if (!user) return null;

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: 3, mt: 4 }}>
        {/* Welcome Header */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 60%, #ce93d8 100%)',
            borderRadius: 3,
            p: { xs: 2.5, md: 3 },
            mb: 4,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Avatar sx={{ width: 52, height: 52, bgcolor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.35)' }}>
            <SalesIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Dashboard de Ventas
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              ¡Bienvenido/a, {user.full_name}! &nbsp;·&nbsp; Gestión de clientes, pedidos y reportes de ventas
            </Typography>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Información del usuario
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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

          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Este dashboard será implementado en futuras historias de usuario.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SalesDashboard;
