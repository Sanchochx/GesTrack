import { Box, LinearProgress, Typography } from '@mui/material';
import {
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from '../../utils/validators';

/**
 * Componente que muestra un indicador visual de fortaleza de contraseña
 * Implementa CA-2: Indicador de fortaleza en tiempo real
 */
const PasswordStrengthIndicator = ({ password }) => {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);
  const color = getPasswordStrengthColor(strength);
  const label = getPasswordStrengthLabel(strength);

  // Calcular porcentaje para la barra de progreso
  const percentages = {
    debil: 25,
    media: 50,
    fuerte: 75,
    muy_fuerte: 100,
  };

  const percentage = percentages[strength] || 0;

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          Fortaleza:
        </Typography>
        <Typography variant="caption" sx={{ color, fontWeight: 'bold' }}>
          {label}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
};

export default PasswordStrengthIndicator;
