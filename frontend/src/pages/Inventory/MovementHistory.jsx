import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Home as HomeIcon,
  Inventory as InventoryIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  KeyboardArrowDown as ArrowDownIcon,
  TableChart as CsvIcon,
  InsertDriveFile as ExcelIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import MovementHistoryTable from '../../components/inventory/MovementHistoryTable';
import MovementFilters from '../../components/inventory/MovementFilters';
import MovementDetailsModal from '../../components/inventory/MovementDetailsModal';
import inventoryService from '../../services/inventoryService';
import productService from '../../services/productService';
import authService from '../../services/authService';
import categoryService from '../../services/categoryService';

/**
 * US-INV-003: Movement History Page
 *
 * Página principal de historial de movimientos de inventario
 * - CA-1: Vista general con tabla y paginación
 * - CA-3: Filtros avanzados
 * - CA-5: Modal de detalles
 * - CA-6: Exportación CSV/Excel
 */

const MovementHistory = () => {
  // Estado de datos
  const [movements, setMovements] = useState([]);
  const [totalMovements, setTotalMovements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado de paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Estado de filtros
  const [filters, setFilters] = useState({});

  // Datos para filtros
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Modal de detalles
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Menu de exportación
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Cargar datos iniciales para filtros
  useEffect(() => {
    loadFilterData();
  }, []);

  // Cargar movimientos cuando cambien filtros o paginación
  useEffect(() => {
    loadMovements();
  }, [filters, page, rowsPerPage]);

  const loadFilterData = async () => {
    try {
      setLoadingFilters(true);

      // Cargar productos, usuarios y categorías en paralelo
      const [productsRes, usersRes, categoriesRes] = await Promise.all([
        productService.getAllProducts({ per_page: 1000 }),
        authService.getAllUsers(),
        categoryService.getAllCategories()
      ]);

      if (productsRes.success) {
        setProducts(productsRes.data.products || []);
      }
      if (usersRes.success) {
        setUsers(usersRes.data || []);
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.data || []);
      }
    } catch (err) {
      console.error('Error loading filter data:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await inventoryService.getMovements({
        ...filters,
        page: page + 1, // Backend usa páginas desde 1
        per_page: rowsPerPage
      });

      if (response.success) {
        setMovements(response.data.movements || []);
        setTotalMovements(response.data.total || 0);
      } else {
        setError(response.error?.message || 'Error al cargar movimientos');
      }
    } catch (err) {
      console.error('Error loading movements:', err);
      setError(err.error?.message || 'Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de página
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Manejar cambio de filtros
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset a primera página
  };

  // Manejar click en fila
  const handleRowClick = (movement) => {
    setSelectedMovement(movement);
    setDetailsModalOpen(true);
  };

  // Cerrar modal de detalles
  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedMovement(null);
  };

  // Abrir menú de exportación
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  // Cerrar menú de exportación
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  // Exportar movimientos
  const handleExport = async (format) => {
    try {
      setExporting(true);
      handleExportMenuClose();

      await inventoryService.exportMovements(filters, format);

      // Mensaje de éxito podría agregarse aquí
    } catch (err) {
      console.error('Error exporting movements:', err);
      setError('Error al exportar archivo');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Inicio
        </Link>
        <Link
          component={RouterLink}
          to="/inventory/adjustments"
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
        >
          <InventoryIcon sx={{ mr: 0.5 }} fontSize="small" />
          Inventario
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 0.5 }} fontSize="small" />
          Historial de Movimientos
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Historial de Movimientos de Inventario
        </Typography>

        {/* Botón de Exportación */}
        <Box>
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            endIcon={!exporting && <ArrowDownIcon />}
            onClick={handleExportMenuOpen}
            disabled={exporting || movements.length === 0}
          >
            {exporting ? 'Exportando...' : 'Exportar'}
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportMenuClose}
          >
            <MenuItem onClick={() => handleExport('csv')}>
              <ListItemIcon>
                <CsvIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Exportar como CSV</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExport('excel')}>
              <ListItemIcon>
                <ExcelIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Exportar como Excel</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Estadísticas resumidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total de Movimientos
              </Typography>
              <Typography variant="h4">
                {totalMovements.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Página Actual
              </Typography>
              <Typography variant="h4">
                {page + 1} de {Math.ceil(totalMovements / rowsPerPage) || 1}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Registros en Página
              </Typography>
              <Typography variant="h4">
                {movements.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Filtros Activos
              </Typography>
              <Typography variant="h4">
                {Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <MovementFilters
        onFilterChange={handleFilterChange}
        products={products}
        users={users}
        categories={categories}
        loadingProducts={loadingFilters}
        loadingUsers={loadingFilters}
        loadingCategories={loadingFilters}
      />

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabla de Movimientos */}
      <MovementHistoryTable
        movements={movements}
        totalMovements={totalMovements}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onRowClick={handleRowClick}
        loading={loading}
      />

      {/* Modal de Detalles */}
      <MovementDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        movement={selectedMovement}
      />
    </Container>
  );
};

export default MovementHistory;
