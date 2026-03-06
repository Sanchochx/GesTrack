import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Grid, Divider } from '@mui/material';
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
        {/* Section: KPI Summary */}
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1.5, display: 'block', mb: 2 }}>
          Resumen del Inventario
        </Typography>

        {/* US-INV-005, US-INV-007: Widgets de Valor del Inventario y Alertas */}
        <Grid container spacing={3}>
          {/* US-INV-007: Alertas de Stock Crítico */}
          <Grid item xs={12} md={6} lg={4}>
            <OutOfStockAlertWidget maxItems={5} />
          </Grid>

          {/* Valor Total del Inventario */}
          <Grid item xs={12} md={6} lg={4}>
            <InventoryValueWidget period="30d" />
          </Grid>

          {/* Exportar Reporte de Valor */}
          <Grid item xs={12} md={6} lg={4}>
            <InventoryValueExportCard />
          </Grid>

          {/* Section Divider: Charts */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1.5, display: 'block', mt: 2, mb: 2 }}>
              Análisis y Evolución
            </Typography>
          </Grid>

          {/* Gráfico de Evolución del Valor */}
          <Grid item xs={12}>
            <ValueEvolutionChart />
          </Grid>

          {/* Section Divider: Distribución */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1.5, display: 'block', mt: 2, mb: 2 }}>
              Distribución del Inventario
            </Typography>
          </Grid>

          {/* Desglose por Categoría */}
          <Grid item xs={12}>
            <CategoryValueBreakdown />
          </Grid>

          {/* Top Productos · Top Categorías · Distribución de Stock */}
          <Grid item xs={12}>
            <ValueMetricsPanel />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
