import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Container,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { LockReset as LockResetIcon, Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import authService from '../../services/authService';
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator';
import { validatePasswordStrength } from '../../utils/validators';

/**
 * Página de Restablecimiento de Contraseña
 * US-AUTH-006 - CA-6: Formulario de nueva contraseña
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extraer token de la URL (CA-6)
  const token = searchParams.get('token');

  // Estado del formulario
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [countdown, setCountdown] = useState(3);

  // Verificar que exista el token al montar el componente
  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no válido. Por favor, solicita un nuevo enlace de recuperación.');
    }
  }, [token]);

  // CA-8: Redirección automática después de 3 segundos
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate('/login');
    }
  }, [success, countdown, navigate]);

  // Manejador de cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar errores al escribir
    if (error) setError(null);
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  // Validar contraseñas antes de enviar
  const validateForm = () => {
    const errors = [];

    // CA-6: Validación de fortaleza de contraseña (8+ caracteres, complejidad)
    const strengthValidation = validatePasswordStrength(formData.newPassword);
    if (!strengthValidation.isValid) {
      errors.push(...strengthValidation.errors);
    }

    // CA-6: Validación de coincidencia de contraseñas
    if (formData.newPassword !== formData.confirmPassword) {
      errors.push('Las contraseñas no coinciden');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Manejador de submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validar token
    if (!token) {
      setError('Token de recuperación no válido');
      return;
    }

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Llamar al servicio de reset de contraseña
      const response = await authService.resetPassword(
        token,
        formData.newPassword,
        formData.confirmPassword
      );

      if (response.success) {
        // CA-8: Mostrar mensaje de éxito
        setSuccess(true);
        setCountdown(3); // Iniciar cuenta regresiva
      }
    } catch (err) {
      // CA-7: Manejo de errores (token inválido o expirado)
      const errorMessage = err.error?.message || 'Error al restablecer la contraseña';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manejador para solicitar nuevo enlace
  const handleRequestNewLink = () => {
    navigate('/forgot-password');
  };

  // Toggle para mostrar/ocultar contraseña
  const handleToggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 450, mx: 'auto', mt: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LockResetIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Restablecer Contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {/* CA-6: Instrucciones claras */}
            Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta
          </Typography>
        </Box>

        {/* CA-8: Mensaje de éxito con redirección */}
        {success ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Tu contraseña ha sido cambiada exitosamente!
            </Alert>
            <Alert severity="info" sx={{ mb: 2 }}>
              Serás redirigido al inicio de sesión en {countdown} segundo{countdown !== 1 ? 's' : ''}...
            </Alert>
            <Button
              fullWidth
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Ir al inicio de sesión ahora
            </Button>
          </Box>
        ) : (
          <>
            {/* CA-7: Mensaje de error (token inválido o expirado) */}
            {error && (
              <Box>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
                {/* CA-7: Botón para solicitar nuevo enlace */}
                {(error.includes('Token') || error.includes('expirado') || error.includes('inválido')) && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleRequestNewLink}
                    sx={{ mb: 2 }}
                  >
                    Solicitar nuevo enlace de recuperación
                  </Button>
                )}
              </Box>
            )}

            {/* Errores de validación */}
            {validationErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {validationErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Solo mostrar formulario si hay token */}
            {token && (
              <form onSubmit={handleSubmit}>
                {/* CA-6: Campo de Nueva Contraseña */}
                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  autoFocus
                  margin="normal"
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleToggleNewPasswordVisibility}
                          edge="end"
                          disabled={loading}
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* CA-6: Indicador de fortaleza de contraseña */}
                <PasswordStrengthIndicator password={formData.newPassword} />

                {/* CA-6: Campo de Confirmar Contraseña */}
                <TextField
                  fullWidth
                  label="Confirmar Contraseña"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  margin="normal"
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleToggleConfirmPasswordVisibility}
                          edge="end"
                          disabled={loading}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Botón de Envío */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {loading ? 'Restableciendo contraseña...' : 'Restablecer contraseña'}
                </Button>

                {/* Enlace para volver al login */}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    onClick={() => navigate('/login')}
                    disabled={loading}
                    variant="text"
                  >
                    Volver al inicio de sesión
                  </Button>
                </Box>
              </form>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default ResetPassword;
