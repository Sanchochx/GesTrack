import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import productService from '../../services/productService';
import inventoryService from '../../services/inventoryService';

/**
 * BulkReorderPointDialog Component
 * US-INV-004 CA-4: Configuración masiva de puntos de reorden por categoría
 *
 * Permite actualizar el punto de reorden de múltiples productos
 * de una categoría específica de manera masiva.
 */
const BulkReorderPointDialog = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Form, 2: Preview, 3: Result
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [preview, setPreview] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPreviewDetails, setShowPreviewDetails] = useState(false);

  // Cargar categorías al abrir el dialog
  useEffect(() => {
    if (open) {
      loadCategories();
      // Reset state
      setStep(1);
      setSelectedCategory('');
      setReorderPoint('');
      setOverwriteExisting(true);
      setPreview([]);
      setResult(null);
      setError(null);
    }
  }, [open]);

  /**
   * Cargar categorías disponibles
   */
  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  /**
   * Validar formulario
   */
  const validateForm = () => {
    if (!selectedCategory) {
      setError('Debes seleccionar una categoría');
      return false;
    }

    const point = parseInt(reorderPoint);
    if (isNaN(point) || point < 0 || point > 10000) {
      setError('El punto de reorden debe ser un número entre 0 y 10,000');
      return false;
    }

    setError(null);
    return true;
  };

  /**
   * Obtener preview de productos afectados
   */
  const handlePreview = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await inventoryService.getReorderPointPreview(selectedCategory);
      if (response.success) {
        setPreview(response.data || []);
        setStep(2);
      } else {
        setError(response.error?.message || 'Error al obtener preview');
      }
    } catch (err) {
      console.error('Error getting preview:', err);
      setError(err.error?.message || 'Error al obtener preview de productos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aplicar cambios
   */
  const handleApply = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await inventoryService.bulkUpdateReorderPoints(
        selectedCategory,
        parseInt(reorderPoint),
        overwriteExisting
      );

      if (response.success) {
        setResult(response.data);
        setStep(3);
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.error?.message || 'Error al actualizar productos');
      }
    } catch (err) {
      console.error('Error applying bulk update:', err);
      setError(err.error?.message || 'Error al actualizar puntos de reorden');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar y resetear
   */
  const handleClose = () => {
    setStep(1);
    setError(null);
    onClose();
  };

  /**
   * Obtener nombre de categoría por ID
   */
  const getCategoryName = () => {
    const category = categories.find((c) => c.id === selectedCategory);
    return category?.name || '';
  };

  /**
   * Filtrar productos según opción overwriteExisting
   */
  const getFilteredPreview = () => {
    if (overwriteExisting) {
      return preview;
    }
    return preview.filter((p) => p.current_reorder_point === 10); // Solo con valor default
  };

  const filteredPreview = getFilteredPreview();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          <SettingsIcon color="primary" />
          <Typography variant="h6">Configuración Masiva de Puntos de Reorden</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, minHeight: 400 }}>
        {/* Step 1: Form */}
        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Actualiza el punto de reorden para todos los productos de una categoría de manera
              masiva.
            </Alert>

            <TextField
              select
              required
              fullWidth
              label="Categoría"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={loading}
              helperText="Selecciona la categoría de productos a actualizar"
            >
              <MenuItem value="">
                <em>Seleccionar categoría</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              fullWidth
              type="number"
              label="Nuevo Punto de Reorden"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              disabled={loading}
              inputProps={{ min: 0, max: 10000, step: 1 }}
              helperText="Valor entre 0 y 10,000 unidades"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Sobrescribir puntos existentes</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Si está desmarcado, solo se actualizarán productos con valor por defecto (10)
                  </Typography>
                </Box>
              }
            />

            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" icon={<WarningIcon />}>
              <Typography variant="body2" fontWeight="medium">
                Se actualizarán {filteredPreview.length} productos de la categoría "
                {getCategoryName()}"
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Productos afectados
              </Typography>
              <Button
                size="small"
                onClick={() => setShowPreviewDetails(!showPreviewDetails)}
                endIcon={showPreviewDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                {showPreviewDetails ? 'Ocultar' : 'Ver'} detalles
              </Button>
            </Box>

            <Collapse in={showPreviewDetails}>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="center">Stock Actual</TableCell>
                      <TableCell align="center">Punto Actual</TableCell>
                      <TableCell align="center">Nuevo Punto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPreview.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No hay productos para actualizar con esta configuración
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPreview.map((product) => (
                        <TableRow key={product.id} hover>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={product.stock_quantity}
                              size="small"
                              color={
                                product.stock_quantity <= product.current_reorder_point
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="center">{product.current_reorder_point}</TableCell>
                          <TableCell align="center">
                            <Typography fontWeight="medium" color="primary">
                              {reorderPoint}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>

            {filteredPreview.length === 0 && (
              <Alert severity="warning">
                No se encontraron productos para actualizar. Intenta cambiar la configuración.
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />

            <Typography variant="h6" align="center">
              ¡Actualización Completada!
            </Typography>

            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Productos actualizados
                </Typography>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {result.products_updated}
                </Typography>
              </Paper>

              {result.products_skipped > 0 && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Productos omitidos
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {result.products_skipped}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ya tenían un punto de reorden personalizado
                  </Typography>
                </Paper>
              )}

              <Alert severity="success">
                Se han actualizado {result.products_updated} productos de la categoría "
                {getCategoryName()}" con el nuevo punto de reorden de {reorderPoint} unidades.
              </Alert>
            </Box>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === 1 && (
          <>
            <Button onClick={handleClose} color="inherit">
              Cancelar
            </Button>
            <Button
              onClick={handlePreview}
              variant="contained"
              disabled={loading || !selectedCategory || !reorderPoint}
            >
              Ver Preview
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Button onClick={() => setStep(1)} color="inherit" disabled={loading}>
              Atrás
            </Button>
            <Button
              onClick={handleApply}
              variant="contained"
              color="primary"
              disabled={loading || filteredPreview.length === 0}
            >
              Aplicar Cambios
            </Button>
          </>
        )}

        {step === 3 && (
          <Button onClick={handleClose} variant="contained" color="success">
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkReorderPointDialog;
