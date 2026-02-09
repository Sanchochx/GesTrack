import { Box, Typography, Button } from '@mui/material';
import {
  People as PeopleIcon,
  SearchOff as SearchOffIcon,
} from '@mui/icons-material';

/**
 * CustomerEmptyState Component
 * US-CUST-002 CA-10: Empty states for customer list
 */
const CustomerEmptyState = ({ isFilteredEmpty = false, onClearFilters }) => {
  if (isFilteredEmpty) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <SearchOffIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          No se encontraron clientes
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          No hay clientes que coincidan con los filtros aplicados.
        </Typography>
        <Button variant="outlined" onClick={onClearFilters}>
          Limpiar filtros
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
      <PeopleIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
      <Typography variant="h6" gutterBottom>
        No hay clientes registrados
      </Typography>
      <Typography variant="body2">
        Registra tu primer cliente usando el botón "Nuevo Cliente".
      </Typography>
    </Box>
  );
};

export default CustomerEmptyState;
