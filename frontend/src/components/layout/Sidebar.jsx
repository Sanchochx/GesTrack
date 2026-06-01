import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Button, Divider } from '@mui/material';
import {
  Inventory2 as InventoryIcon,
  SwapHoriz as MovementsIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  Category as ProductsIcon,
  Settings as AdminIcon,
  Download as DownloadIcon,
  HelpOutline as HelpIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import inventoryService from '../../services/inventoryService';
import gesTrackLogo from '../../assets/GesTrack Logo 2.png';

const NAV_ITEMS = [
  { label: 'Inicio', icon: HomeIcon, path: '/dashboard', roles: ['Admin', 'Gerente de Almacén', 'Personal de Ventas'] },
  { label: 'Inventario', icon: InventoryIcon, path: '/inventory/dashboard', roles: ['Admin', 'Gerente de Almacén'] },
  { label: 'Movimientos', icon: MovementsIcon, path: '/inventory/history', roles: ['Admin', 'Gerente de Almacén'] },
  { label: 'Pedidos', icon: OrdersIcon, path: '/orders', roles: ['Admin', 'Gerente de Almacén', 'Personal de Ventas'] },
  { label: 'Clientes', icon: CustomersIcon, path: '/customers', roles: ['Admin', 'Gerente de Almacén', 'Personal de Ventas'] },
  { label: 'Productos', icon: ProductsIcon, path: '/products', roles: ['Admin', 'Gerente de Almacén'] },
  { label: 'Administración', icon: AdminIcon, path: '/users', roles: ['Admin'] },
];

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  const handleExport = async () => {
    try {
      await inventoryService.exportValueReport('excel', '30d');
    } catch {
      // silent — error visible in export dialog
    }
  };

  const showExportBtn = user?.role === 'Admin' || user?.role === 'Gerente de Almacén';

  return (
    <Box
      component="aside"
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: 256,
        bgcolor: '#eff4ff',
        borderRight: '1px solid #bccac0',
        display: 'flex',
        flexDirection: 'column',
        py: 3,
        zIndex: 50,
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#bccac0', borderRadius: 10 },
      }}
    >
      {/* Branding */}
      <Box sx={{ px: 3, mb: 6 }}>
        <img
          src={gesTrackLogo}
          alt="GesTrack"
          onClick={() => navigate('/dashboard')}
          style={{ height: 52, display: 'block', marginBottom: 4, cursor: 'pointer' }}
        />
        <Typography
          sx={{ fontSize: 11, color: '#3d4a42', opacity: 0.7, fontFamily: 'Inter', letterSpacing: '0.02em' }}
        >
          Sistema de Gestión
        </Typography>
      </Box>

      {/* Navigation items */}
      <List disablePadding sx={{ flex: 1, px: 2 }}>
        {visibleItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '8px',
                  px: 2,
                  py: 1.5,
                  color: active ? '#006948' : '#3d4a42',
                  bgcolor: active ? 'rgba(0,105,72,0.08)' : 'transparent',
                  borderRight: active ? '4px solid #006948' : '4px solid transparent',
                  transition: 'background 200ms',
                  '&:hover': { bgcolor: '#dce9ff' },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                  <Icon sx={{ fontSize: 22 }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: active ? 700 : 400,
                    fontFamily: 'Inter',
                    color: 'inherit',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom section */}
      <Box sx={{ px: 2, pt: 2, mt: 2, borderTop: '1px solid #bccac0' }}>
        {showExportBtn && (
          <Button
            fullWidth
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{
              mb: 1.5,
              borderRadius: '8px',
              bgcolor: '#006948',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
              '&:hover': { bgcolor: '#00855d' },
            }}
          >
            Exportar Datos
          </Button>
        )}

        <ListItemButton
          component="a"
          href="#"
          sx={{ borderRadius: '8px', px: 2, py: 1, color: '#3d4a42', '&:hover': { bgcolor: '#dce9ff' } }}
        >
          <HelpIcon sx={{ mr: 2, fontSize: 20 }} />
          <ListItemText primary="Soporte" primaryTypographyProps={{ fontSize: 14, fontFamily: 'Inter' }} />
        </ListItemButton>

        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: '8px', px: 2, py: 1, color: '#3d4a42', '&:hover': { bgcolor: '#dce9ff' } }}
        >
          <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
          <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ fontSize: 14, fontFamily: 'Inter' }} />
        </ListItemButton>
      </Box>
    </Box>
  );
};

export default Sidebar;
