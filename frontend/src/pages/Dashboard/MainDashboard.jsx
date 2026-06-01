import { Box, Grid } from '@mui/material';
import OutOfStockCard from '../../components/dashboard/OutOfStockCard';
import InventoryValueCard from '../../components/dashboard/InventoryValueCard';
import ExportReportCard from '../../components/dashboard/ExportReportCard';
import InventoryEvolutionChart from '../../components/dashboard/InventoryEvolutionChart';
import CategoryDistributionChart from '../../components/dashboard/CategoryDistributionChart';
import TopProductsTable from '../../components/dashboard/TopProductsTable';
import TopCategoriesPanel from '../../components/dashboard/TopCategoriesPanel';
import StockDistributionPanel from '../../components/dashboard/StockDistributionPanel';

/**
 * US-DASH-003/004/005: Dashboard principal — Sistema de Diseño Emerald Logic.
 * Utilizado por Admin y Gerente de Almacén.
 * Layout idéntico al prototipo nuevo_index/code.html (3 secciones).
 */
const MainDashboard = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: 4 }}>

      {/* Section 1: Summary Cards — 3 columns */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <OutOfStockCard />
        </Grid>
        <Grid item xs={12} md={4}>
          <InventoryValueCard />
        </Grid>
        <Grid item xs={12} md={4}>
          <ExportReportCard />
        </Grid>
      </Grid>

      {/* Section 2: Analytics — 8+4 columns */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <InventoryEvolutionChart />
        </Grid>
        <Grid item xs={12} lg={4}>
          <CategoryDistributionChart />
        </Grid>
      </Grid>

      {/* Section 3: Rankings & Stock Breakdown — 6+3+3 columns */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <TopProductsTable />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <TopCategoriesPanel />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StockDistributionPanel />
        </Grid>
      </Grid>

    </Box>
  );
};

export default MainDashboard;
