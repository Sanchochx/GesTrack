/**
 * StatusTimeline – Timeline visual del historial de estados del pedido
 * US-ORD-003: CA-6 (visualización de historial)
 */
import {
  Box,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CancelIcon from '@mui/icons-material/Cancel';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { STATUS_COLORS } from './StatusChangeModal';

const STATUS_ICONS = {
  Pendiente: AccessTimeIcon,
  Confirmado: CheckCircleIcon,
  Procesando: SettingsIcon,
  Enviado: LocalShippingIcon,
  Entregado: DoneAllIcon,
  Cancelado: CancelIcon,
};

const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * @param {Array} history - Array de entradas de historial (ordenadas más reciente primero)
 */
const StatusTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin historial de estados.
      </Typography>
    );
  }

  return (
    <Box>
      {history.map((entry, index) => {
        const color = STATUS_COLORS[entry.status] || '#9E9E9E';
        const Icon = STATUS_ICONS[entry.status] || RadioButtonUncheckedIcon;
        const isLast = index === history.length - 1;

        return (
          <Box key={entry.id} sx={{ display: 'flex', gap: 2 }}>
            {/* Timeline line + dot */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                <Icon sx={{ color: 'white', fontSize: 18 }} />
              </Box>
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flexGrow: 1,
                    bgcolor: 'grey.300',
                    my: 0.5,
                    minHeight: 24,
                  }}
                />
              )}
            </Box>

            {/* Entry content */}
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                mb: isLast ? 0 : 2,
                flex: 1,
                borderLeft: `3px solid ${color}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                {entry.previous_status && (
                  <>
                    <Chip
                      label={entry.previous_status}
                      size="small"
                      sx={{
                        bgcolor: STATUS_COLORS[entry.previous_status] || '#9E9E9E',
                        color: 'white',
                        fontSize: '0.7rem',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">→</Typography>
                  </>
                )}
                <Chip
                  label={entry.status}
                  size="small"
                  sx={{
                    bgcolor: color,
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                  }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary" display="block">
                {formatDateTime(entry.created_at)}
                {entry.changed_by_name && ` · ${entry.changed_by_name}`}
              </Typography>

              {entry.notes && (
                <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                  {entry.notes}
                </Typography>
              )}
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
};

export default StatusTimeline;
