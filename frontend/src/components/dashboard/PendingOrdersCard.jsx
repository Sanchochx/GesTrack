import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Skeleton, IconButton, Tooltip } from '@mui/material';
import { PendingActions as PendingIcon, OpenInNew as OpenIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import orderService from '../../services/orderService';
import usePolling from '../../hooks/usePolling';

/**
 * US-REP-001 CA-2/4: Tarjeta de pedidos pendientes — Sistema de Diseño Emerald Logic.
 */
const PendingOrdersCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders({
        status: 'Pendiente', per_page: 3, sort_by: 'created_at', sort_order: 'desc',
      });
      setCount(res.pagination?.total ?? 0);
      setRecentOrders(res.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, 60000);

  const hasPending = count > 0;

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '8px',
        border: hasPending ? '1px solid rgba(255,167,38,0.4)' : '1px solid #bccac0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 240,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <PendingIcon sx={{ fontSize: 20, color: '#a15c00' }} />
            <Typography sx={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#a15c00', fontFamily: 'Inter' }}>
              Pedidos Pendientes
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
            <IconButton size="small" onClick={() => navigate('/orders?status=Pendiente')} sx={{ color: '#6d7a72' }}>
              <OpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ flex: 1, mb: 2 }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <Box key={i} sx={{ py: 0.75, borderBottom: '1px solid rgba(188,202,192,0.3)' }}>
              <Skeleton height={20} />
            </Box>
          ))
        ) : hasPending ? (
          recentOrders.map((o, idx) => (
            <Box
              key={o.id}
              sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75,
                borderBottom: idx < recentOrders.length - 1 ? '1px solid rgba(188,202,192,0.3)' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/orders/${o.id}`)}
            >
              <Typography sx={{ fontSize: 14, color: '#3d4a42', fontFamily: 'Inter' }} noWrap>
                {o.order_number}
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#a15c00', fontFamily: 'Inter', ml: 2, flexShrink: 0 }}>
                {o.customer_name || '—'}
              </Typography>
            </Box>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography sx={{ fontSize: 14, color: '#006948', fontWeight: 600, fontFamily: 'Inter' }}>
              ✓ Sin pedidos pendientes
            </Typography>
          </Box>
        )}
      </Box>

      <Button
        fullWidth
        variant={hasPending ? 'contained' : 'outlined'}
        onClick={() => navigate('/orders?status=Pendiente')}
        sx={{
          bgcolor: hasPending ? '#a15c00' : undefined,
          color: hasPending ? '#ffffff' : '#006948',
          borderColor: hasPending ? undefined : '#006948',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.04em',
          borderRadius: '8px',
          '&:hover': { bgcolor: hasPending ? '#8a4e00' : undefined, opacity: hasPending ? undefined : 0.9 },
        }}
      >
        Ver Todos los Pedidos Pendientes
      </Button>
    </Box>
  );
};

export default PendingOrdersCard;
