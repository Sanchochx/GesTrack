import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Alert, Grid } from '@mui/material';
import authService from '../../services/authService';
import InventoryValueWidget from '../../components/inventory/InventoryValueWidget';
import CategoryValueBreakdown from '../../components/inventory/CategoryValueBreakdown';
import ValueEvolutionChart from '../../components/inventory/ValueEvolutionChart';
import ValueMetricsPanel from '../../components/inventory/ValueMetricsPanel';
import InventoryValueExportCard from '../../components/inventory/InventoryValueExportCard';
import OutOfStockAlertWidget from '../../components/inventory/OutOfStockAlertWidget';

/**
 * Dashboard para usuarios con rol Admin
 * US-AUTH-002 - CA-6: Redirección por rol
 * US-INV-005 - CA-2: Visualización de valor del inventario
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
    <Container maxWidth="xl">
      <Box sx={{ p: 3, mt: 4 }}>
        {/* Mensaje de bienvenida (CA-3) */}
        <Alert severity="success" sx={{ mb: 3 }}>
          ¡Bienvenido/a, {user.full_name}!
        </Alert>

        <Typography variant="h4" gutterBottom>
          Dashboard de Administrador
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Acceso completo a todas las funcionalidades del sistema
        </Typography>

        {/* US-INV-005, US-INV-007: Widgets de Valor del Inventario y Alertas */}
        <Grid container spacing={3}>
          {/* US-INV-007: Alertas de Stock Crítico */}
          <Grid item xs={12} md={4}>
            <OutOfStockAlertWidget maxItems={5} />
          </Grid>

          {/* Valor Total del Inventario */}
          <Grid item xs={12} md={4}>
            <InventoryValueWidget period="30d" />
          </Grid>

          {/* Exportar Reporte de Valor */}
          <Grid item xs={12} md={4}>
            <InventoryValueExportCard />
          </Grid>

          {/* Gráfico de Evolución del Valor */}
          <Grid item xs={12}>
            <ValueEvolutionChart />
          </Grid>

          {/* Desglose por Categoría */}
          <Grid item xs={12} lg={6}>
            <CategoryValueBreakdown />
          </Grid>

          {/* Métricas Adicionales */}
          <Grid item xs={12} lg={6}>
            <ValueMetricsPanel />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
