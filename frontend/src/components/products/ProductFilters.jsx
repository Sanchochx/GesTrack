import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import categoryService from '../../services/categoryService';

/**
 * ProductFilters Component
 * US-PROD-002: List Products
 * US-PROD-003: Search and Filter Products
 *
 * Filter toolbar for product list with:
 * - Search by name/SKU with debounce (300ms)
 * - Category filter with product counts
 * - Stock status filter dropdown
 * - Items per page selector
 * - Active filter chips
 * - Clear all filters button
 */
const ProductFilters = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  stockStatus,
  onStockStatusChange,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm, onSearchChange]);

  // Sync external searchTerm changes to local state
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await categoryService.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSearchChange = (e) => {
    setLocalSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
  };

  const handleCategoryChange = (e) => {
    onCategoryChange(e.target.value);
  };

  const handleStockStatusChange = (e) => {
    onStockStatusChange(e.target.value);
  };

  const handleItemsPerPageChange = (e) => {
    onItemsPerPageChange(Number(e.target.value));
  };

  const handleClearFilters = () => {
    setLocalSearchTerm('');
    onCategoryChange('');
    onStockStatusChange('');
  };

  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (stockStatus ? 1 : 0);

  // Get readable label for stock status
  const getStockStatusLabel = (status) => {
    switch (status) {
      case 'normal': return 'Stock Normal';
      case 'low': return 'Stock Bajo';
      case 'out': return 'Sin Stock';
      default: return '';
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === Number(categoryId));
    return category ? category.name : '';
  };

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
      {/* Search Field */}
      <TextField
        placeholder="Buscar por nombre o SKU..."
        variant="outlined"
        size="small"
        value={localSearchTerm}
        onChange={handleSearchChange}
        sx={{ flexGrow: 1, minWidth: 250, maxWidth: 400 }}
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
                aria-label="clear search"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Category Filter */}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Categoría</InputLabel>
        <Select
          value={selectedCategory}
          label="Categoría"
          onChange={handleCategoryChange}
          disabled={loadingCategories}
        >
          <MenuItem value="">
            <em>Todas las categorías</em>
          </MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name} {category.product_count !== undefined && `(${category.product_count})`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Stock Status Filter - US-PROD-003 CA-4 */}
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Estado de Stock</InputLabel>
        <Select
          value={stockStatus}
          label="Estado de Stock"
          onChange={handleStockStatusChange}
        >
          <MenuItem value="">
            <em>Todos</em>
          </MenuItem>
          <MenuItem value="normal">Stock Normal</MenuItem>
          <MenuItem value="low">Stock Bajo</MenuItem>
          <MenuItem value="out">Sin Stock</MenuItem>
        </Select>
      </FormControl>

      {/* Items Per Page Selector */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Por página</InputLabel>
        <Select
          value={itemsPerPage}
          label="Por página"
          onChange={handleItemsPerPageChange}
        >
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
        </Select>
      </FormControl>

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

      {/* Active Filters Chips - US-PROD-003 CA-8 */}
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

          {/* Search Term Chip */}
          {searchTerm && (
            <Chip
              label={`Búsqueda: "${searchTerm}"`}
              size="small"
              onDelete={() => setLocalSearchTerm('')}
              color="primary"
              variant="outlined"
            />
          )}

          {/* Category Chip */}
          {selectedCategory && (
            <Chip
              label={`Categoría: ${getCategoryName(selectedCategory)}`}
              size="small"
              onDelete={() => onCategoryChange('')}
              color="primary"
              variant="outlined"
            />
          )}

          {/* Stock Status Chip */}
          {stockStatus && (
            <Chip
              label={`Stock: ${getStockStatusLabel(stockStatus)}`}
              size="small"
              onDelete={() => onStockStatusChange('')}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default ProductFilters;
