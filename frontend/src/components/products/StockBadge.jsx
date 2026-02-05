import { Chip, Tooltip, Box, keyframes } from '@mui/material';
import {
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  RemoveShoppingCart as NoStockIcon,
} from '@mui/icons-material';

// US-INV-007 CA-3: Pulse animation for critical stock badge
const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(211, 47, 47, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
  }
`;

/**
 * StockBadge Component
 * US-PROD-002: List Products
 * US-PROD-008 CA-3: Stock status indicators
 * US-INV-007 CA-3: Enhanced out-of-stock indicators
 *
 * Displays stock status with visual indicators:
 * - CA-3: Low stock warning (stock <= reorder point)
 * - CA-3: Out of stock badge (stock = 0) - Enhanced with animation
 * - Visual color coding and tooltips
 */
const StockBadge = ({ stock, reorderPoint = 10, minStockLevel, showQuantity = true, size = 'small' }) => {
  // US-PROD-008 CA-3: Usar reorder_point para determinar stock bajo
  const reorderLevel = reorderPoint || minStockLevel || 10;

  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= reorderLevel;
  const isNormalStock = stock > reorderLevel;

  /**
   * Get badge configuration based on stock status
   * US-INV-007 CA-3: Enhanced configuration for out-of-stock products
   */
  const getBadgeConfig = () => {
    if (isOutOfStock) {
      return {
        label: 'SIN STOCK',
        color: 'error',
        icon: <NoStockIcon />,
        tooltip: 'ALERTA: Producto agotado - Reorden urgente requerida',
        backgroundColor: '#d32f2f',
        textColor: '#ffffff',
        variant: 'filled',
        animate: true,  // US-INV-007 CA-3: Enable animation
      };
    }

    if (isLowStock) {
      return {
        label: showQuantity ? `${stock} unidades` : 'STOCK BAJO',
        color: 'warning',
        icon: <WarningIcon />,
        tooltip: `Stock bajo: ${stock} unidades (punto de reorden: ${reorderLevel})`,  // US-PROD-008 CA-3
        backgroundColor: '#fff3e0',
        textColor: '#e65100',
        variant: 'outlined',
        animate: false,
      };
    }

    return {
      label: showQuantity ? `${stock} unidades` : 'STOCK NORMAL',
      color: 'success',
      icon: <CheckCircleIcon />,
      tooltip: `Stock normal: ${stock} unidades`,
      backgroundColor: '#e8f5e9',
      textColor: '#2e7d32',
      variant: 'outlined',
      animate: false,
    };
  };

  const config = getBadgeConfig();

  // US-INV-007 CA-3: Dynamic chip size based on prop
  const chipSize = size === 'large' ? 'medium' : 'small';

  return (
    <Tooltip title={config.tooltip} arrow>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        {/* Stock Quantity Display */}
        {showQuantity && (
          <Chip
            label={config.label}
            color={config.color}
            size={chipSize}
            icon={config.icon}
            variant={config.variant || 'outlined'}
            sx={{
              fontWeight: isOutOfStock || isLowStock ? 'bold' : 'normal',
              backgroundColor: config.backgroundColor,
              color: config.textColor,
              '& .MuiChip-icon': {
                color: config.textColor,
              },
              // US-INV-007 CA-3: Pulse animation for out-of-stock
              ...(config.animate && {
                animation: `${pulseAnimation} 2s infinite`,
              }),
              // US-INV-007 CA-3: Larger font for out-of-stock
              ...(isOutOfStock && {
                fontSize: '0.85rem',
                letterSpacing: '0.5px',
              }),
            }}
          />
        )}

        {/* Status Badge (if not showing quantity) */}
        {!showQuantity && (
          <Chip
            label={config.label}
            color={config.color}
            size={chipSize}
            variant={config.variant || 'outlined'}
            icon={isOutOfStock ? config.icon : undefined}
            sx={{
              fontWeight: 'bold',
              backgroundColor: isOutOfStock ? config.backgroundColor : undefined,
              color: isOutOfStock ? config.textColor : undefined,
              '& .MuiChip-icon': {
                color: isOutOfStock ? config.textColor : undefined,
              },
              // US-INV-007 CA-3: Animation for out-of-stock
              ...(config.animate && {
                animation: `${pulseAnimation} 2s infinite`,
              }),
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default StockBadge;
