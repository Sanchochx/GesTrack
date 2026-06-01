import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, LinearProgress, Skeleton } from '@mui/material';
import inventoryService from '../../services/inventoryService';

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, notation: 'compact' }).format(v ?? 0);

const BAR_COLORS = ['#006948', '#00855d', '#565e74', '#9b3e3b', '#bccac0'];

/**
 * US-DASH-005 CA-10/11/12: Panel de top categorías por inversión con barras de progreso.
 */
const TopCategoriesPanel = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getValueByCategory();
      const raw = res.data ?? [];
      const total = raw.reduce((acc, c) => acc + (c.total_value ?? 0), 0);
      const sorted = [...raw]
        .sort((a, b) => (b.total_value ?? 0) - (a.total_value ?? 0))
        .slice(0, 5)
        .map((c) => ({
          name: c.category_name,
          value: c.total_value ?? 0,
          pct: total > 0 ? Math.round((c.total_value / total) * 100) : 0,
        }));
      setCategories(sorted);
    } catch {
      setCategories([]);
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
      }}
    >
      <Typography sx={{ fontSize: 20, fontWeight: 600, color: '#0b1c30', fontFamily: 'Inter', mb: 3 }}>
        Top Categorías por Inversión
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Box key={i}>
                <Skeleton width="60%" height={16} sx={{ mb: 0.5 }} />
                <Skeleton height={8} />
              </Box>
            ))
          : categories.map((cat, idx) => (
              <Box key={cat.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography
                    sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Inter', color: '#0b1c30' }}
                  >
                    {cat.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#006948', fontFamily: 'Inter', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCOP(cat.value)} ({cat.pct}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={cat.pct}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#eff4ff',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: BAR_COLORS[idx % BAR_COLORS.length],
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            ))}
      </Box>
    </Box>
  );
};

export default TopCategoriesPanel;
