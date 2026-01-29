/**
 * US-INV-005 CA-7: Exportación de Reporte de Valor del Inventario
 *
 * Card para exportar reportes de valor del inventario a Excel
 */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

/**
 * Card para exportar reportes de valor del inventario
 */
const InventoryValueExportCard = () => {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      // Exportar reporte usando el servicio (formato Excel)
      await inventoryService.exportValueReport('excel', period);

      // Mostrar notificación de éxito
      setSnackbar({
        open: true,
        message: 'Reporte exportado exitosamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting inventory value report:', error);

      // Mostrar notificación de error
      setSnackbar({
        open: true,
        message: error.error?.message || 'Error al exportar el reporte',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getPeriodLabel = () => {
    const labels = {
      '7d': 'últimos 7 días',
      '30d': 'último mes',
      '3m': 'últimos 3 meses',
      '1y': 'último año'
    };
    return labels[period] || period;
  };

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          {/* Título */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                backgroundColor: 'success.light',
                borderRadius: 2,
                p: 1,
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DescriptionIcon sx={{ color: 'success.main', fontSize: 32 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" gutterBottom>
                Exportar Reporte
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Descarga el informe completo de valor del inventario
              </Typography>
            </Box>
          </Box>

          {/* Selector de Período */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Período del reporte:
            </Typography>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={handlePeriodChange}
              aria-label="period selection"
              size="small"
              fullWidth
              sx={{ mt: 1 }}
            >
              <ToggleButton value="7d" aria-label="7 days">
                7 días
              </ToggleButton>
              <ToggleButton value="30d" aria-label="30 days">
                30 días
              </ToggleButton>
              <ToggleButton value="3m" aria-label="3 months">
                3 meses
              </ToggleButton>
              <ToggleButton value="1y" aria-label="1 year">
                1 año
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Información del reporte */}
          <Box
            sx={{
              bgcolor: 'grey.50',
              borderRadius: 1,
              p: 2,
              mb: 3
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              El reporte incluye:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <Typography variant="caption" component="li" color="text.secondary">
                Valor total del inventario
              </Typography>
              <Typography variant="caption" component="li" color="text.secondary">
                Desglose por categoría
              </Typography>
              <Typography variant="caption" component="li" color="text.secondary">
                Top 10 productos de mayor valor
              </Typography>
              <Typography variant="caption" component="li" color="text.secondary">
                Evolución histórica ({getPeriodLabel()})
              </Typography>
            </Box>
          </Box>

          {/* Botón de exportación */}
          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? 'Generando...' : 'Descargar Excel'}
          </Button>

          {/* Formato disponible */}
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            display="block"
            sx={{ mt: 1.5 }}
          >
            Formato: Microsoft Excel (.xlsx)
          </Typography>
        </CardContent>
      </Card>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InventoryValueExportCard;
