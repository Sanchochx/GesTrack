import { Box, Typography, Button } from '@mui/material';
import { SearchOff as SearchOffIcon } from '@mui/icons-material';

/**
 * EmptyState Component
 * US-PROD-003 CA-7: Estado sin resultados
 *
 * Displays a friendly message when no products match the current filters
 * with a clear button to reset all filters.
 */
const EmptyState = ({ onClearFilters }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
      }}
    >
      {/* Empty Icon */}
      <SearchOffIcon
        sx={{
          fontSize: 80,
          color: 'text.disabled',
          mb: 2,
        }}
      />

      {/* No Results Message */}
      <Typography
        variant="h6"
        color="text.secondary"
        gutterBottom
        align="center"
      >
        No se encontraron productos
      </Typography>

      {/* Suggestion */}
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ mb: 3, maxWidth: 400 }}
      >
        Intenta con otros términos de búsqueda o ajusta los filtros aplicados
      </Typography>

      {/* Clear Filters Button */}
      <Button
        variant="outlined"
        color="primary"
        onClick={onClearFilters}
      >
        Limpiar todos los filtros
      </Button>
    </Box>
  );
};

export default EmptyState;
