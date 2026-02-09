import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Home as HomeIcon,
  People as CustomersIcon,
  PersonAdd as AddIcon,
} from '@mui/icons-material';
import customerService from '../../services/customerService';
import CustomerStats from '../../components/customers/CustomerStats';
import CustomerFilters from '../../components/customers/CustomerFilters';
import CustomerTable from '../../components/customers/CustomerTable';
import CustomerEmptyState from '../../components/customers/CustomerEmptyState';

/**
 * CustomerList Page
 * US-CUST-002: Listar Clientes
 *
 * Complete customer listing with:
 * - CA-1: Table/card responsive layout
 * - CA-2: Search by name, email, phone
 * - CA-3: Sortable columns
 * - CA-4: Show/hide inactive toggle
 * - CA-5: Pagination (10/20/50/100)
 * - CA-6: New customer button
 * - CA-7: Statistics cards
 * - CA-8: Quick actions (view, email, phone, toggle active)
 * - CA-9: Last purchase relative date
 * - CA-10: Empty states
 */
const CustomerList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL params
  const getInitialSearch = () => searchParams.get('search') || '';
  const getInitialShowInactive = () => searchParams.get('show_inactive') === 'true';
  const getInitialPage = () => parseInt(searchParams.get('page') || '1', 10);

  // Data state
  const [customers, setCustomers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(getInitialPage());
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter state
  const [searchTerm, setSearchTerm] = useState(getInitialSearch());
  const [showInactive, setShowInactive] = useState(getInitialShowInactive());

  // Sort state
  const [sortField, setSortField] = useState('full_name');
  const [sortOrder, setSortOrder] = useState('asc');

  // UI state
  const [successMessage, setSuccessMessage] = useState(null);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (showInactive) params.set('show_inactive', 'true');
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [searchTerm, showInactive, page, setSearchParams]);

  // Load customers when filters/pagination/sort changes
  useEffect(() => {
    loadCustomers();
  }, [page, itemsPerPage, searchTerm, showInactive, sortField, sortOrder]);

  // Show success message from navigation state (e.g. after creating customer)
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: itemsPerPage,
        sort_by: sortField,
        order: sortOrder,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      // Only show active by default; show all when toggle is on
      if (!showInactive) {
        params.is_active = 'true';
      }

      const response = await customerService.getCustomers(params);

      if (response.success) {
        setCustomers(response.data || []);
        setStatistics(response.statistics || {});
        setTotalCustomers(response.pagination?.total || 0);
      } else {
        setError(response.error?.message || 'Error al cargar clientes');
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err.error?.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setPage(1);
  }, []);

  const handleShowInactiveChange = useCallback((value) => {
    setShowInactive(value);
    setPage(1);
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setPage(1);
  };

  const handleSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  };

  const handleToggleActive = async (customer) => {
    try {
      const response = await customerService.toggleActive(customer.id);
      if (response.success) {
        setSuccessMessage(response.message);
        loadCustomers();
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cambiar estado del cliente');
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setShowInactive(false);
    setPage(1);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  const hasActiveFilters = searchTerm || showInactive;

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
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <CustomersIcon sx={{ mr: 0.5 }} fontSize="small" />
          Clientes
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Clientes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión de clientes
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/customers/new')}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {!loading && <CustomerStats statistics={statistics} />}

      {/* Filters */}
      <CustomerFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        showInactive={showInactive}
        onShowInactiveChange={handleShowInactiveChange}
      />

      {/* Results Counter */}
      {!loading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {hasActiveFilters ? (
              `${totalCustomers} de ${statistics.total || 0} clientes`
            ) : (
              `Se encontraron ${totalCustomers} clientes`
            )}
          </Typography>
        </Box>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : customers.length === 0 ? (
        /* Empty State - US-CUST-003 CA-9: Pass searchTerm for display */
        <CustomerEmptyState
          isFilteredEmpty={hasActiveFilters}
          onClearFilters={handleClearAllFilters}
          searchTerm={searchTerm}
        />
      ) : (
        /* Customer Table / Card View */
        <CustomerTable
          customers={customers}
          totalCustomers={totalCustomers}
          page={page}
          itemsPerPage={itemsPerPage}
          sortField={sortField}
          sortOrder={sortOrder}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onSort={handleSort}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CustomerList;
