import { Card, CardContent, Typography, Box, Avatar, Chip, Skeleton } from '@mui/material';
import { TrendingUp as UpIcon, TrendingDown as DownIcon, Remove as FlatIcon } from '@mui/icons-material';

/**
 * DS-001: Tarjeta KPI reutilizable del Sistema de Diseño Emerald Logic.
 * Usada en AdminDashboard, WarehouseDashboard y SalesDashboard.
 *
 * US-REP-001 CA-6: `trend` (opcional) muestra el % de cambio vs el período anterior.
 * Formato: { value: number, label?: string } — value positivo/negativo/0.
 */
const StatCard = ({ title, value, icon, color = 'primary', subtitle, trend, onClick, loading = false }) => {
  const trendPositive = trend && trend.value > 0;
  const trendNeutral = !trend || trend.value === 0;
  const trendIcon = trendNeutral ? <FlatIcon sx={{ fontSize: 14 }} /> :
    trendPositive ? <UpIcon sx={{ fontSize: 14 }} /> : <DownIcon sx={{ fontSize: 14 }} />;
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
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: `${color}.main`, lineHeight: 1.1 }}
                >
                  {value}
                </Typography>
                {trend && (
                  <Chip
                    icon={trendIcon}
                    label={`${trend.value >= 0 ? '+' : ''}${trend.value}%`}
                    size="small"
                    color={trendNeutral ? 'default' : trendPositive ? 'success' : 'error'}
                    sx={{ fontWeight: 700, fontSize: 11, height: 22 }}
                  />
                )}
              </Box>
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
