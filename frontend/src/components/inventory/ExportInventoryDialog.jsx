/**
 * US-INV-009: Dialog para exportar datos completos del inventario
 *
 * CA-2: Selección de formato (CSV/Excel) con memoria en localStorage
 * CA-4: Opciones de filtrado
 * CA-7: Indicador de progreso y descarga automática
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  TableChart as CsvIcon,
  Description as ExcelIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

const STORAGE_KEY = 'gestrack_export_format';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los productos' },
  { value: 'in_stock', label: 'Solo con stock' },
  { value: 'active', label: 'Solo activos' }
];

const ExportInventoryDialog = ({ open, onClose, currentFilters = {} }) => {
  const [format, setFormat] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'excel';
  });
  const [stockFilter, setStockFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Persist format choice
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, format);
  }, [format]);

  const handleFormatChange = (event, newFormat) => {
    if (newFormat !== null) {
      setFormat(newFormat);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      await inventoryService.exportInventoryData({
        format,
        stockFilter,
        categoryId: currentFilters.categoryId || undefined,
        search: currentFilters.search || undefined
      });

      setSnackbar({
        open: true,
        message: `Inventario exportado exitosamente en formato ${format === 'excel' ? 'Excel' : 'CSV'}`,
        severity: 'success'
      });

      // Cerrar dialog tras exportación exitosa
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      console.error('Error exporting inventory:', error);
      setSnackbar({
        open: true,
        message: error.error?.message || 'Error al exportar el inventario',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileDownloadIcon color="primary" />
          Exportar Inventario
        </DialogTitle>

        <DialogContent dividers>
          {/* Formato de exportación (CA-2) */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Formato de archivo
            </Typography>
            <ToggleButtonGroup
              value={format}
              exclusive
              onChange={handleFormatChange}
              aria-label="formato de exportación"
              fullWidth
              size="small"
            >
              <ToggleButton value="excel" aria-label="Excel">
                <ExcelIcon sx={{ mr: 1 }} fontSize="small" />
                Excel (.xlsx)
              </ToggleButton>
              <ToggleButton value="csv" aria-label="CSV">
                <CsvIcon sx={{ mr: 1 }} fontSize="small" />
                CSV (.csv)
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Filtros de exportación (CA-4) */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Productos a incluir
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                {FILTER_OPTIONS.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio size="small" />}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Info box - columnas incluidas (CA-3) */}
          <Box
            sx={{
              bgcolor: 'grey.50',
              borderRadius: 1,
              p: 2
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Columnas incluidas en la exportación:
            </Typography>
            <Typography variant="caption" color="text.secondary">
              SKU, Nombre, Categoría, Stock Actual, Stock Reservado, Stock Disponible,
              Punto de Reorden, Precio Costo, Precio Venta, Valor Total, Estado,
              Última Actualización, Proveedor Principal
            </Typography>
            {format === 'excel' && (
              <Typography variant="caption" color="primary" display="block" sx={{ mt: 1 }}>
                El archivo Excel incluye una hoja de resumen adicional con totales y estadísticas.
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={onClose}
            disabled={loading}
            startIcon={<CloseIcon />}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
          >
            {loading ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default ExportInventoryDialog;
