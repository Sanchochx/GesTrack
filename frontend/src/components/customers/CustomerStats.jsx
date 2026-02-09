import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Star as VipIcon,
} from '@mui/icons-material';

/**
 * CustomerStats Component
 * US-CUST-002 CA-7: Customer statistics cards
 */
const CustomerStats = ({ statistics = {} }) => {
  const {
    total = 0,
    active = 0,
    inactive = 0,
    vip = 0,
  } = statistics;

  const stats = [
    {
      title: 'Total Clientes',
      value: total,
      icon: PeopleIcon,
      color: '#1565c0',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Activos',
      value: active,
      icon: ActiveIcon,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      title: 'Inactivos',
      value: inactive,
      icon: InactiveIcon,
      color: '#757575',
      bgColor: '#f5f5f5',
    },
    {
      title: 'VIP',
      value: vip,
      icon: VipIcon,
      color: '#f9a825',
      bgColor: '#fff8e1',
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

export default CustomerStats;
