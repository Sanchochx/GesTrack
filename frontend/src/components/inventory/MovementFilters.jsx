import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Box,
  Typography,
  Collapse,
  IconButton
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

/**
 * US-INV-003 CA-3: Movement Filters Component
 *
 * Panel de filtros avanzados para historial de movimientos:
 * - Rango de fechas con presets
 * - Tipo de movimiento (multiselect)
 * - Producto
 * - Usuario
 * - Categoría
 * - Botón limpiar filtros
 */

// Tipos de movimiento disponibles
const MOVEMENT_TYPES = [
  'Stock Inicial',
  'Entrada',
  'Salida',
  'Venta',
  'Compra',
  'Ajuste Manual',
  'Devolución',
  'Reserva de Orden',
  'Cancelación de Orden'
];

// Presets de fecha (CA-3)
const DATE_PRESETS = [
  { label: 'Hoy', value: 'today' },
  { label: 'Esta semana', value: 'week' },
  { label: 'Este mes', value: 'month' },
  { label: 'Último trimestre', value: 'quarter' }
];

const MovementFilters = ({
  onFilterChange,
  products = [],
  users = [],
  categories = [],
  loadingProducts = false,
  loadingUsers = false,
  loadingCategories = false
}) => {
  const [expanded, setExpanded] = useState(true);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    movement_type: [],
    product_id: '',
    user_id: '',
    category_id: ''
  });

  // Aplicar preset de fecha
  const applyDatePreset = (preset) => {
    const now = new Date();
    let dateFrom, dateTo;

    switch (preset) {
      case 'today':
        dateFrom = startOfDay(now);
        dateTo = endOfDay(now);
        break;
      case 'week':
        dateFrom = startOfDay(subWeeks(now, 1));
        dateTo = endOfDay(now);
        break;
      case 'month':
        dateFrom = startOfDay(subMonths(now, 1));
        dateTo = endOfDay(now);
        break;
      case 'quarter':
        dateFrom = startOfDay(subMonths(now, 3));
        dateTo = endOfDay(now);
        break;
      default:
        return;
    }

    // Formatear a ISO string para el input datetime-local
    const formattedFrom = format(dateFrom, "yyyy-MM-dd'T'HH:mm");
    const formattedTo = format(dateTo, "yyyy-MM-dd'T'HH:mm");

    setFilters(prev => ({
      ...prev,
      date_from: formattedFrom,
      date_to: formattedTo
    }));
  };

  // Manejar cambio de filtro
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    const emptyFilters = {
      date_from: '',
      date_to: '',
      movement_type: [],
      product_id: '',
      user_id: '',
      category_id: ''
    };
    setFilters(emptyFilters);
    onFilterChange && onFilterChange(emptyFilters);
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    // Convertir fechas a formato ISO para el backend
    const filtersToSend = { ...filters };

    if (filtersToSend.date_from) {
      filtersToSend.date_from = new Date(filtersToSend.date_from).toISOString();
    }
    if (filtersToSend.date_to) {
      filtersToSend.date_to = new Date(filtersToSend.date_to).toISOString();
    }

    onFilterChange && onFilterChange(filtersToSend);
  };

  // Contar filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.date_from) count++;
    if (filters.date_to) count++;
    if (filters.movement_type && filters.movement_type.length > 0) count++;
    if (filters.product_id) count++;
    if (filters.user_id) count++;
    if (filters.category_id) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* Header del panel de filtros */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            <Typography variant="h6">
              Filtros
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip
                label={`${activeFiltersCount} activo${activeFiltersCount > 1 ? 's' : ''}`}
                size="small"
                color="primary"
              />
            )}
          </Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Grid container spacing={2}>
            {/* Presets de Fecha */}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Rango rápido:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    size="small"
                    variant="outlined"
                    onClick={() => applyDatePreset(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </Box>
            </Grid>

            {/* Fecha Desde */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Fecha Desde"
                type="datetime-local"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Fecha Hasta */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Fecha Hasta"
                type="datetime-local"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Tipo de Movimiento (Multiselect) */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                multiple
                options={MOVEMENT_TYPES}
                value={filters.movement_type}
                onChange={(_, newValue) => handleFilterChange('movement_type', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tipo de Movimiento"
                    size="small"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Producto */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                value={products.find(p => p.id === filters.product_id) || null}
                onChange={(_, newValue) => handleFilterChange('product_id', newValue?.id || '')}
                loading={loadingProducts}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Producto"
                    size="small"
                  />
                )}
              />
            </Grid>

            {/* Usuario */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Usuario</InputLabel>
                <Select
                  value={filters.user_id}
                  label="Usuario"
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Categoría */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filters.category_id}
                  label="Categoría"
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todas</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Botones de Acción */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  disabled={activeFiltersCount === 0}
                >
                  Limpiar Filtros
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FilterIcon />}
                  onClick={handleApplyFilters}
                >
                  Aplicar Filtros
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default MovementFilters;
