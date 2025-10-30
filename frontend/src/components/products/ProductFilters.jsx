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
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import categoryService from '../../services/categoryService';

/**
 * ProductFilters Component
 * US-PROD-002: List Products
 *
 * Filter toolbar for product list with:
 * - Search by name/SKU
 * - Category filter
 * - Low stock filter
 * - Items per page selector
 */
const ProductFilters = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  lowStockOnly,
  onLowStockChange,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

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
    onSearchChange(e.target.value);
  };

  const handleCategoryChange = (e) => {
    onCategoryChange(e.target.value);
  };

  const handleLowStockToggle = () => {
    onLowStockChange(!lowStockOnly);
  };

  const handleItemsPerPageChange = (e) => {
    onItemsPerPageChange(Number(e.target.value));
  };

  const handleClearFilters = () => {
    onSearchChange('');
    onCategoryChange('');
    onLowStockChange(false);
  };

  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (lowStockOnly ? 1 : 0);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {/* Search Field */}
      <TextField
        placeholder="Buscar por nombre o SKU..."
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ flexGrow: 1, minWidth: 250, maxWidth: 400 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
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
              {category.name}
            </MenuItem>
          ))}
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

      {/* Low Stock Filter Chip */}
      <Chip
        label="Stock Bajo"
        color={lowStockOnly ? 'warning' : 'default'}
        onClick={handleLowStockToggle}
        variant={lowStockOnly ? 'filled' : 'outlined'}
        sx={{ cursor: 'pointer' }}
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
  );
};

export default ProductFilters;
