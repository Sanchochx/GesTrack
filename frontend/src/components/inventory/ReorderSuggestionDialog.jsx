import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  LocalShipping as LocalShippingIcon,
  Security as SecurityIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

/**
 * ReorderSuggestionDialog Component
 * US-INV-004 CA-5: Sugerencias inteligentes de punto de reorden
 *
 * Muestra sugerencia calculada basada en:
 * - Ventas promedio de los últimos 30 días
 * - Tiempo de reabastecimiento (ajustable)
 * - Stock de seguridad (ajustable)
 *
 * Fórmula: (Ventas promedio diarias × Días reabastecimiento) + Stock seguridad
 */
const ReorderSuggestionDialog = ({
  open,
  onClose,
  productId,
  productName,
  currentValue = 10,
  onApply,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [safetyStockDays, setSafetyStockDays] = useState(3);

  // Cargar sugerencia cuando se abre el dialog
  useEffect(() => {
    if (open && productId) {
      loadSuggestion();
    }
  }, [open, productId, leadTimeDays, safetyStockDays]);

  /**
   * Cargar sugerencia de la API
   */
  const loadSuggestion = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await inventoryService.getReorderPointSuggestion(
        productId,
        leadTimeDays,
        safetyStockDays
      );

      if (response.success) {
        setSuggestion(response.data);
      } else {
        setError(response.error?.message || 'Error al obtener sugerencia');
      }
    } catch (err) {
      console.error('Error loading reorder suggestion:', err);
      setError(err.error?.message || 'Error al cargar sugerencia');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aplicar sugerencia
   */
  const handleApply = () => {
    if (suggestion && onApply) {
      onApply(suggestion.suggested_reorder_point);
    }
    onClose();
  };

  /**
   * Determinar color según diferencia con valor actual
   */
  const getDifferenceColor = () => {
    if (!suggestion) return 'text.secondary';
    const diff = suggestion.suggested_reorder_point - currentValue;
    if (diff > 0) return 'success.main';
    if (diff < 0) return 'warning.main';
    return 'text.secondary';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LightbulbIcon color="primary" />
          <Typography variant="h6">Sugerencia de Punto de Reorden</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : suggestion ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Producto */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Producto
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {productName || suggestion.product_name}
              </Typography>
            </Box>

            {/* Sugerencia Principal */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: 'primary.50',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Punto de Reorden Sugerido
              </Typography>
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                {suggestion.suggested_reorder_point}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                unidades
              </Typography>

              {/* Comparación con valor actual */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Chip
                  label={`Actual: ${currentValue}`}
                  size="medium"
                  variant="outlined"
                />
                {suggestion.suggested_reorder_point !== currentValue && (
                  <Chip
                    label={
                      suggestion.suggested_reorder_point > currentValue
                        ? `+${suggestion.suggested_reorder_point - currentValue} unidades`
                        : `${suggestion.suggested_reorder_point - currentValue} unidades`
                    }
                    size="medium"
                    color={
                      suggestion.suggested_reorder_point > currentValue ? 'success' : 'warning'
                    }
                  />
                )}
              </Box>
            </Paper>

            {/* Detalles del Cálculo */}
            <Box>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                📊 Cálculo basado en:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {/* Ventas Promedio */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUpIcon color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Ventas Promedio Diarias
                      </Typography>
                      <Typography variant="h6" fontWeight="medium">
                        {suggestion.average_daily_sales} unidades/día
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Basado en {suggestion.total_sold_last_30_days} unidades vendidas en los
                        últimos 30 días
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Tiempo de Reabastecimiento */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocalShippingIcon color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tiempo de Reabastecimiento
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                        <TextField
                          type="number"
                          value={leadTimeDays}
                          onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 7)}
                          size="small"
                          inputProps={{ min: 1, max: 90, step: 1 }}
                          sx={{ width: 100 }}
                        />
                        <Typography variant="body2">días</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>

                {/* Stock de Seguridad */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SecurityIcon color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Stock de Seguridad
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {suggestion.safety_stock} unidades
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                        <TextField
                          type="number"
                          value={safetyStockDays}
                          onChange={(e) => setSafetyStockDays(parseInt(e.target.value) || 3)}
                          size="small"
                          inputProps={{ min: 0, max: 30, step: 1 }}
                          sx={{ width: 100 }}
                        />
                        <Typography variant="body2">días adicionales</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Box>

            {/* Fórmula */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'info.50',
                border: '1px solid',
                borderColor: 'info.main',
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CalculateIcon color="info" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="body2" fontWeight="medium" color="info.dark" gutterBottom>
                    Fórmula de Cálculo
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    ({suggestion.average_daily_sales} × {leadTimeDays}) + {suggestion.safety_stock}{' '}
                    = {suggestion.suggested_reorder_point}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Nota informativa */}
            <Alert severity="info" icon={<LightbulbIcon />}>
              Esta sugerencia se basa en el histórico de ventas de los últimos 30 días. Ajusta el
              tiempo de reabastecimiento y stock de seguridad según tus necesidades.
            </Alert>
          </Box>
        ) : null}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={loading || !suggestion}
          startIcon={<LightbulbIcon />}
        >
          Aplicar Sugerencia
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReorderSuggestionDialog;
