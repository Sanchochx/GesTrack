import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Box,
  Chip,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationCity as CityIcon,
  ShoppingCart as OrdersIcon,
  AddShoppingCart as NewOrderIcon,
  ToggleOn as ActivateIcon,
  ToggleOff as DeactivateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

/**
 * CustomerCardView - Mobile card grid for customers
 * US-CUST-002 CA-1: Responsive card view
 * US-CUST-006: Delete customer action for Admin
 */
const CustomerCardView = ({
  customers = [],
  onView,
  onToggleActive,
  onDelete,  // US-CUST-006: Delete handler
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';

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

  if (customers.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="h6">No hay clientes para mostrar</Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {customers.map((customer) => (
          <Grid item xs={12} sm={6} md={4} key={customer.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: customer.is_active ? 1 : 0.6,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
              onClick={() => onView && onView(customer.id)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Header: Name + Menu */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 200,
                      }}
                    >
                      {customer.nombre_razon_social}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {getCategoryChip(customer.customer_category)}
                      <Chip
                        label={customer.is_active ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={customer.is_active ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, customer)}
                    sx={{ mt: -1, mr: -1 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Contact Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography
                    variant="body2"
                    component="a"
                    href={`mailto:${customer.correo}`}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {customer.correo}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography
                    variant="body2"
                    component="a"
                    href={`tel:${customer.telefono_movil}`}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {customer.telefono_movil || '—'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CityIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {customer.municipio_ciudad || '—'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
        <MenuItem disabled>
          <ListItemIcon>
            <OrdersIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText secondary="Próximamente">Historial de pedidos</ListItemText>
        </MenuItem>
        <MenuItem disabled>
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

export default CustomerCardView;
