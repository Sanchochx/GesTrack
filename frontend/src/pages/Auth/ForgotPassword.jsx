import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Link,
  Container,
} from '@mui/material';
import { Email as EmailIcon, ArrowBack } from '@mui/icons-material';
import authService from '../../services/authService';

/**
 * Página de Solicitud de Recuperación de Contraseña
 * US-AUTH-006 - CA-2: Formulario de solicitud de recuperación
 */
const ForgotPassword = () => {
  const navigate = useNavigate();

  // Estado del formulario
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Validación de formato de email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Manejador de cambios en el input
  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  // Manejador de submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validación de formato de email (CA-2)
    if (!isValidEmail(email)) {
      setError('Por favor, ingresa un email válido');
      return;
    }

    setLoading(true);

    try {
      // Llamar al servicio de recuperación de contraseña
      const response = await authService.requestPasswordReset(email);

      if (response.success) {
        // CA-3: Mostrar el mismo mensaje de éxito sin importar si el email existe
        setSuccess(true);
      }
    } catch (err) {
      // CA-3: Mostrar mensaje genérico de éxito incluso en caso de error
      // El backend siempre devuelve 200 OK para prevenir ataques de enumeración
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  // Manejador para volver al login
  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 450, mx: 'auto', mt: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <EmailIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Recuperar Contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {/* CA-2: Mensaje informativo */}
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </Typography>
        </Box>

        {/* CA-3: Mensaje de éxito */}
        {success ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Si existe una cuenta con ese email, recibirás un enlace de recuperación en los próximos minutos.
              Por favor, revisa tu bandeja de entrada y la carpeta de spam.
            </Alert>
            <Alert severity="info" sx={{ mb: 2 }}>
              El enlace de recuperación tiene una validez de 1 hora.
            </Alert>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleBackToLogin}
              sx={{ mt: 2 }}
            >
              Volver al inicio de sesión
            </Button>
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* CA-2: Campo de Email con validación de formato */}
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={handleChange}
                required
                autoComplete="email"
                autoFocus
                margin="normal"
                disabled={loading}
                placeholder="tu@email.com"
              />

              {/* CA-2: Botón "Enviar enlace de recuperación" */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Button>

              {/* Enlaces adicionales */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  startIcon={<ArrowBack />}
                  onClick={handleBackToLogin}
                  disabled={loading}
                  variant="text"
                >
                  Volver al inicio de sesión
                </Button>
              </Box>
            </form>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
