import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton, Skeleton } from '@mui/material';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import inventoryService from '../../services/inventoryService';

const PERIODS = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1A' },
];

const PERIOD_MAP = { '3m': '3m', '6m': '3m', '1y': '1y' };

const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: '#ffffff', border: '1px solid #bccac0', borderRadius: '8px', p: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#0b1c30', fontFamily: 'Inter' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, color: '#006948', fontWeight: 700, fontFamily: 'Inter', fontVariantNumeric: 'tabular-nums' }}>
        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(payload[0].value ?? 0)}
      </Typography>
    </Box>
  );
};

/**
 * US-DASH-004 CA-1/2/3/4/5: Gráfico de barras de evolución del valor del inventario.
 */
const InventoryEvolutionChart = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('1y');
  const [chartData, setChartData] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getValueEvolution(PERIOD_MAP[period] || period);
      const raw = res.data ?? [];
      const mapped = raw.map((item) => {
        const d = new Date(item.snapshot_date);
        return {
          month: MONTH_ABBR[d.getMonth()],
          value: item.total_value ?? 0,
        };
      });
      setChartData(mapped);
    } catch {
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #bccac0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        p: 3,
        height: 400,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 600, color: '#0b1c30', fontFamily: 'Inter' }}>
          Evolución del Valor del Inventario
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Legend */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#006948' }} />
              <Typography sx={{ fontSize: 12, fontFamily: 'Inter', color: '#0b1c30' }}>Activo</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#bccac0' }} />
              <Typography sx={{ fontSize: 12, fontFamily: 'Inter', color: '#0b1c30' }}>Histórico</Typography>
            </Box>
          </Box>
          {/* Period selector */}
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, v) => v && setPeriod(v)}
            size="small"
            sx={{
              bgcolor: '#eff4ff',
              borderRadius: '8px',
              p: 0.25,
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
        </Box>
      </Box>

      {/* Chart */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'flex-end', pb: 3 }}>
            {[40, 60, 45, 80, 70, 95, 85, 100].map((h, i) => (
              <Skeleton key={i} variant="rectangular" sx={{ flex: 1, height: `${h}%`, bgcolor: '#eff4ff', borderRadius: '2px' }} />
            ))}
          </Box>
        ) : chartData.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ color: '#6d7a72', fontFamily: 'Inter', fontSize: 14 }}>
              Sin datos suficientes para mostrar la evolución
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid horizontal vertical={false} stroke="rgba(188,202,192,0.3)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontFamily: 'Inter', fontSize: 12, fill: '#6d7a72' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,105,72,0.04)' }} />
              <Bar
                dataKey="value"
                fill="rgba(0,105,72,0.2)"
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
                onMouseEnter={(data, index, e) => { if (e?.target) e.target.style.fill = '#006948'; }}
                onMouseLeave={(data, index, e) => { if (e?.target) e.target.style.fill = 'rgba(0,105,72,0.2)'; }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  );
};

export default InventoryEvolutionChart;
