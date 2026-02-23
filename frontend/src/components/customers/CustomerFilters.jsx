import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Switch,
  Chip,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

/**
 * CustomerFilters Component
 * US-CUST-002 CA-2/CA-4: Search + "Mostrar inactivos" toggle
 * US-CUST-003: Enhanced search functionality
 * US-CUST-011 CA-5: Filter by customer category
 */
const CustomerFilters = ({
  searchTerm,
  onSearchChange,
  showInactive,
  onShowInactiveChange,
  selectedCategories = [],
  onCategoriesChange,
  statistics = {},
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const searchInputRef = useRef(null);

  // US-CUST-003 CA-2: Debounce search term (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchTerm, onSearchChange]);

  // Sync external searchTerm changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleClearFilters = () => {
    setLocalSearchTerm('');
    onShowInactiveChange(false);
    onCategoriesChange?.([]);
  };

  // US-CUST-003 CA-8: Escape key to clear search
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && localSearchTerm) {
      e.preventDefault();
      handleClearSearch();
    }
  };

  // US-CUST-011 CA-5: Toggle category selection
  const handleCategoryToggle = (event, newCategories) => {
    onCategoriesChange?.(newCategories);
  };

  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (showInactive ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0);

  const CATEGORIES = [
    { value: 'VIP', label: `VIP${statistics.vip !== undefined ? ` (${statistics.vip})` : ''}`, color: '#f9a825' },
    { value: 'Frecuente', label: `Frecuente${statistics.frecuente !== undefined ? ` (${statistics.frecuente})` : ''}`, color: '#1565c0' },
    { value: 'Regular', label: `Regular${statistics.regular !== undefined ? ` (${statistics.regular})` : ''}`, color: '#757575' },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      {/* Filters Row */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* US-CUST-003 CA-1: Prominent search field with icon */}
        <TextField
          inputRef={searchInputRef}
          placeholder="Buscar por nombre, email o teléfono..."
          variant="outlined"
          size="small"
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ flexGrow: 1, minWidth: 250, maxWidth: 450 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: localSearchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  edge="end"
                  aria-label="limpiar búsqueda"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* US-CUST-011 CA-5: Category filter buttons */}
        <ToggleButtonGroup
          value={selectedCategories}
          onChange={handleCategoryToggle}
          size="small"
          aria-label="filtro por categoría"
        >
          {CATEGORIES.map((cat) => (
            <ToggleButton
              key={cat.value}
              value={cat.value}
              aria-label={cat.value}
              sx={{
                fontSize: '0.72rem',
                px: 1,
                '&.Mui-selected': {
                  color: cat.color,
                  borderColor: cat.color,
                  backgroundColor: `${cat.color}18`,
                },
              }}
            >
              {cat.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Show Inactive Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={showInactive}
              onChange={(e) => onShowInactiveChange(e.target.checked)}
              size="small"
            />
          }
          label="Mostrar inactivos"
          sx={{ ml: 1 }}
        />

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Chip
            label={`Limpiar filtros (${activeFiltersCount})`}
            color="default"
            variant="outlined"
            onDelete={handleClearFilters}
            sx={{ cursor: 'pointer' }}
          />
        )}
      </Box>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Filtros activos:
          </Typography>

          {searchTerm && (
            <Chip
              label={`Búsqueda: "${searchTerm}"`}
              size="small"
              onDelete={() => setLocalSearchTerm('')}
              color="primary"
              variant="outlined"
            />
          )}

          {showInactive && (
            <Chip
              label="Mostrando inactivos"
              size="small"
              onDelete={() => onShowInactiveChange(false)}
              color="primary"
              variant="outlined"
            />
          )}

          {selectedCategories.length > 0 && (
            <Chip
              label={`Categoría: ${selectedCategories.join(', ')}`}
              size="small"
              onDelete={() => onCategoriesChange?.([])}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default CustomerFilters;
