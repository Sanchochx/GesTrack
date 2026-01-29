/**
 * US-INV-005 CA-2: Widget de Valor Total del Inventario
 *
 * Muestra el valor total del inventario con indicador de cambio vs período anterior
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

/**
 * Widget para mostrar el valor total del inventario en el dashboard
 */
const InventoryValueWidget = ({ period = '7d' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [valueData, setValueData] = useState(null);
  const [changeData, setChangeData] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchInventoryValue();

    // CA-6: Set up polling (every 5 minutes)
    const intervalId = setInterval(() => {
      fetchInventoryValue();
    }, 5 * 60 * 1000); // 5 minutes

    // CA-6: Page visibility handling - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, fetch fresh data
        fetchInventoryValue();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount or period change
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [period]);

  const fetchInventoryValue = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener valor total y cambio en paralelo
      const [totalResponse, changeResponse] = await Promise.all([
        inventoryService.getTotalInventoryValue(),
        inventoryService.getValueChange(period)
      ]);

      setValueData(totalResponse.data);
      setChangeData(changeResponse.data);
    } catch (err) {
      console.error('Error fetching inventory value:', err);
      setError(err.error?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = () => {
    if (!changeData) return <RemoveIcon fontSize="small" />;

    switch (changeData.direction) {
      case 'increase':
        return <TrendingUpIcon fontSize="small" />;
      case 'decrease':
        return <TrendingDownIcon fontSize="small" />;
      default:
        return <RemoveIcon fontSize="small" />;
    }
  };

  const getChangeColor = () => {
    if (!changeData) return 'default';

    switch (changeData.direction) {
      case 'increase':
        return 'success';
      case 'decrease':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPeriodLabel = () => {
    const labels = {
      '7d': 'últimos 7 días',
      '30d': 'último mes',
      '3m': 'últimos 3 meses',
      '1y': 'último año'
    };
    return labels[period] || period;
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Ahora';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes === 1) return 'hace 1 minuto';
    if (diffMinutes < 60) return `hace ${diffMinutes} minutos`;
    if (diffMinutes < 120) return 'hace 1 hora';
    if (diffMinutes < 1440) return `hace ${Math.floor(diffMinutes / 60)} horas`;
    return `hace ${Math.floor(diffMinutes / 1440)} días`;
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        {/* Título */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: 'primary.light',
              borderRadius: 2,
              p: 1,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <InventoryIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" gutterBottom>
              Valor Total de Inventario
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Actualizado: {formatLastUpdated(valueData?.calculated_at)}
            </Typography>
          </Box>
        </Box>

        {/* Valor Principal */}
        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
          {valueData?.formatted_value || '$0.00'}
        </Typography>

        {/* Indicador de Cambio */}
        {changeData && (
          <Tooltip
            title={`Cambio desde ${getPeriodLabel()}: ${changeData.formatted_change}`}
            arrow
            placement="top"
          >
            <Chip
              icon={getChangeIcon()}
              label={`${changeData.change_percentage >= 0 ? '+' : ''}${changeData.change_percentage}%`}
              color={getChangeColor()}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Tooltip>
        )}

        {/* Estadísticas adicionales */}
        <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Productos
            </Typography>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
              {valueData?.total_products || 0}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Unidades
            </Typography>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
              {valueData?.total_quantity?.toLocaleString() || 0}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InventoryValueWidget;
