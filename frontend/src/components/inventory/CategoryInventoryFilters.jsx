/**
 * US-INV-006 CA-4: Filtros y Ordenamiento para Vista de Inventario por Categoría
 *
 * Permite filtrar y ordenar categorías por diversos criterios
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

/**
 * Componente de filtros para vista de inventario por categoría
 */
const CategoryInventoryFilters = ({ filters, onFiltersChange }) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // CA-4: Debounce de búsqueda (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleSortChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleCheckboxChange = (field) => (event) => {
    onFiltersChange({
      ...filters,
      [field]: event.target.checked
    });
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onFiltersChange({ ...filters, search: '' });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onFiltersChange({
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
      hasLowStock: false,
      hasOutOfStock: false
    });
  };

  // Contar filtros activos
  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.hasLowStock ? 1 : 0) +
    (filters.hasOutOfStock ? 1 : 0) +
    (filters.sortBy !== 'name' || filters.sortOrder !== 'asc' ? 1 : 0);

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        {/* CA-4: Campo de búsqueda */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Buscar categoría"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: localSearch && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            placeholder="Nombre de categoría..."
          />
        </Grid>

        {/* CA-4: Ordenar por */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                onFiltersChange({ ...filters, sortBy, sortOrder });
              }}
              label="Ordenar por"
            >
              <MenuItem value="name_asc">Nombre (A-Z)</MenuItem>
              <MenuItem value="name_desc">Nombre (Z-A)</MenuItem>
              <MenuItem value="value_desc">Valor (Mayor a Menor)</MenuItem>
              <MenuItem value="value_asc">Valor (Menor a Mayor)</MenuItem>
              <MenuItem value="products_desc">Cantidad de Productos (Mayor)</MenuItem>
              <MenuItem value="products_asc">Cantidad de Productos (Menor)</MenuItem>
              <MenuItem value="low_stock_desc">Stock Bajo (Mayor)</MenuItem>
              <MenuItem value="low_stock_asc">Stock Bajo (Menor)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* CA-4: Checkbox - Solo con stock bajo */}
        <Grid item xs={12} md={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.hasLowStock || false}
                onChange={handleCheckboxChange('hasLowStock')}
                color="warning"
              />
            }
            label="Solo stock bajo"
          />
        </Grid>

        {/* CA-4: Checkbox - Solo sin stock */}
        <Grid item xs={12} md={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.hasOutOfStock || false}
                onChange={handleCheckboxChange('hasOutOfStock')}
                color="error"
              />
            }
            label="Solo sin stock"
          />
        </Grid>

        {/* Botón limpiar filtros */}
        {activeFiltersCount > 0 && (
          <Grid item xs={12} md={1}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <IconButton
                onClick={handleClearFilters}
                color="primary"
                title="Limpiar filtros"
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Indicador de filtros activos */}
      {activeFiltersCount > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CategoryInventoryFilters;
