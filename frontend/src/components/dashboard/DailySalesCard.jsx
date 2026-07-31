import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, ToggleButtonGroup, ToggleButton, Skeleton, IconButton, Tooltip } from '@mui/material';
import { TrendingUp as UpIcon, TrendingDown as DownIcon, Remove as FlatIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import orderService from '../../services/orderService';
import usePolling from '../../hooks/usePolling';
import { getPeriodRange, calculateChangePercentage, PERIOD_OPTIONS } from '../../utils/dashboardPeriods';

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v ?? 0);

/**
 * US-REP-001 CA-2/5/6: Tarjeta de ventas del período (hoy/semana/mes) con
 * tendencia vs período anterior — Sistema de Diseño Emerald Logic.
 */
const DailySalesCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [salesAmount, setSalesAmount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [changePct, setChangePct] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { current, previous } = getPeriodRange(period);
      const [currentRes, previousRes] = await Promise.all([
        orderService.getOrders({ date_from: current.from, date_to: current.to, per_page: 1 }),
        orderService.getOrders({ date_from: previous.from, date_to: previous.to, per_page: 1 }),
      ]);
      const currentTotal = currentRes.metrics?.total_amount ?? 0;
      const previousTotal = previousRes.metrics?.total_amount ?? 0;
      setSalesAmount(currentTotal);
      setOrdersCount(currentRes.pagination?.total ?? 0);
      setChangePct(calculateChangePercentage(currentTotal, previousTotal));
    } catch {
      // silent — no bloquear el dashboard por un error de una tarjeta
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, 60000);

  const trendPositive = changePct > 0;
  const trendNeutral = changePct === null || changePct === 0;
  const trendIcon = trendNeutral ? <FlatIcon sx={{ fontSize: 14 }} /> :
    trendPositive ? <UpIcon sx={{ fontSize: 14 }} /> : <DownIcon sx={{ fontSize: 14 }} />;

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #bccac0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 240,
        height: '100%',
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography
            sx={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3d4a42', fontFamily: 'Inter', mb: 1 }}
          >
            Ventas del Período
          </Typography>
          <Tooltip title="Actualizar">
            <IconButton size="small" onClick={fetchData} disabled={loading} sx={{ color: '#6d7a72', mt: -0.5 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
          {loading ? (
            <Skeleton width={180} height={44} />
          ) : (
            <Typography sx={{ fontSize: 32, fontWeight: 900, color: '#006948', fontFamily: 'Inter', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {formatCOP(salesAmount)}
            </Typography>
          )}
          {!loading && changePct !== null && (
            <Chip
              icon={trendIcon}
              label={`${changePct >= 0 ? '+' : ''}${changePct}%`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: 12,
                borderRadius: '9999px',
                bgcolor: trendPositive ? '#68dba9' : trendNeutral ? '#eff4ff' : '#ffdad6',
                color: trendPositive ? '#005137' : trendNeutral ? '#3d4a42' : '#93000a',
                height: 24,
              }}
            />
          )}
        </Box>

        <Box sx={{ mt: 1.5 }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, v) => v && setPeriod(v)}
            size="small"
            sx={{
              bgcolor: '#eff4ff',
              borderRadius: '8px',
              p: 0.25,
              gap: 0.25,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '6px !important',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'Inter',
                px: 1.5,
                py: 0.25,
                color: '#3d4a42',
                '&.Mui-selected': { bgcolor: '#ffffff', color: '#006948', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
              },
            }}
          >
            {PERIOD_OPTIONS.map((p) => (
              <ToggleButton key={p.value} value={p.value}>{p.label}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box
        onClick={() => navigate('/orders')}
        sx={{ bgcolor: '#eff4ff', p: 2, borderRadius: '8px', mt: 3, cursor: 'pointer' }}
      >
        <Typography sx={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3d4a42', fontFamily: 'Inter' }}>
          Pedidos en el Período
        </Typography>
        {loading ? (
          <Skeleton width={40} height={28} />
        ) : (
          <Typography sx={{ fontSize: 20, fontWeight: 700, fontFamily: 'Inter', color: '#0b1c30' }}>
            {ordersCount}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default DailySalesCard;
