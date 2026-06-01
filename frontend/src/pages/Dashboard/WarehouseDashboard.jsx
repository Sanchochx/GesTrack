import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Grid, Divider } from '@mui/material';
import authService from '../../services/authService';
import DashboardHeader from '../../components/common/DashboardHeader';
import InventoryValueWidget from '../../components/inventory/InventoryValueWidget';
import CategoryValueBreakdown from '../../components/inventory/CategoryValueBreakdown';
import ValueEvolutionChart from '../../components/inventory/ValueEvolutionChart';
import ValueMetricsPanel from '../../components/inventory/ValueMetricsPanel';
import InventoryValueExportCard from '../../components/inventory/InventoryValueExportCard';
import OutOfStockAlertWidget from '../../components/inventory/OutOfStockAlertWidget';

/**
 * DS-004: Dashboard para Gerente de Almacén — Sistema de Diseño Emerald Logic.
 * Cabecera unificada con gradiente teal + widgets de inventario.
 */
const WarehouseDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) { navigate('/login'); return; }
    if (currentUser.role !== 'Gerente de Almacén') { navigate('/dashboard'); return; }
    setUser(currentUser);
  }, [navigate]);

  if (!user) return null;

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: { xs: 2, md: 3 }, mt: 4 }}>
        {/* DS-001: Cabecera personalizada Emerald Logic */}
        <DashboardHeader role={user.role} userName={user.full_name} />

        {/* Section: KPI Summary */}
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: 1.5, display: 'block', mb: 2 }}
        >
          Resumen del Inventario
        </Typography>

        <Grid container spacing={3}>
          {/* Alertas de Stock Crítico */}
          <Grid item xs={12} md={6} lg={4}>
            <OutOfStockAlertWidget maxItems={5} />
          </Grid>

          {/* Valor Total del Inventario */}
          <Grid item xs={12} md={6} lg={4}>
            <InventoryValueWidget period="7d" />
          </Grid>

          {/* Exportar Reporte de Valor */}
          <Grid item xs={12} md={6} lg={4}>
            <InventoryValueExportCard />
          </Grid>

          {/* Section: Análisis */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 600, letterSpacing: 1.5, display: 'block', mt: 2, mb: 2 }}
            >
              Análisis y Evolución
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <ValueEvolutionChart />
          </Grid>

          {/* Section: Distribución */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 600, letterSpacing: 1.5, display: 'block', mt: 2, mb: 2 }}
            >
              Distribución del Inventario
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <CategoryValueBreakdown />
          </Grid>

          <Grid item xs={12}>
            <ValueMetricsPanel />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default WarehouseDashboard;
