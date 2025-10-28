import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import Register from './pages/Auth/Register';
import UserList from './pages/Auth/UserList';

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
              <Route path="/" element={<Navigate to="/users" replace />} />
              <Route path="/register" element={<Register />} />
              <Route path="/users" element={<UserList />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
