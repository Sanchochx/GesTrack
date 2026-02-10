import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Box,
  TablePagination,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  ShoppingCart as OrdersIcon,
  AddShoppingCart as NewOrderIcon,
  ToggleOn as ActivateIcon,
  ToggleOff as DeactivateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getRelativeDate } from '../../utils/dateUtils';
import CustomerCardView from './CustomerCardView';
import authService from '../../services/authService';

/**
 * CustomerTable Component
 * US-CUST-002: Customer list table with sorting, pagination, actions
 * US-CUST-006: Delete customer action for Admin
 */
const CustomerTable = ({
  customers = [],
  totalCustomers = 0,
  page,
  itemsPerPage,
  sortField,
  sortOrder,
  onPageChange,
  onItemsPerPageChange,
  onSort,
  onToggleActive,
  onDelete,  // US-CUST-006: Delete handler
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleSortClick = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    onSort(field, isAsc ? 'desc' : 'asc');
  };

  const handleRowClick = (customerId) => {
    navigate(`/customers/${customerId}`);
  };

  const handleMenuOpen = (event, customer) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomer(null);
  };

  const handleMenuAction = (action) => {
    if (!selectedCustomer) return;
    const id = selectedCustomer.id;

    switch (action) {
      case 'view':
        navigate(`/customers/${id}`);
        break;
      case 'edit':
        navigate(`/customers/${id}/edit`);
        break;
      case 'orders':
        // Placeholder - Orders module not yet built
        navigate(`/customers/${id}`);
        break;
      case 'new-order':
        // Placeholder - Orders module not yet built
        navigate(`/customers/${id}`);
        break;
      case 'toggle-active':
        onToggleActive(selectedCustomer);
        break;
      case 'delete':
        // US-CUST-006: Delete customer (Admin only)
        onDelete?.(selectedCustomer);
        break;
    }
    handleMenuClose();
  };

  const handleChangePage = (event, newPage) => {
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    onItemsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getCategoryChip = (category) => {
    const config = {
      VIP: { color: '#f9a825', bgColor: '#fff8e1' },
      Frecuente: { color: '#1565c0', bgColor: '#e3f2fd' },
      Regular: { color: '#757575', bgColor: '#f5f5f5' },
    };
    const style = config[category] || config.Regular;
    return (
      <Chip
        label={category}
        size="small"
        sx={{
          color: style.color,
          backgroundColor: style.bgColor,
          fontWeight: 600,
          fontSize: '0.7rem',
        }}
      />
    );
  };

  const columns = [
    { id: 'full_name', label: 'Nombre', sortable: true },
    { id: 'email', label: 'Email', sortable: true },
    { id: 'phone', label: 'Teléfono', sortable: false },
    { id: 'address_city', label: 'Ciudad', sortable: true },
    { id: 'total_purchases', label: 'Total Compras', sortable: false },
    { id: 'last_purchase', label: 'Última Compra', sortable: false },
    { id: 'status', label: 'Estado', sortable: false },
    { id: 'actions', label: 'Acciones', sortable: false, align: 'right' },
  ];

  if (isMobile) {
    return (
      <Box>
        <CustomerCardView
          customers={customers}
          onView={(id) => navigate(`/customers/${id}`)}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
        {customers.length > 0 && (
          <Box component={Paper} sx={{ mt: 2 }}>
            <TablePagination
              component="div"
              count={totalCustomers}
              page={page - 1}
              onPageChange={handleChangePage}
              rowsPerPage={itemsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{ fontWeight: 'bold' }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortField === column.id}
                      direction={sortField === column.id ? sortOrder : 'asc'}
                      onClick={() => handleSortClick(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Box sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No se encontraron clientes
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => {
                const lastPurchase = getRelativeDate(customer.last_purchase_date);

                return (
                  <TableRow
                    key={customer.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      opacity: customer.is_active ? 1 : 0.6,
                    }}
                    onClick={() => handleRowClick(customer.id)}
                  >
                    {/* Name + Category Badge */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {customer.full_name}
                          </Typography>
                          {getCategoryChip(customer.customer_category)}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        component="a"
                        href={`mailto:${customer.email}`}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {customer.email}
                      </Typography>
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        component="a"
                        href={`tel:${customer.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {customer.phone}
                      </Typography>
                    </TableCell>

                    {/* City */}
                    <TableCell>
                      <Typography variant="body2">
                        {customer.address_city}
                      </Typography>
                    </TableCell>

                    {/* Total Purchases */}
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatPrice(customer.total_purchases)}
                      </Typography>
                    </TableCell>

                    {/* Last Purchase */}
                    <TableCell>
                      <Tooltip title={lastPurchase.exactDate || ''}>
                        <Typography
                          variant="body2"
                          color={lastPurchase.isWarning ? 'warning.main' : 'text.secondary'}
                        >
                          {lastPurchase.text}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        label={customer.is_active ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={customer.is_active ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Ver perfil">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/customers/${customer.id}`)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Enviar email">
                        <IconButton
                          size="small"
                          color="primary"
                          component="a"
                          href={`mailto:${customer.email}`}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Llamar">
                        <IconButton
                          size="small"
                          color="primary"
                          component="a"
                          href={`tel:${customer.phone}`}
                        >
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, customer)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {customers.length > 0 && (
          <TablePagination
            component="div"
            count={totalCustomers}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={itemsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Clientes por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        )}
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleMenuAction('view')}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Ver perfil</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('orders')} disabled>
          <ListItemIcon>
            <OrdersIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText secondary="Próximamente">Historial de pedidos</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('new-order')} disabled>
          <ListItemIcon>
            <NewOrderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText secondary="Próximamente">Crear pedido</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('toggle-active')}>
          <ListItemIcon>
            {selectedCustomer?.is_active ? (
              <DeactivateIcon fontSize="small" color="warning" />
            ) : (
              <ActivateIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedCustomer?.is_active ? 'Inactivar' : 'Activar'}
          </ListItemText>
        </MenuItem>
        {/* US-CUST-006 CA-9: Delete option (Admin only) */}
        {isAdmin && (
          <>
            <Divider />
            <MenuItem
              onClick={() => handleMenuAction('delete')}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText
                primary="Eliminar"
                secondary={
                  selectedCustomer?.order_count > 0
                    ? 'Tiene pedidos asociados'
                    : null
                }
              />
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default CustomerTable;
