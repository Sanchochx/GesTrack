import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { CheckCircle as CheckIcon, Warning as WarningIcon, Error as ErrorIcon } from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

const STATES = [
  {
    key: 'normal',
    label: 'Stock Normal',
    icon: CheckIcon,
    bg: 'rgba(0,105,72,0.05)',
    border: 'rgba(0,105,72,0.2)',
    color: '#006948',
  },
  {
    key: 'low',
    label: 'Stock Bajo',
    icon: WarningIcon,
    bg: 'rgba(155,62,59,0.05)',
    border: 'rgba(155,62,59,0.2)',
    color: '#9b3e3b',
  },
  {
    key: 'out',
    label: 'Sin Stock',
    icon: ErrorIcon,
    bg: 'rgba(186,26,26,0.05)',
    border: 'rgba(186,26,26,0.2)',
    color: '#ba1a1a',
  },
];

/**
 * US-DASH-005 CA-13/14/15: Panel de distribución de stock con 3 tarjetas de estado.
 */
const StockDistributionPanel = () => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ normal: 0, low: 0, out: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getDashboardKPIs();
      const kpis = res.data ?? {};
      const total = kpis.total_products ?? 0;
      const low = kpis.low_stock_count ?? 0;
      const out = kpis.out_of_stock_count ?? 0;
      setCounts({ normal: Math.max(0, total - low - out), low, out });
    } catch {
      setCounts({ normal: 0, low: 0, out: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const values = { normal: counts.normal, low: counts.low, out: counts.out };

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
        Distribución de Stock
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {STATES.map((s) => {
          const Icon = s.icon;
          return (
            <Box
              key={s.key}
              sx={{
                textAlign: 'center',
                p: 2,
                bgcolor: s.bg,
                borderRadius: '8px',
                border: `1px solid ${s.border}`,
              }}
            >
              <Icon sx={{ color: s.color, fontSize: 28, mb: 0.5 }} />
              {loading ? (
                <Skeleton width={40} height={28} sx={{ mx: 'auto' }} />
              ) : (
                <Typography sx={{ fontSize: 20, fontWeight: 700, fontFamily: 'Inter', color: '#0b1c30', lineHeight: 1.2 }}>
                  {values[s.key]}
                </Typography>
              )}
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: s.color,
                  fontFamily: 'Inter',
                  mt: 0.25,
                }}
              >
                {s.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default StockDistributionPanel;
