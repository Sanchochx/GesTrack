import { Box, IconButton, MenuItem, Select, Tooltip } from '@mui/material';
import { DragIndicator as DragIcon, Close as CloseIcon } from '@mui/icons-material';

const SIZE_LABELS = { third: 'S', half: 'M', two_thirds: 'L', full: 'XL' };

/**
 * DashboardWidgetContainer – envoltorio de un widget del dashboard personalizable.
 * US-REP-014 CA-3/CA-7: arrastrable para reordenar, y con selector de tamaño.
 */
const DashboardWidgetContainer = ({
  widgetType, size, label, children,
  onDragStart, onDragOver, onDrop, onDragEnd, isDragging,
  onSizeChange, onRemove,
}) => {
  return (
    <Box
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      sx={{
        height: '100%',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s',
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, px: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'grab', color: 'text.secondary' }}>
          <DragIcon fontSize="small" />
          <Box component="span" sx={{ fontSize: 12, fontWeight: 600 }}>{label}</Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Select
            value={size}
            onChange={(e) => onSizeChange(widgetType, e.target.value)}
            size="small"
            variant="standard"
            disableUnderline
            sx={{ fontSize: 11, minWidth: 32 }}
          >
            {Object.entries(SIZE_LABELS).map(([value, shortLabel]) => (
              <MenuItem key={value} value={value} sx={{ fontSize: 12 }}>{shortLabel}</MenuItem>
            ))}
          </Select>
          <Tooltip title="Quitar widget">
            <IconButton size="small" onClick={() => onRemove(widgetType)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ height: 'calc(100% - 28px)' }}>
        {children}
      </Box>
    </Box>
  );
};

export default DashboardWidgetContainer;
