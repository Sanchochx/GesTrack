import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Home as HomeIcon,
  LocalShipping as SuppliersIcon,
  PersonAdd as AddIcon,
  AddShoppingCart as AddOrderIcon,
} from '@mui/icons-material';
import supplierService from '../../services/supplierService';
import SupplierTable from '../../components/suppliers/SupplierTable';

/**
 * SupplierList Page
 * US-SUPP-002: Listar Proveedores
 *
 * - CA-1: Tabla con nombre, contacto, teléfono, email, categorías, órdenes activas
 * - CA-2: Paginación (20 por página)
 * - CA-3: Ordenamiento por nombre y fecha de registro
 * - CA-4: Indicador de órdenes de compra pendientes (en SupplierTable)
 * - CA-5: Botón para agregar nuevo proveedor
 * - CA-6: Total de proveedores registrados
 */
const SupplierList = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [sortField, setSortField] = useState('company_name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    loadSuppliers();
  }, [page, itemsPerPage, sortField, sortOrder]);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await supplierService.getSuppliers({
        page,
        per_page: itemsPerPage,
        sort_by: sortField,
        order: sortOrder,
      });

      if (response.success) {
        setSuppliers(response.data || []);
        setTotalSuppliers(response.pagination?.total || 0);
      } else {
        setError(response.error?.message || 'Error al cargar proveedores');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => setPage(newPage);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setPage(1);
  };

  const handleSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  };

  const handleSortFieldChange = (event) => {
    setSortField(event.target.value);
    setPage(1);
  };

  return (
    <Container maxWidth="xl" sx={{ p: 3, mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate('/dashboard')}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Inicio
        </Link>
        <Typography sx={{ display: 'flex', alignItems: 'center' }} color="text.primary">
          <SuppliersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Proveedores
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Proveedores
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión de proveedores
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddOrderIcon />}
            onClick={() => navigate('/purchase-orders')}
          >
            Órdenes de Compra
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/suppliers/new')}
          >
            Nuevo Proveedor
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results counter + sort-by field selector (fecha de registro no es columna visible) */}
      {!loading && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Se encontraron {totalSuppliers} proveedores
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="supplier-sort-label">Ordenar por</InputLabel>
            <Select
              labelId="supplier-sort-label"
              value={sortField}
              label="Ordenar por"
              onChange={handleSortFieldChange}
            >
              <MenuItem value="company_name">Nombre</MenuItem>
              <MenuItem value="created_at">Fecha de registro</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <SupplierTable
          suppliers={suppliers}
          totalSuppliers={totalSuppliers}
          page={page}
          itemsPerPage={itemsPerPage}
          sortField={sortField}
          sortOrder={sortOrder}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onSort={handleSort}
        />
      )}
    </Container>
  );
};

export default SupplierList;
