import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

/**
 * ProductStats Component
 * US-PROD-002: List Products
 *
 * Displays product statistics:
 * - CA-6: Total products counter
 * - CA-6: Products with normal stock
 * - CA-6: Products with low stock
 * - CA-6: Products out of stock
 */
const ProductStats = ({ statistics = {} }) => {
  const {
    total = 0,
    normal_stock = 0,
    low_stock = 0,
    out_of_stock = 0,
  } = statistics;

  const stats = [
    {
      title: 'Total de Productos',
      value: total,
      icon: InventoryIcon,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      title: 'Stock Normal',
      value: normal_stock,
      icon: CheckCircleIcon,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      title: 'Stock Bajo',
      value: low_stock,
      icon: WarningIcon,
      color: '#ed6c02',
      bgColor: '#fff3e0',
    },
    {
      title: 'Sin Stock',
      value: out_of_stock,
      icon: ErrorIcon,
      color: '#d32f2f',
      bgColor: '#ffebee',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      backgroundColor: stat.bgColor,
                    }}
                  >
                    <Icon sx={{ fontSize: 32, color: stat.color }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ProductStats;
