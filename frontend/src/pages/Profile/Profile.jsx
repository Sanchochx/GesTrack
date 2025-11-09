import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Grid
} from '@mui/material';
import { useForm } from 'react-hook-form';
import authService from '../../services/authService';
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator';
import { validatePasswordStrength } from '../../utils/validators';

/**
 * Componente de Perfil de Usuario
 * US-AUTH-004: Gestión de Perfil de Usuario
 * Implementa todos los criterios de aceptación (CA-1 a CA-7)
 */
function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form para actualización de perfil (CA-3, CA-4)
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
    watch: watchProfile,
    setError: setProfileError
  } = useForm({
    mode: 'onChange', // CA-7: Validación en tiempo real
  });

  // Form para cambio de contraseña (CA-5)
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
    watch: watchPassword,
    setError: setPasswordError
  } = useForm({
    mode: 'onChange', // CA-7: Validación en tiempo real
  });

  // Watch para validación en tiempo real
  const fullName = watchProfile('full_name');
  const email = watchProfile('email');
  const newPassword = watchPassword('new_password');
  const confirmPassword = watchPassword('confirm_password');

  // US-AUTH-004: CA-2 - Cargar información del usuario al montar el componente
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    setCurrentUser(user);
    resetProfile({
      full_name: user.full_name,
      email: user.email
    });
  }, [navigate, resetProfile]);

  /**
   * US-AUTH-004: CA-3, CA-4, CA-6 - Actualizar perfil
   */
  const onSubmitProfile = async (data) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await authService.updateProfile(currentUser.id, {
        full_name: data.full_name,
        email: data.email
      });

      if (response.success) {
        // CA-6: Mensaje de éxito
        setSuccessMessage('Perfil actualizado correctamente');
        setCurrentUser(response.data.user);
        resetProfile({
          full_name: response.data.user.full_name,
          email: response.data.user.email
        });

        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      // CA-6: Mensaje de error
      if (error.error && error.error.details) {
        // Errores de validación del backend
        Object.keys(error.error.details).forEach(field => {
          setProfileError(field, {
            type: 'server',
            message: error.error.details[field][0]
          });
        });
      } else {
        setErrorMessage(error.error?.message || 'Error al actualizar perfil');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * US-AUTH-004: CA-5, CA-6 - Cambiar contraseña
   */
  const onSubmitPassword = async (data) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Validación adicional de frontend (CA-5)
    if (data.new_password !== data.confirm_password) {
      setPasswordError('confirm_password', {
        type: 'manual',
        message: 'Las contraseñas no coinciden'
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.changePassword(currentUser.id, {
        current_password: data.current_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password
      });

      if (response.success) {
        // CA-6: Mensaje de éxito
        setSuccessMessage('Contraseña cambiada correctamente');
        resetPassword();

        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      // CA-6: Mensaje de error
      if (error.error && error.error.details) {
        // Errores de validación del backend
        Object.keys(error.error.details).forEach(field => {
          setPasswordError(field, {
            type: 'server',
            message: error.error.details[field][0]
          });
        });
      } else {
        setErrorMessage(error.error?.message || 'Error al cambiar contraseña');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * US-AUTH-004: CA-6 - Cancelar y recargar datos originales
   */
  const handleCancelProfile = () => {
    resetProfile({
      full_name: currentUser.full_name,
      email: currentUser.email
    });
    setSuccessMessage('');
    setErrorMessage('');
  };

  /**
   * US-AUTH-004: CA-6 - Cancelar cambio de contraseña
   */
  const handleCancelPassword = () => {
    resetPassword();
    setSuccessMessage('');
    setErrorMessage('');
  };

  /**
   * US-AUTH-004: CA-2 - Formatear fecha de registro
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ p: 3, mt: 4, mb: 4 }}>
      {/* US-AUTH-004: CA-1 - Título de la página */}
      <Typography variant="h4" component="h1" gutterBottom>
        Mi Perfil
      </Typography>

      {/* Mensajes de éxito y error (CA-6) */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* US-AUTH-004: CA-2 - Información del Perfil */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información Personal
        </Typography>

        <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
          <Grid container spacing={2}>
            {/* CA-3: Campo de nombre editable */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre Completo"
                {...registerProfile('full_name', {
                  required: 'El nombre completo es obligatorio',
                  minLength: {
                    value: 3,
                    message: 'El nombre debe tener al menos 3 caracteres'
                  },
                  maxLength: {
                    value: 100,
                    message: 'El nombre no puede exceder 100 caracteres'
                  }
                })}
                error={!!profileErrors.full_name}
                helperText={profileErrors.full_name?.message}
                // CA-7: Indicadores visuales
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: profileErrors.full_name
                        ? 'error.main'
                        : fullName && fullName.length >= 3 && fullName.length <= 100
                        ? 'success.main'
                        : undefined
                    }
                  }
                }}
                disabled={isLoading}
              />
            </Grid>

            {/* CA-4: Campo de email editable */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                {...registerProfile('email', {
                  required: 'El email es obligatorio',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Formato de email inválido'
                  }
                })}
                error={!!profileErrors.email}
                helperText={profileErrors.email?.message}
                // CA-7: Indicadores visuales
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: profileErrors.email
                        ? 'error.main'
                        : email && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
                        ? 'success.main'
                        : undefined
                    }
                  }
                }}
                disabled={isLoading}
              />
            </Grid>

            {/* CA-2: Rol (solo lectura) */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Rol
                </Typography>
                <Chip
                  label={currentUser.role}
                  color={
                    currentUser.role === 'Admin'
                      ? 'error'
                      : currentUser.role === 'Gerente de Almacén'
                      ? 'warning'
                      : 'info'
                  }
                  variant="outlined"
                />
              </Box>
            </Grid>

            {/* CA-2: Fecha de registro (solo lectura) */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Fecha de Registro
              </Typography>
              <Typography variant="body1">
                {formatDate(currentUser.created_at)}
              </Typography>
            </Grid>

            {/* CA-6: Botones de acción */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading || !isProfileDirty}
                  startIcon={isLoading && <CircularProgress size={20} />}
                >
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancelProfile}
                  disabled={isLoading || !isProfileDirty}
                >
                  Cancelar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* US-AUTH-004: CA-5 - Sección de Cambio de Contraseña */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cambiar Contraseña
        </Typography>

        <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
          <Grid container spacing={2}>
            {/* CA-5: Contraseña actual */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contraseña Actual"
                type="password"
                {...registerPassword('current_password', {
                  required: 'La contraseña actual es obligatoria'
                })}
                error={!!passwordErrors.current_password}
                helperText={passwordErrors.current_password?.message}
                disabled={isLoading}
              />
            </Grid>

            {/* CA-5: Nueva contraseña */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nueva Contraseña"
                type="password"
                {...registerPassword('new_password', {
                  required: 'La nueva contraseña es obligatoria',
                  validate: (value) => {
                    const validation = validatePasswordStrength(value);
                    return validation.isValid || validation.errors.join(', ');
                  }
                })}
                error={!!passwordErrors.new_password}
                helperText={passwordErrors.new_password?.message}
                disabled={isLoading}
              />
              {/* CA-5, CA-7: Indicador de fortaleza de contraseña */}
              {newPassword && <PasswordStrengthIndicator password={newPassword} />}
            </Grid>

            {/* CA-5: Confirmar nueva contraseña */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirmar Nueva Contraseña"
                type="password"
                {...registerPassword('confirm_password', {
                  required: 'Debes confirmar la nueva contraseña',
                  validate: (value) =>
                    value === newPassword || 'Las contraseñas no coinciden'
                })}
                error={!!passwordErrors.confirm_password}
                helperText={passwordErrors.confirm_password?.message}
                // CA-7: Indicador visual de coincidencia
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: passwordErrors.confirm_password
                        ? 'error.main'
                        : confirmPassword && confirmPassword === newPassword
                        ? 'success.main'
                        : undefined
                    }
                  }
                }}
                disabled={isLoading}
              />
            </Grid>

            {/* CA-6: Botones de acción */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                  startIcon={isLoading && <CircularProgress size={20} />}
                >
                  {isLoading ? 'Guardando...' : 'Cambiar Contraseña'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancelPassword}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default Profile;
