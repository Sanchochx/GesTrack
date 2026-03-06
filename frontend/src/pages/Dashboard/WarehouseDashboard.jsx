import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Grid, Paper, Avatar, Divider } from '@mui/material';
import { Warehouse as WarehouseIcon } from '@mui/icons-material';
import authService from '../../services/authService';
import InventoryValueWidget from '../../components/inventory/InventoryValueWidget';
import CategoryValueBreakdown from '../../components/inventory/CategoryValueBreakdown';
import ValueEvolutionChart from '../../components/inventory/ValueEvolutionChart';
import ValueMetricsPanel from '../../components/inventory/ValueMetricsPanel';
import InventoryValueExportCard from '../../components/inventory/InventoryValueExportCard';
import OutOfStockAlertWidget from '../../components/inventory/OutOfStockAlertWidget';

/**
 * Dashboard para usuarios con rol Gerente de Almacén
 * US-AUTH-002 - CA-6: Redirección por rol
 * US-INV-005 - CA-2: Visualización de valor del inventario
 */
const WarehouseDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'Gerente de Almacén') {
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
            background: 'linear-gradient(135deg, #00695c 0%, #00897b 60%, #4db6ac 100%)',
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
            <WarehouseIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Dashboard de Inventario
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              ¡Bienvenido/a, {user.full_name}! &nbsp;·&nbsp; Gestión de productos, categorías y órdenes de compra
            </Typography>
          </Box>
        </Paper>

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
            <InventoryValueWidget period="7d" />
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

export default WarehouseDashboard;
