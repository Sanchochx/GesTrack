import { Chip, Tooltip, Box } from '@mui/material';
import {
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

/**
 * StockBadge Component
 * US-PROD-002: List Products
 *
 * Displays stock status with visual indicators:
 * - CA-3: Low stock warning (stock <= reorder point)
 * - CA-3: Out of stock badge (stock = 0)
 * - Visual color coding and tooltips
 */
const StockBadge = ({ stock, minStockLevel = 10, showQuantity = true }) => {
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= minStockLevel;
  const isNormalStock = stock > minStockLevel;

  /**
   * Get badge configuration based on stock status
   */
  const getBadgeConfig = () => {
    if (isOutOfStock) {
      return {
        label: 'SIN STOCK',
        color: 'error',
        icon: <ErrorIcon />,
        tooltip: 'Producto agotado - Reorden urgente',
        backgroundColor: '#ffebee',
        textColor: '#c62828',
      };
    }

    if (isLowStock) {
      return {
        label: showQuantity ? `${stock} unidades` : 'STOCK BAJO',
        color: 'warning',
        icon: <WarningIcon />,
        tooltip: `Stock bajo: ${stock} unidades (reorden en ${minStockLevel} unidades)`,
        backgroundColor: '#fff3e0',
        textColor: '#e65100',
      };
    }

    return {
      label: showQuantity ? `${stock} unidades` : 'STOCK NORMAL',
      color: 'success',
      icon: <CheckCircleIcon />,
      tooltip: `Stock normal: ${stock} unidades`,
      backgroundColor: '#e8f5e9',
      textColor: '#2e7d32',
    };
  };

  const config = getBadgeConfig();

  return (
    <Tooltip title={config.tooltip} arrow>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        {/* Stock Quantity Display */}
        {showQuantity && (
          <Chip
            label={config.label}
            color={config.color}
            size="small"
            icon={config.icon}
            sx={{
              fontWeight: isOutOfStock || isLowStock ? 'bold' : 'normal',
              backgroundColor: config.backgroundColor,
              color: config.textColor,
              '& .MuiChip-icon': {
                color: config.textColor,
              },
            }}
          />
        )}

        {/* Status Badge (if not showing quantity) */}
        {!showQuantity && (
          <Chip
            label={config.label}
            color={config.color}
            size="small"
            variant={isOutOfStock ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 'bold',
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default StockBadge;
