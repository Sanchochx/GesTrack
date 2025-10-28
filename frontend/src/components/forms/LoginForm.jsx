import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Link,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import authService from '../../services/authService';

/**
 * Formulario de Inicio de Sesión
 * US-AUTH-002 - CA-1: Formulario de Login
 * US-AUTH-003 - CA-3: Mensaje de logout
 */
const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Estado del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Estado de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // US-AUTH-003: CA-3 - Mostrar mensaje de logout exitoso
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Limpiar el mensaje del state después de mostrarlo
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Manejador de cambios en inputs
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
    // Limpiar error al escribir
    if (error) setError(null);
  };

  // Manejador de submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Llamar al servicio de login
      const response = await authService.login(formData.email, formData.password, formData.rememberMe);

      if (response.success) {
        // Mostrar mensaje de bienvenida (CA-3)
        const userName = response.data.user.full_name;
        const userRole = response.data.user.role;

        // Redirigir según el rol (CA-6)
        redirectByRole(userRole);
      }
    } catch (err) {
      // Manejo de errores (CA-4)
      const errorMessage = err.error?.message || 'Error de conexión con el servidor';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Redirigir según rol del usuario (CA-6)
  const redirectByRole = (role) => {
    switch (role) {
      case 'Admin':
        navigate('/dashboard/admin');
        break;
      case 'Gerente de Almacén':
        navigate('/dashboard/warehouse');
        break;
      case 'Personal de Ventas':
        navigate('/dashboard/sales');
        break;
      default:
        navigate('/dashboard');
    }
  };

  // Toggle para mostrar/ocultar contraseña
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 450, mx: 'auto', mt: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Iniciar Sesión
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingresa tus credenciales para acceder al sistema
        </Typography>
      </Box>

      {/* US-AUTH-003: CA-3 - Mensaje de logout exitoso */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Campo de Email */}
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          autoFocus
          margin="normal"
          disabled={loading}
        />

        {/* Campo de Contraseña */}
        <TextField
          fullWidth
          label="Contraseña"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          margin="normal"
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                  disabled={loading}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Checkbox Recordarme (CA-5) */}
        <FormControlLabel
          control={
            <Checkbox
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={loading}
              color="primary"
            />
          }
          label="Recordarme"
          sx={{ mt: 1, mb: 2 }}
        />

        {/* Botón de Envío */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 2, mb: 2 }}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        {/* Enlaces adicionales */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            sx={{ display: 'block', mb: 1 }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
          <Typography variant="body2" color="text.secondary">
            ¿No tienes una cuenta?{' '}
            <Link component={RouterLink} to="/register" variant="body2">
              Regístrate aquí
            </Link>
          </Typography>
        </Box>
      </form>
    </Paper>
  );
};

export default LoginForm;
