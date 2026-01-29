/**
 * US-INV-006: Vista de Inventario por Categoría
 *
 * Página principal para visualizar inventario agrupado por categorías
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon
} from '@mui/icons-material';
import authService from '../../services/authService';
import inventoryService from '../../services/inventoryService';
import CategoryInventorySummary from '../../components/inventory/CategoryInventorySummary';
import CategoryInventoryFilters from '../../components/inventory/CategoryInventoryFilters';
import CategoryRow from '../../components/inventory/CategoryRow';

/**
 * Página de vista de inventario por categoría
 */
const CategoryInventoryView = () => {
  const navigate = useNavigate();

  // State
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
    hasLowStock: false,
    hasOutOfStock: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // CA-2: Load expanded state from localStorage on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'Admin' && currentUser.role !== 'Gerente de Almacén') {
      navigate('/dashboard');
      return;
    }

    const saved = localStorage.getItem('expandedCategories');
    if (saved) {
      try {
        const parsedExpanded = JSON.parse(saved);
        setExpandedCategories(parsedExpanded);
      } catch (err) {
        console.error('Error parsing expanded categories from localStorage:', err);
      }
    }
  }, [navigate]);

  // CA-2: Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('expandedCategories', JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [filters]);

  // Fetch categories and metrics
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories and metrics in parallel
      const [categoriesResponse, metricsResponse] = await Promise.all([
        inventoryService.getCategoriesInventory(filters),
        inventoryService.getCategoryInventoryMetrics()
      ]);

      setCategories(categoriesResponse.data || []);
      setMetrics(metricsResponse.data || null);
    } catch (err) {
      console.error('Error fetching category inventory:', err);
      setError(err.error?.message || 'Error al cargar datos de inventario');
    } finally {
      setLoading(false);
    }
  };

  // CA-2: Toggle category expansion
  const handleToggleCategory = async (categoryId) => {
    if (expandedCategories.includes(categoryId)) {
      // Collapse
      setExpandedCategories(prev => prev.filter(id => id !== categoryId));
    } else {
      // Expand - fetch products if not already loaded
      if (!categoryProducts[categoryId]) {
        try {
          setLoadingProducts(prev => ({ ...prev, [categoryId]: true }));

          const response = await inventoryService.getCategoryProducts(categoryId);
          setCategoryProducts(prev => ({
            ...prev,
            [categoryId]: response.data
          }));
        } catch (err) {
          console.error('Error fetching category products:', err);
          showSnackbar(err.error?.message || 'Error al cargar productos', 'error');
        } finally {
          setLoadingProducts(prev => ({ ...prev, [categoryId]: false }));
        }
      }

      setExpandedCategories(prev => [...prev, categoryId]);
    }
  };

  // CA-2: Expand all categories
  const handleExpandAll = async () => {
    const allCategoryIds = categories.map(cat => cat.category_id);

    // Fetch products for categories that don't have them loaded
    const fetchPromises = categories
      .filter(cat => !categoryProducts[cat.category_id])
      .map(async (cat) => {
        try {
          const response = await inventoryService.getCategoryProducts(cat.category_id);
          return { id: cat.category_id, data: response.data };
        } catch (err) {
          console.error(`Error fetching products for category ${cat.category_id}:`, err);
          return null;
        }
      });

    const results = await Promise.all(fetchPromises);

    // Update categoryProducts with fetched data
    const newProducts = { ...categoryProducts };
    results.forEach(result => {
      if (result) {
        newProducts[result.id] = result.data;
      }
    });
    setCategoryProducts(newProducts);

    // Expand all
    setExpandedCategories(allCategoryIds);
  };

  // CA-2: Collapse all categories
  const handleCollapseAll = () => {
    setExpandedCategories([]);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // CA-7: Handle export category
  const handleExportCategory = async (categoryId, categoryName) => {
    try {
      await inventoryService.exportCategoryProducts(categoryId);
      showSnackbar(`Categoría "${categoryName}" exportada exitosamente`, 'success');
    } catch (err) {
      console.error('Error exporting category:', err);
      showSnackbar(err.error?.message || 'Error al exportar categoría', 'error');
    }
  };

  // Snackbar helper
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: 3, mt: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Inventario por Categoría
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vista organizada del inventario agrupado por categorías
          </Typography>
        </Box>

        {/* Error alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* CA-6: Summary Panel */}
        {!loading && <CategoryInventorySummary metrics={metrics} loading={loading} />}

        {/* CA-4: Filters */}
        <CategoryInventoryFilters filters={filters} onFiltersChange={handleFiltersChange} />

        {/* CA-2: Expand/Collapse All Buttons */}
        {!loading && categories.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UnfoldMoreIcon />}
              onClick={handleExpandAll}
            >
              Expandir Todas ({categories.length})
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UnfoldLessIcon />}
              onClick={handleCollapseAll}
              disabled={expandedCategories.length === 0}
            >
              Colapsar Todas
            </Button>
          </Box>
        )}

        {/* Loading state */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : categories.length === 0 ? (
          /* Empty state */
          <Box sx={{ textAlign: 'center', p: 5 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No se encontraron categorías
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.search || filters.hasLowStock || filters.hasOutOfStock
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Crea una categoría para comenzar'}
            </Typography>
          </Box>
        ) : (
          /* CA-1, CA-2, CA-3: Category List */
          <Box>
            {categories.map((category) => (
              <CategoryRow
                key={category.category_id}
                category={category}
                expanded={expandedCategories.includes(category.category_id)}
                products={categoryProducts[category.category_id]}
                loading={loadingProducts[category.category_id]}
                onToggle={() => handleToggleCategory(category.category_id)}
                onExport={handleExportCategory}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CategoryInventoryView;
