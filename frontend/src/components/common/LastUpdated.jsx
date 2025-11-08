/**
 * Componente LastUpdated
 *
 * US-INV-001 CA-4: Timestamp de Última Actualización
 *
 * Muestra la fecha y hora de última actualización de stock de un producto
 * con tooltip que muestra detalles del último movimiento
 */
import { useState } from 'react';
import { Box, Typography, Tooltip, Chip } from '@mui/material';
import { AccessTime, Person } from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const LastUpdated = ({
  timestamp,
  userName,
  movementType,
  quantityChange,
  showRelative = true,
  compact = false
}) => {
  if (!timestamp) {
    return (
      <Typography variant="caption" color="text.secondary">
        Sin actualizaciones
      </Typography>
    );
  }

  const date = new Date(timestamp);
  const formattedDate = format(date, "dd/MM/yyyy HH:mm", { locale: es });
  const relativeTime = formatDistanceToNow(date, { addSuffix: true, locale: es });

  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
        Última Actualización de Stock
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <AccessTime fontSize="small" />
        <Typography variant="caption">
          {formattedDate}
        </Typography>
      </Box>

      {userName && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Person fontSize="small" />
          <Typography variant="caption">
            Por: {userName}
          </Typography>
        </Box>
      )}

      {movementType && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Tipo: {movementType}
          </Typography>
        </Box>
      )}

      {quantityChange !== undefined && quantityChange !== null && (
        <Box sx={{ mt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: quantityChange > 0 ? 'success.main' : 'error.main',
              fontWeight: 'bold'
            }}
          >
            Cambio: {quantityChange > 0 ? '+' : ''}{quantityChange} unidades
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (compact) {
    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        <Chip
          icon={<AccessTime fontSize="small" />}
          label={showRelative ? relativeTime : formattedDate}
          size="small"
          variant="outlined"
          sx={{
            cursor: 'help',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'help',
          padding: '4px 8px',
          borderRadius: 1,
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        <AccessTime fontSize="small" color="action" />
        <Typography variant="caption" color="text.secondary">
          Actualizado: {showRelative ? relativeTime : formattedDate}
        </Typography>
        {userName && (
          <>
            <Typography variant="caption" color="text.secondary">
              •
            </Typography>
            <Person fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {userName}
            </Typography>
          </>
        )}
      </Box>
    </Tooltip>
  );
};

export default LastUpdated;
