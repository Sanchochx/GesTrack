import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import inventoryService from '../../services/inventoryService';

const CHART_COLORS = ['#006948', '#00855d', '#565e74', '#ba1a1a', '#9b3e3b'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{ bgcolor: '#ffffff', border: '1px solid #bccac0', borderRadius: '8px', p: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: 'Inter', color: '#0b1c30' }}>{d.name}</Typography>
      <Typography sx={{ fontSize: 13, fontFamily: 'Inter', color: '#3d4a42' }}>
        {d.total_quantity?.toLocaleString('es-CO')} un. — {d.percentage?.toFixed(1)}%
      </Typography>
    </Box>
  );
};

const CustomLabel = ({ cx, cy, total }) => (
  <>
    <text x={cx} y={cy - 6} textAnchor="middle" fill="#3d4a42" fontSize={12} fontFamily="Inter" letterSpacing="0.05em">
      TOTAL
    </text>
    <text x={cx} y={cy + 16} textAnchor="middle" fill="#0b1c30" fontSize={20} fontWeight={700} fontFamily="Inter">
      {(total || 0).toLocaleString('es-CO')} Un.
    </text>
  </>
);

/**
 * US-DASH-004 CA-6/7/8/9/10: Donut chart de distribución de stock por categoría.
 */
const CategoryDistributionChart = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getValueByCategory();
      const categories = res.data ?? [];
      const totalQ = categories.reduce((acc, c) => acc + (c.total_quantity ?? 0), 0);

      // Top 4 + "Otros"
      const sorted = [...categories].sort((a, b) => (b.total_quantity ?? 0) - (a.total_quantity ?? 0));
      let mapped = sorted.slice(0, 4).map((c) => ({
        name: c.category_name,
        value: c.total_quantity ?? 0,
        total_quantity: c.total_quantity ?? 0,
        percentage: totalQ > 0 ? (c.total_quantity / totalQ) * 100 : 0,
      }));
      if (sorted.length > 4) {
        const othersQ = sorted.slice(4).reduce((acc, c) => acc + (c.total_quantity ?? 0), 0);
        mapped.push({
          name: 'Otros',
          value: othersQ,
          total_quantity: othersQ,
          percentage: totalQ > 0 ? (othersQ / totalQ) * 100 : 0,
        });
      }
      setData(mapped);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #bccac0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        p: 3,
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography sx={{ fontSize: 20, fontWeight: 600, color: '#0b1c30', fontFamily: 'Inter', mb: 2 }}>
        Distribución por Categoría
      </Typography>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {loading ? (
          <>
            <Skeleton variant="circular" width={192} height={192} />
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={20} />)}
            </Box>
          </>
        ) : data.length === 0 ? (
          <Typography sx={{ color: '#6d7a72', fontFamily: 'Inter', fontSize: 14 }}>
            Sin datos de categorías disponibles
          </Typography>
        ) : (
          <>
            {/* Donut */}
            <Box sx={{ width: 192, height: 192, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    dataKey="value"
                    isAnimationActive={false}
                    label={false}
                  >
                    {data.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            {/* Legend */}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[...data].sort((a, b) => b.percentage - a.percentage).map((item, idx) => (
                <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: CHART_COLORS[idx % CHART_COLORS.length], flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 14, fontFamily: 'Inter', color: '#0b1c30' }}>{item.name}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: 'Inter', color: '#0b1c30' }}>
                    {item.percentage.toFixed(0)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default CategoryDistributionChart;
