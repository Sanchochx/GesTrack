import { Chip, Tooltip, Box } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

/**
 * ProfitMarginBadge Component
 * US-PROD-010 CA-2, CA-3: Profit margin display with color coding
 *
 * Displays profit margin with visual indicators:
 * - CA-2: Format "±XX.XX%" with exactly 2 decimals
 * - CA-3: Color coding based on margin ranges:
 *   - Green (>30%): Excellent profitability
 *   - Yellow (15-30%): Moderate profitability
 *   - Red (<15%): Low profitability or loss
 */
const ProfitMarginBadge = ({
  profitMargin,
  size = 'small',
  showIcon = true,
  showLabel = true,
  variant = 'filled'
}) => {
  /**
   * CA-3: Get color classification based on profit margin
   * - Green: > 30% (excellent)
   * - Yellow: 15-30% (moderate)
   * - Red: < 15% (low/loss)
   */
  const getMarginColor = (margin) => {
    if (margin > 30) return 'success';      // Green - Excellent
    if (margin >= 15) return 'warning';     // Yellow - Moderate
    return 'error';                         // Red - Low/Loss
  };

  /**
   * Get detailed badge configuration based on margin value
   */
  const getBadgeConfig = () => {
    const margin = profitMargin ?? 0;
    const isNegative = margin < 0;
    const isZero = margin === 0;
    const color = getMarginColor(margin);

    // Select icon based on margin value
    let icon = <TrendingUpIcon />;
    if (isNegative) {
      icon = <TrendingDownIcon />;
    } else if (isZero) {
      icon = <RemoveIcon />;
    }

    // Tooltip messages
    let tooltip = '';
    if (margin > 30) {
      tooltip = `Excelente margen: ${margin.toFixed(2)}%`;
    } else if (margin >= 15) {
      tooltip = `Margen aceptable: ${margin.toFixed(2)}%`;
    } else if (margin > 0) {
      tooltip = `Margen bajo: ${margin.toFixed(2)}%`;
    } else if (margin === 0) {
      tooltip = `Sin ganancia ni pérdida: ${margin.toFixed(2)}%`;
    } else {
      tooltip = `Pérdida: ${margin.toFixed(2)}%`;
    }

    // Background and text colors
    let backgroundColor = '#e8f5e9';  // Green light
    let textColor = '#2e7d32';        // Green dark

    if (color === 'warning') {
      backgroundColor = '#fff3e0';    // Yellow light
      textColor = '#e65100';          // Orange dark
    } else if (color === 'error') {
      backgroundColor = '#ffebee';    // Red light
      textColor = '#c62828';          // Red dark
    }

    return {
      color,
      icon,
      tooltip,
      backgroundColor,
      textColor,
      isNegative,
      isZero,
    };
  };

  const config = getBadgeConfig();
  const margin = profitMargin ?? 0;

  /**
   * CA-2: Format margin as "±XX.XX%"
   * Show explicit sign for negative values
   */
  const formatMargin = (value) => {
    const formatted = value.toFixed(2);
    if (value > 0) {
      return `+${formatted}%`;
    }
    return `${formatted}%`;
  };

  const label = showLabel ? formatMargin(margin) : null;

  return (
    <Tooltip title={config.tooltip} arrow>
      <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
        <Chip
          label={label}
          color={config.color}
          size={size}
          icon={showIcon ? config.icon : null}
          variant={variant}
          sx={{
            fontWeight: config.isNegative || margin < 15 ? 'bold' : 'normal',
            backgroundColor: variant === 'filled' ? config.backgroundColor : 'transparent',
            color: config.textColor,
            borderColor: variant === 'outlined' ? config.textColor : 'transparent',
            '& .MuiChip-icon': {
              color: config.textColor,
            },
            ...(size === 'medium' && {
              fontSize: '1rem',
              height: '32px',
            }),
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default ProfitMarginBadge;
