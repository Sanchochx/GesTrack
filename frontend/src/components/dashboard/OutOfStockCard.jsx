import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Divider, Skeleton, IconButton, Tooltip } from '@mui/material';
import { Warning as WarningIcon, OpenInNew as OpenIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

/**
 * US-DASH-003 CA-2/3/4: Tarjeta de productos sin stock.
 */
const OutOfStockCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [products, setProducts] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [countRes, listRes] = await Promise.all([
        inventoryService.getOutOfStockCount(),
        inventoryService.getOutOfStockProducts({ page: 1, per_page: 3, sort_by: 'created_at', sort_order: 'desc' }),
      ]);
      setCount(countRes.data?.count ?? 0);
      setProducts(listRes.data?.products ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasAlerts = count > 0;

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '8px',
        border: hasAlerts ? '1px solid rgba(186,26,26,0.3)' : '1px solid #bccac0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 240,
        height: '100%',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <WarningIcon sx={{ fontSize: 20, color: '#ba1a1a' }} />
            <Typography
              sx={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#ba1a1a', fontFamily: 'Inter' }}
            >
              Productos Sin Stock
            </Typography>
          </Box>
          {loading ? (
            <Skeleton width={60} height={56} />
          ) : (
            <Typography sx={{ fontSize: 48, fontWeight: 900, color: '#0b1c30', lineHeight: 1, fontFamily: 'Inter' }}>
              {count}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Actualizar">
            <IconButton size="small" onClick={fetchData} disabled={loading} sx={{ color: '#6d7a72' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ver detalle">
            <IconButton size="small" onClick={() => navigate('/inventory/out-of-stock')} sx={{ color: '#6d7a72' }}>
              <OpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Product list */}
      <Box sx={{ flex: 1, mb: 2 }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <Box key={i} sx={{ py: 0.75, borderBottom: '1px solid rgba(188,202,192,0.3)' }}>
              <Skeleton height={20} />
            </Box>
          ))
        ) : hasAlerts ? (
          products.map((p, idx) => (
            <Box
              key={p.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 0.75,
                borderBottom: idx < products.length - 1 ? '1px solid rgba(188,202,192,0.3)' : 'none',
              }}
            >
              <Typography sx={{ fontSize: 14, color: '#3d4a42', fontFamily: 'Inter' }} noWrap>
                {p.name}
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#ba1a1a', fontFamily: 'Inter', ml: 2, flexShrink: 0 }}>
                0 un.
              </Typography>
            </Box>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography sx={{ fontSize: 14, color: '#006948', fontWeight: 600, fontFamily: 'Inter' }}>
              ✓ Todo en orden — sin productos sin stock
            </Typography>
          </Box>
        )}
      </Box>

      {/* CTA button */}
      <Button
        fullWidth
        variant={hasAlerts ? 'contained' : 'outlined'}
        onClick={() => navigate('/inventory/out-of-stock')}
        sx={{
          bgcolor: hasAlerts ? '#ba1a1a' : undefined,
          color: hasAlerts ? '#ffffff' : '#006948',
          borderColor: hasAlerts ? undefined : '#006948',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.04em',
          borderRadius: '8px',
          '&:hover': { bgcolor: hasAlerts ? '#9c1414' : undefined, opacity: hasAlerts ? undefined : 0.9 },
        }}
      >
        Ver Todos los Productos
      </Button>
    </Box>
  );
};

export default OutOfStockCard;
