import { Box, Typography, Button, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  People as PeopleIcon,
  SearchOff as SearchOffIcon,
  PersonAdd as PersonAddIcon,
  Lightbulb as TipIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * CustomerEmptyState Component
 * US-CUST-002 CA-10: Empty states for customer list
 * US-CUST-003 CA-9: Enhanced no results with suggestions
 */
const CustomerEmptyState = ({
  isFilteredEmpty = false,
  onClearFilters,
  searchTerm = '',
}) => {
  const navigate = useNavigate();

  if (isFilteredEmpty) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <SearchOffIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" gutterBottom>
          No se encontraron clientes
          {searchTerm && (
            <Typography component="span" color="text.primary">
              {` que coincidan con "${searchTerm}"`}
            </Typography>
          )}
        </Typography>

        {/* US-CUST-003 CA-9: Suggestions */}
        <Paper
          elevation={0}
          sx={{
            maxWidth: 400,
            mx: 'auto',
            mt: 3,
            mb: 3,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TipIcon fontSize="small" />
            Sugerencias
          </Typography>
          <List dense disablePadding>
            <ListItem disableGutters sx={{ py: 0.25 }}>
              <ListItemText
                primary="Verifica la ortografía del término de búsqueda"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem disableGutters sx={{ py: 0.25 }}>
              <ListItemText
                primary="Intenta con menos palabras o términos más cortos"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem disableGutters sx={{ py: 0.25 }}>
              <ListItemText
                primary="Busca por nombre, email o teléfono"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          </List>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={onClearFilters}>
            Limpiar búsqueda
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/customers/new')}
          >
            Registrar nuevo cliente
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
      <PeopleIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
      <Typography variant="h6" gutterBottom>
        No hay clientes registrados
      </Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Registra tu primer cliente para comenzar a gestionar tu cartera.
      </Typography>
      <Button
        variant="contained"
        startIcon={<PersonAddIcon />}
        onClick={() => navigate('/customers/new')}
      >
        Registrar primer cliente
      </Button>
    </Box>
  );
};

export default CustomerEmptyState;
