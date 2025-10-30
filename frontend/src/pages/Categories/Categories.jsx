import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import categoryService from '../../services/categoryService';
import CategoryDialog from '../../components/categories/CategoryDialog';
import DeleteCategoryDialog from '../../components/categories/DeleteCategoryDialog';

/**
 * Categories Page Component
 * US-PROD-007: Manage Categories
 *
 * Main page for category management with:
 * - Table view of all categories (CA-1)
 * - Product count per category (CA-6)
 * - Create, edit, delete actions (CA-2, CA-3, CA-4)
 * - Search and filter functionality (CA-9)
 * - Color and icon visualization (CA-8)
 * - Default category indication (CA-7)
 */
const Categories = () => {
  // Data state
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories when search term changes
  useEffect(() => {
    filterCategories();
  }, [searchTerm, categories]);

  /**
   * Load categories from API
   * US-PROD-007 - CA-1: List all categories
   */
  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await categoryService.getCategories();

      if (response.success) {
        setCategories(response.data || []);
      } else {
        setError(response.error?.message || 'Error al cargar categorías');
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err.error?.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter categories by search term
   * US-PROD-007 - CA-9: Search and filter
   */
  const filterCategories = () => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        (category.description && category.description.toLowerCase().includes(term))
    );

    setFilteredCategories(filtered);
  };

  /**
   * Handle create new category
   * US-PROD-007 - CA-2: Create category
   */
  const handleCreate = () => {
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  /**
   * Handle edit category
   * US-PROD-007 - CA-3: Edit category
   */
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  /**
   * Handle delete category
   * US-PROD-007 - CA-4: Delete category
   */
  const handleDelete = (category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  /**
   * Handle successful category save
   */
  const handleSaveSuccess = () => {
    loadCategories();
  };

  /**
   * Handle successful category deletion
   */
  const handleDeleteSuccess = () => {
    loadCategories();
  };

  /**
   * Calculate statistics
   */
  const statistics = {
    total: categories.length,
    withProducts: categories.filter((c) => c.product_count > 0).length,
    empty: categories.filter((c) => c.product_count === 0).length,
    totalProducts: categories.reduce((sum, c) => sum + (c.product_count || 0), 0),
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestión de Categorías
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra las categorías de productos del sistema
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total de Categorías
              </Typography>
              <Typography variant="h4">{statistics.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Con Productos
              </Typography>
              <Typography variant="h4">{statistics.withProducts}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Vacías
              </Typography>
              <Typography variant="h4">{statistics.empty}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total de Productos
              </Typography>
              <Typography variant="h4">{statistics.totalProducts}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Toolbar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Buscar categorías..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Nueva Categoría
        </Button>
      </Box>

      {/* Categories Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredCategories.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CategoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'No se encontraron categorías' : 'No hay categorías registradas'}
            </Typography>
            {!searchTerm && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Comienza creando tu primera categoría
              </Typography>
            )}
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50">Color</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="center" width="120">
                  Productos
                </TableCell>
                <TableCell align="center" width="100">
                  Estado
                </TableCell>
                <TableCell align="right" width="150">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow
                  key={category.id}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  <TableCell>
                    <Tooltip title={category.color || '#2196F3'}>
                      <CircleIcon
                        sx={{
                          color: category.color || '#2196F3',
                          fontSize: 24,
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {category.name}
                      </Typography>
                      {category.is_default && (
                        <Chip
                          label="Predeterminada"
                          size="small"
                          color="primary"
                          icon={<CheckCircleIcon />}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {category.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={category.product_count || 0}
                      size="small"
                      color={category.product_count > 0 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {category.product_count === 0 ? (
                      <Chip label="Vacía" size="small" variant="outlined" />
                    ) : (
                      <Chip label="Activa" size="small" color="success" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(category)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(category)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Dialogs */}
      <CategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        category={selectedCategory}
        onSuccess={handleSaveSuccess}
      />

      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        category={selectedCategory}
        onSuccess={handleDeleteSuccess}
      />
    </Container>
  );
};

export default Categories;
