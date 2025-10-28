import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import UserList from './pages/Auth/UserList';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import WarehouseDashboard from './pages/Dashboard/WarehouseDashboard';
import SalesDashboard from './pages/Dashboard/SalesDashboard';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                GesTrack - Sistema de Gestión
              </Typography>
              <Button color="inherit" href="/login">
                Iniciar Sesión
              </Button>
              <Button color="inherit" href="/register">
                Nuevo Usuario
              </Button>
              <Button color="inherit" href="/users">
                Usuarios
              </Button>
            </Toolbar>
          </AppBar>

          <Box sx={{ p: 3 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/warehouse" element={<WarehouseDashboard />} />
              <Route path="/dashboard/sales" element={<SalesDashboard />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
