import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import UserList from './pages/Auth/UserList';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Profile from './pages/Profile/Profile';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import WarehouseDashboard from './pages/Dashboard/WarehouseDashboard';
import SalesDashboard from './pages/Dashboard/SalesDashboard';
import Forbidden from './pages/Errors/Forbidden';
import ProductList from './pages/Products/ProductList';
import CreateProduct from './pages/Products/CreateProduct';
import ProductDetail from './pages/Products/ProductDetail';
import EditProduct from './pages/Products/EditProduct';
import LowStockProducts from './pages/Products/LowStockProducts';  // US-PROD-008 CA-4
import Categories from './pages/Categories/Categories';
import ManualAdjustments from './pages/Inventory/ManualAdjustments';  // US-INV-002
import MovementHistory from './pages/Inventory/MovementHistory';  // US-INV-003
import CategoryInventoryView from './pages/Inventory/CategoryInventoryView';  // US-INV-006
import OutOfStockProducts from './pages/Inventory/OutOfStockProducts';  // US-INV-007
import InventoryDashboard from './pages/Inventory/InventoryDashboard';  // US-INV-010
import CustomerList from './pages/Customers/CustomerList';  // US-CUST-001
import CreateCustomer from './pages/Customers/CreateCustomer';  // US-CUST-001
import CustomerDetail from './pages/Customers/CustomerDetail';  // US-CUST-004
import EditCustomer from './pages/Customers/EditCustomer';  // US-CUST-005
import CreateOrder from './pages/Orders/CreateOrder';  // US-ORD-001
import ProtectedRoute from './components/common/ProtectedRoute';
import authService from './services/authService';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Verde oscuro estilo inventario (Material Green 800)
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

/**
 * Componente para redirigir al dashboard correcto según el rol
 * US-AUTH-005: CA-5 - Dashboard dinámico según rol
 */
function DashboardRedirect() {
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir según el rol del usuario (CA-5)
  switch (currentUser.role) {
    case 'Admin':
      return <Navigate to="/dashboard/admin" replace />;
    case 'Gerente de Almacén':
      return <Navigate to="/dashboard/warehouse" replace />;
    case 'Personal de Ventas':
      return <Navigate to="/dashboard/sales" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

/**
 * Componente de Navegación con dropdowns en cascada
 * US-AUTH-003: CA-1 - Botón de Cierre de Sesión
 * US-AUTH-004: CA-1 - Dropdown menu con acceso al perfil
 * US-AUTH-005: CA-5 - Menú dinámico según rol
 */
function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownAnchors, setDropdownAnchors] = useState({});
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const closeTimers = useRef({});

  // Actualizar estado de autenticación cuando cambie la ruta
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    if (authService.isAuthenticated()) {
      setCurrentUser(authService.getCurrentUser());
    }
  }, [location.pathname]);

  // Limpiar timers al desmontar
  useEffect(() => {
    const timers = closeTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  // --- Handlers para dropdowns con soporte hover ---
  const openDropdown = (id, event) => {
    clearTimeout(closeTimers.current[id]);
    setDropdownAnchors(prev => ({ ...prev, [id]: event.currentTarget }));
  };

  const scheduleCloseDropdown = (id) => {
    closeTimers.current[id] = setTimeout(() => {
      setDropdownAnchors(prev => ({ ...prev, [id]: null }));
    }, 150);
  };

  const cancelCloseDropdown = (id) => {
    clearTimeout(closeTimers.current[id]);
  };

  const navigateTo = (path, closeId) => {
    setDropdownAnchors(prev => ({ ...prev, [closeId]: null }));
    navigate(path);
  };

  // --- Handlers para menú de usuario ---
  const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate('/profile');
  };

  /**
   * US-AUTH-003: CA-1, CA-2, CA-3 - Función de logout
   */
  const handleLogout = () => {
    handleUserMenuClose();
    authService.logout();
    navigate('/login', { replace: true, state: { message: 'Has cerrado sesión correctamente' } });
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Verifica si alguna ruta del grupo está activa
  const isGroupActive = (paths) =>
    paths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  // --- Configuración de grupos de navegación ---
  const NAV_GROUPS = [
    {
      id: 'inventario',
      label: 'Inventario',
      roles: ['Admin', 'Gerente de Almacén'],
      paths: ['/products', '/categories', '/inventory/out-of-stock', '/inventory/by-category'],
      items: [
        { label: 'Productos', path: '/products' },
        { label: 'Categorías', path: '/categories' },
        { label: 'Stock Bajo', path: '/products/low-stock', sx: { color: 'warning.main' } },
        { label: 'Sin Stock', path: '/inventory/out-of-stock', sx: { color: 'error.main' } },
        { label: 'Por Categoría', path: '/inventory/by-category' },
      ],
    },
    {
      id: 'movimientos',
      label: 'Movimientos',
      roles: ['Admin', 'Gerente de Almacén'],
      paths: ['/inventory/adjustments', '/inventory/history'],
      items: [
        { label: 'Ajustes', path: '/inventory/adjustments' },
        { label: 'Historial', path: '/inventory/history' },
      ],
    },
    {
      id: 'ventas',
      label: 'Ventas',
      roles: ['Admin', 'Personal de Ventas', 'Gerente de Almacén'],
      paths: ['/customers', '/orders'],
      items: [
        { label: 'Clientes', path: '/customers' },
        { label: 'Nuevo Pedido', path: '/orders/new' },
      ],
    },
    {
      id: 'administracion',
      label: 'Administración',
      roles: ['Admin'],
      paths: ['/users'],
      items: [
        { label: 'Usuarios', path: '/users' },
      ],
    },
  ];

  const visibleGroups = NAV_GROUPS.filter(
    g => currentUser && g.roles.includes(currentUser.role)
  );

  // Estilos para botón activo / inactivo en desktop
  const activeBtnSx = { borderBottom: '2px solid white', borderRadius: 0, pb: '4px' };
  const inactiveBtnSx = { borderBottom: '2px solid transparent', borderRadius: 0, pb: '4px' };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          GesTrack - Sistema de Gestión
        </Typography>

        {!isAuthenticated ? (
          // No autenticado: botones de login/registro
          <>
            <Button color="inherit" href="/login" sx={{ '&:hover': { color: '#a5d6a7' } }}>
              Iniciar Sesión
            </Button>
            <Button color="inherit" href="/register" sx={{ '&:hover': { color: '#a5d6a7' } }}>
              Nuevo Usuario
            </Button>
          </>
        ) : (
          // Autenticado: navegación completa
          <>
            {/* ── MOBILE: icono hamburguesa + drawer lateral ── */}
            {isMobile && (
              <>
                <IconButton color="inherit" onClick={() => setDrawerOpen(true)} aria-label="abrir menú">
                  <MenuIcon />
                </IconButton>

                <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                  <Box sx={{ width: 280, bgcolor: '#2e7d32', minHeight: '100%', color: 'white' }}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6">GesTrack</Typography>
                    </Box>
                    <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />

                    {/* Inicio */}
                    <List disablePadding>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => { navigate('/dashboard'); setDrawerOpen(false); }}
                          selected={location.pathname.startsWith('/dashboard')}
                          sx={{
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                            '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' },
                          }}
                        >
                          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                            <HomeIcon />
                          </ListItemIcon>
                          <ListItemText primary="Inicio" />
                        </ListItemButton>
                      </ListItem>
                    </List>

                    {/* Grupos de navegación como acordeones */}
                    {visibleGroups.map(group => (
                      <Accordion
                        key={group.id}
                        expanded={expandedAccordion === group.id}
                        onChange={(_, expanded) =>
                          setExpandedAccordion(expanded ? group.id : null)
                        }
                        disableGutters
                        elevation={0}
                        sx={{
                          bgcolor: 'transparent',
                          color: 'white',
                          '&:before': { display: 'none' },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                          sx={{
                            bgcolor: isGroupActive(group.paths)
                              ? 'rgba(255,255,255,0.15)'
                              : 'transparent',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                            color: 'white',
                          }}
                        >
                          <Typography>{group.label}</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                          <List disablePadding>
                            {group.items.map(item => (
                              <ListItem key={item.path} disablePadding>
                                <ListItemButton
                                  onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                                  selected={
                                    location.pathname === item.path ||
                                    location.pathname.startsWith(item.path + '/')
                                  }
                                  sx={{
                                    pl: 4,
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' },
                                    ...item.sx,
                                  }}
                                >
                                  <ListItemText primary={item.label} />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </Drawer>
              </>
            )}

            {/* ── DESKTOP: botones inline con dropdowns ── */}
            {!isMobile && (
              <>
                {/* Inicio – link directo */}
                <Button
                  color="inherit"
                  startIcon={<HomeIcon />}
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    '&:hover': { color: '#a5d6a7' },
                    ...(location.pathname.startsWith('/dashboard') ? activeBtnSx : inactiveBtnSx),
                  }}
                >
                  Inicio
                </Button>

                {/* Grupos con dropdown */}
                {visibleGroups.map(group => (
                  <Box
                    key={group.id}
                    sx={{ display: 'inline-flex' }}
                    onMouseEnter={(e) => openDropdown(group.id, e)}
                    onMouseLeave={() => scheduleCloseDropdown(group.id)}
                  >
                    <Button
                      color="inherit"
                      endIcon={
                        <ExpandMoreIcon
                          sx={{
                            transform: Boolean(dropdownAnchors[group.id])
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                          }}
                        />
                      }
                      onClick={() => {
                        if (Boolean(dropdownAnchors[group.id])) {
                          setDropdownAnchors(prev => ({ ...prev, [group.id]: null }));
                        }
                      }}
                      sx={{
                        '&:hover': { color: '#a5d6a7' },
                        ...(isGroupActive(group.paths) ? activeBtnSx : inactiveBtnSx),
                      }}
                    >
                      {group.label}
                    </Button>
                    <Menu
                      anchorEl={dropdownAnchors[group.id]}
                      open={Boolean(dropdownAnchors[group.id])}
                      onClose={() =>
                        setDropdownAnchors(prev => ({ ...prev, [group.id]: null }))
                      }
                      MenuListProps={{
                        onMouseEnter: () => cancelCloseDropdown(group.id),
                        onMouseLeave: () => scheduleCloseDropdown(group.id),
                      }}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      disableAutoFocusItem
                      disableScrollLock
                    >
                      {group.items.map(item => (
                        <MenuItem
                          key={item.path}
                          onClick={() => navigateTo(item.path, group.id)}
                          selected={
                            location.pathname === item.path ||
                            location.pathname.startsWith(item.path + '/')
                          }
                          sx={item.sx}
                        >
                          {item.label}
                        </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                ))}
              </>
            )}

            {/* US-AUTH-004: CA-1 - Icono de cuenta (desktop y mobile) */}
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              size="large"
              aria-label="menú de usuario"
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              disableScrollLock
            >
              {currentUser && (
                <MenuItem disabled sx={{ opacity: '1 !important' }}>
                  <Typography variant="body2" color="text.secondary">
                    {currentUser.full_name}
                  </Typography>
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Mi Perfil
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ flexGrow: 1 }}>
          <Navigation />

          <Box>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* US-AUTH-006: Rutas de recuperación de contraseña */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* US-AUTH-005: CA-6 - Página de error 403 */}
              <Route path="/forbidden" element={<Forbidden />} />

              {/* US-AUTH-003: CA-4 - Rutas Protegidas */}
              {/* US-AUTH-005: CA-2 - Solo Admin puede ver lista de usuarios */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <UserList />
                  </ProtectedRoute>
                }
              />

              {/* US-AUTH-004: Ruta del Perfil de Usuario */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* US-AUTH-005: CA-5 - Dashboard dinámico según rol */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                }
              />

              {/* US-AUTH-005: CA-2 - Dashboards protegidos por rol */}
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/warehouse"
                element={
                  <ProtectedRoute allowedRoles={['Gerente de Almacén']}>
                    <WarehouseDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/sales"
                element={
                  <ProtectedRoute allowedRoles={['Personal de Ventas']}>
                    <SalesDashboard />
                  </ProtectedRoute>
                }
              />

              {/* US-PROD-001: Product Management Routes */}
              <Route
                path="/products"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <ProductList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/new"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <CreateProduct />
                  </ProtectedRoute>
                }
              />
              {/* US-PROD-008 CA-4: Low Stock Products Route */}
              <Route
                path="/products/low-stock"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <LowStockProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <EditProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/:id"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <ProductDetail />
                  </ProtectedRoute>
                }
              />

              {/* US-INV-002: Manual Inventory Adjustments Route */}
              <Route
                path="/inventory/adjustments"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <ManualAdjustments />
                  </ProtectedRoute>
                }
              />

              {/* US-INV-003: Movement History Route */}
              <Route
                path="/inventory/history"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <MovementHistory />
                  </ProtectedRoute>
                }
              />

              {/* US-INV-006: Category Inventory View Route */}
              <Route
                path="/inventory/by-category"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <CategoryInventoryView />
                  </ProtectedRoute>
                }
              />

              {/* US-INV-007: Out of Stock Products Route */}
              <Route
                path="/inventory/out-of-stock"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <OutOfStockProducts />
                  </ProtectedRoute>
                }
              />

              {/* US-INV-010: Inventory Dashboard Route */}
              <Route
                path="/inventory/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <InventoryDashboard />
                  </ProtectedRoute>
                }
              />

              {/* US-CUST-001: Customer Management Routes */}
              <Route
                path="/customers"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}>
                    <CustomerList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers/new"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}>
                    <CreateCustomer />
                  </ProtectedRoute>
                }
              />
              {/* US-CUST-004: Customer Detail/Profile Route */}
              <Route
                path="/customers/:id"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}>
                    <CustomerDetail />
                  </ProtectedRoute>
                }
              />
              {/* US-CUST-005: Edit Customer Route */}
              <Route
                path="/customers/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}>
                    <EditCustomer />
                  </ProtectedRoute>
                }
              />

              {/* US-ORD-001: Order Management Routes */}
              <Route
                path="/orders/new"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}>
                    <CreateOrder />
                  </ProtectedRoute>
                }
              />

              {/* US-PROD-007: Category Management Routes */}
              <Route
                path="/categories"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}>
                    <Categories />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
