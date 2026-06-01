import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Chip, ToggleButtonGroup, ToggleButton, Skeleton } from '@mui/material';
import { TrendingUp as UpIcon, TrendingDown as DownIcon, Remove as FlatIcon } from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

const PERIODS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '1y', label: '1A' },
];

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v ?? 0);

/**
 * US-DASH-003 CA-5/6/7/8: Tarjeta de valor total del inventario con trend.
 */
const InventoryValueCard = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [valueData, setValueData] = useState(null);
  const [changeData, setChangeData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [totalRes, changeRes] = await Promise.all([
        inventoryService.getTotalInventoryValue(),
        inventoryService.getValueChange(period),
      ]);
      setValueData(totalRes.data);
      setChangeData(changeRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const trendPositive = changeData?.direction === 'increase';
  const trendNeutral = !changeData || changeData.direction === 'stable';
  const trendIcon = trendNeutral ? <FlatIcon sx={{ fontSize: 14 }} /> :
    trendPositive ? <UpIcon sx={{ fontSize: 14 }} /> : <DownIcon sx={{ fontSize: 14 }} />;

  const trendPct = changeData?.change_percentage != null
    ? `${changeData.change_percentage >= 0 ? '+' : ''}${changeData.change_percentage}%`
    : null;

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
      {/* Top section */}
      <Box>
        <Typography
          sx={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3d4a42', fontFamily: 'Inter', mb: 1 }}
        >
          Valor Total de Inventario
        </Typography>

        {/* Value + trend */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
          {loading ? (
            <Skeleton width={200} height={44} />
          ) : (
            <Typography
              sx={{ fontSize: 32, fontWeight: 900, color: '#006948', fontFamily: 'Inter', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCOP(valueData?.total_value)}
            </Typography>
          )}
          {!loading && trendPct && (
            <Chip
              icon={trendIcon}
              label={trendPct}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: 12,
                borderRadius: '9999px',
                bgcolor: trendPositive ? '#68dba9' : '#ffdad6',
                color: trendPositive ? '#005137' : '#93000a',
                height: 24,
              }}
            />
          )}
        </Box>

        {/* Period selector for trend */}
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
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
            {PERIODS.map((p) => (
              <ToggleButton key={p.value} value={p.value}>{p.label}</ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Typography sx={{ fontSize: 12, color: '#3d4a42', opacity: 0.6, fontFamily: 'Inter' }}>
            Actualizado ahora
          </Typography>
        </Box>
      </Box>

      {/* Sub-metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 3 }}>
        <Box sx={{ bgcolor: '#eff4ff', p: 2, borderRadius: '8px' }}>
          <Typography sx={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3d4a42', fontFamily: 'Inter' }}>
            Productos
          </Typography>
          {loading ? (
            <Skeleton width={40} height={28} />
          ) : (
            <Typography sx={{ fontSize: 20, fontWeight: 700, fontFamily: 'Inter', color: '#0b1c30' }}>
              {valueData?.total_products ?? 0}
            </Typography>
          )}
        </Box>
        <Box sx={{ bgcolor: '#eff4ff', p: 2, borderRadius: '8px' }}>
          <Typography sx={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3d4a42', fontFamily: 'Inter' }}>
            Unidades
          </Typography>
          {loading ? (
            <Skeleton width={60} height={28} />
          ) : (
            <Typography sx={{ fontSize: 20, fontWeight: 700, fontFamily: 'Inter', color: '#0b1c30', fontVariantNumeric: 'tabular-nums' }}>
              {(valueData?.total_quantity ?? 0).toLocaleString('es-CO')}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default InventoryValueCard;
