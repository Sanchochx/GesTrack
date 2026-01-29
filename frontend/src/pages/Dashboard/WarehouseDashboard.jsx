import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Alert, Grid } from '@mui/material';
import authService from '../../services/authService';
import InventoryValueWidget from '../../components/inventory/InventoryValueWidget';
import CategoryValueBreakdown from '../../components/inventory/CategoryValueBreakdown';
import ValueEvolutionChart from '../../components/inventory/ValueEvolutionChart';
import ValueMetricsPanel from '../../components/inventory/ValueMetricsPanel';
import InventoryValueExportCard from '../../components/inventory/InventoryValueExportCard';

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
        {/* Mensaje de bienvenida (CA-3) */}
        <Alert severity="success" sx={{ mb: 3 }}>
          ¡Bienvenido/a, {user.full_name}!
        </Alert>

        <Typography variant="h4" gutterBottom>
          Dashboard de Inventario
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Gestión de productos, categorías, proveedores y órdenes de compra
        </Typography>

        {/* US-INV-005: Widgets de Valor del Inventario */}
        <Grid container spacing={3}>
          {/* Valor Total del Inventario */}
          <Grid item xs={12} md={6}>
            <InventoryValueWidget period="7d" />
          </Grid>

          {/* Exportar Reporte de Valor */}
          <Grid item xs={12} md={6}>
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

export default WarehouseDashboard;
