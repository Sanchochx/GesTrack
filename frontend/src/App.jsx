import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import UserList from './pages/Auth/UserList';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import WarehouseDashboard from './pages/Dashboard/WarehouseDashboard';
import SalesDashboard from './pages/Dashboard/SalesDashboard';
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
 * Componente de Navegación
 * US-AUTH-003: CA-1 - Botón de Cierre de Sesión
 */
function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  // Actualizar estado de autenticación cuando cambie la ruta
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, [location.pathname]);

  /**
   * US-AUTH-003: CA-1, CA-2, CA-3 - Función de logout
   * Cierra la sesión del usuario y redirige al login
   */
  const handleLogout = () => {
    // CA-2: Invalidar sesión y limpiar token
    authService.logout();

    // CA-3: Redirigir a login
    navigate('/login', {
      replace: true,
      state: { message: 'Has cerrado sesión correctamente' }
    });

    // Actualizar estado local
    setIsAuthenticated(false);
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
          // Mostrar navegación y logout cuando está autenticado
          <>
            <Button color="inherit" href="/users">
              Usuarios
            </Button>
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Cerrar Sesión
            </Button>
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

              {/* US-AUTH-003: CA-4 - Rutas Protegidas */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <UserList />
                  </ProtectedRoute>
                }
              />
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
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
