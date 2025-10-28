import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Alert,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PasswordStrengthIndicator from '../common/PasswordStrengthIndicator';
import {
  validatePasswordStrength,
  validateEmailFormat,
  validateRequired,
} from '../../utils/validators';
import authService from '../../services/authService';

/**
 * Formulario de Registro de Usuario
 * Implementa US-AUTH-001 con todos los criterios de aceptación
 */
const UserRegistrationForm = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm({
    mode: 'onChange', // Validación en tiempo real (CA-5)
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Observar el campo password para el indicador de fortaleza
  const password = watch('password', '');

  // Roles disponibles (CA-1)
  const roles = ['Admin', 'Gerente de Almacén', 'Personal de Ventas'];

  /**
   * Maneja el envío del formulario
   * Implementa CA-4: Confirmación de registro
   * Implementa CA-5: Manejo de errores
   */
  const onSubmit = async (data) => {
    setLoading(true);
    setSuccessMessage('');
    setGeneralError('');

    try {
      // Llamar al servicio de registro
      const response = await authService.register(data);

      if (response.success) {
        // Mostrar mensaje de éxito (CA-4)
        setSuccessMessage('Usuario registrado correctamente');

        // Redirigir a la lista de usuarios después de 1.5 segundos (CA-4)
        setTimeout(() => {
          navigate('/users');
        }, 1500);
      }
    } catch (error) {
      setLoading(false);

      // Manejo de errores de validación del backend (CA-5)
      if (error.error && error.error.details) {
        const details = error.error.details;

        // Mapear errores del backend a campos del formulario
        Object.keys(details).forEach((field) => {
          setError(field, {
            type: 'server',
            message: Array.isArray(details[field])
              ? details[field].join(', ')
              : details[field],
          });
        });
      } else {
        // Error general
        setGeneralError(
          error.error?.message || 'Error al registrar usuario. Por favor, inténtelo de nuevo.'
        );
      }
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PersonAddIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Registro de Usuario
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {generalError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {generalError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Campo: Nombre Completo (CA-1) */}
        <TextField
          fullWidth
          label="Nombre Completo"
          variant="outlined"
          margin="normal"
          {...register('full_name', {
            required: 'El nombre completo es obligatorio',
            validate: (value) =>
              validateRequired(value) || 'El nombre completo no puede estar vacío',
          })}
          error={!!errors.full_name}
          helperText={errors.full_name?.message}
          disabled={loading}
        />

        {/* Campo: Email (CA-1, CA-3) */}
        <TextField
          fullWidth
          label="Email"
          type="email"
          variant="outlined"
          margin="normal"
          {...register('email', {
            required: 'El email es obligatorio',
            validate: (value) =>
              validateEmailFormat(value) || 'El formato del email no es válido',
          })}
          error={!!errors.email}
          helperText={errors.email?.message}
          disabled={loading}
        />

        {/* Campo: Contraseña (CA-1, CA-2) */}
        <TextField
          fullWidth
          label="Contraseña"
          type="password"
          variant="outlined"
          margin="normal"
          {...register('password', {
            required: 'La contraseña es obligatoria',
            validate: (value) => {
              const { isValid, errors: validationErrors } = validatePasswordStrength(value);
              return isValid || validationErrors.join(', ');
            },
          })}
          error={!!errors.password}
          helperText={errors.password?.message}
          disabled={loading}
        />

        {/* Indicador de fortaleza de contraseña (CA-2) */}
        <PasswordStrengthIndicator password={password} />

        {/* Campo: Rol (CA-1) */}
        <TextField
          fullWidth
          select
          label="Rol"
          variant="outlined"
          margin="normal"
          defaultValue=""
          {...register('role', {
            required: 'El rol es obligatorio',
          })}
          error={!!errors.role}
          helperText={errors.role?.message}
          disabled={loading}
        >
          <MenuItem value="" disabled>
            Seleccione un rol
          </MenuItem>
          {roles.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </TextField>

        {/* Botón de envío */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          sx={{ mt: 3 }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
        >
          {loading ? 'Registrando...' : 'Registrar Usuario'}
        </Button>
      </form>
    </Paper>
  );
};

export default UserRegistrationForm;
