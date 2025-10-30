import { useState, useEffect } from 'react';
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
  ListItemIcon
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
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
import Categories from './pages/Categories/Categories';
import ProtectedRoute from './components/common/ProtectedRoute';
import authService from './services/authService';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
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
 * Componente de Navegación
 * US-AUTH-003: CA-1 - Botón de Cierre de Sesión
 * US-AUTH-004: CA-1 - Dropdown menu con acceso al perfil
 * US-AUTH-005: CA-5 - Menú dinámico según rol
 */
function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  // Actualizar estado de autenticación cuando cambie la ruta
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    if (authService.isAuthenticated()) {
      setCurrentUser(authService.getCurrentUser());
    }
  }, [location.pathname]);

  /**
   * US-AUTH-004: CA-1 - Abrir menú de usuario
   */
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  /**
   * US-AUTH-004: CA-1 - Cerrar menú de usuario
   */
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  /**
   * US-AUTH-004: CA-1 - Navegar al perfil
   */
  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  /**
   * US-AUTH-003: CA-1, CA-2, CA-3 - Función de logout
   * Cierra la sesión del usuario y redirige al login
   */
  const handleLogout = () => {
    handleMenuClose();

    // CA-2: Invalidar sesión y limpiar token
    authService.logout();

    // CA-3: Redirigir a login
    navigate('/login', {
      replace: true,
      state: { message: 'Has cerrado sesión correctamente' }
    });

    // Actualizar estado local
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          GesTrack - Sistema de Gestión
        </Typography>

        {!isAuthenticated ? (
          // Mostrar botones de login/registro cuando NO está autenticado
          <>
            <Button color="inherit" href="/login">
              Iniciar Sesión
            </Button>
            <Button color="inherit" href="/register">
              Nuevo Usuario
            </Button>
          </>
        ) : (
          // Mostrar navegación y menú de usuario cuando está autenticado
          // US-AUTH-005: CA-5 - Menú dinámico según rol
          <>
            {/* US-AUTH-005: CA-2, CA-5 - Ocultar opciones según rol */}
            {currentUser?.role === 'Admin' && (
              <Button color="inherit" href="/users">
                Usuarios
              </Button>
            )}

            {/* US-PROD: Product and Category Management Navigation */}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Gerente de Almacén') && (
              <>
                <Button color="inherit" href="/products">
                  Productos
                </Button>
                <Button color="inherit" href="/categories">
                  Categorías
                </Button>
              </>
            )}

            {/* US-AUTH-004: CA-1 - Menú de usuario con dropdown */}
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              size="large"
              aria-label="menú de usuario"
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
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

          <Box sx={{ p: 3 }}>
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
