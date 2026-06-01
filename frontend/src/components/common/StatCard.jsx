import { Card, CardContent, Typography, Box, Avatar, Skeleton } from '@mui/material';

/**
 * DS-001: Tarjeta KPI reutilizable del Sistema de Diseño Emerald Logic.
 * Usada en AdminDashboard, WarehouseDashboard y SalesDashboard.
 */
const StatCard = ({ title, value, icon, color = 'primary', subtitle, onClick, loading = false }) => {
  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': onClick
          ? { transform: 'translateY(-2px)', boxShadow: 4 }
          : {},
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, display: 'block' }}
            >
              {title}
            </Typography>

            {loading ? (
              <Skeleton width={80} height={44} sx={{ mt: 0.5 }} />
            ) : (
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: `${color}.main`, mt: 0.5, lineHeight: 1.1 }}
              >
                {value}
              </Typography>
            )}

            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          <Avatar
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.dark`,
              width: 48,
              height: 48,
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
