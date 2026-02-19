import { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  InputAdornment,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Badge as BadgeIcon,
  AccountBalance as FiscalIcon,
  LocationOn as LocationIcon,
  ContactMail as ContactIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import customerService from '../../services/customerService';

const TIPOS_DOCUMENTO = ['CC', 'NIT', 'CE', 'PAS', 'TI'];
const TIPOS_CONTRIBUYENTE = ['Persona Natural', 'Persona Jurídica'];
const REGIMENES_FISCALES = ['', 'R-99-PN', 'R-48'];
const RESPONSABILIDADES_TRIBUTARIAS = ['', 'O-13', 'O-15', 'O-23', 'O-47', 'R-99-PN', 'ZZ-No aplica'];

const DEPARTAMENTOS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar',
  'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
  'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vaupés', 'Vichada',
];

/**
 * CustomerForm Component - Facturación Electrónica Colombia (DIAN)
 * US-CUST-001: Formulario de Registro de Cliente
 *
 * Props:
 * - onSuccess(customer): Callback al guardar exitosamente
 * - onCancel(): Callback al cancelar
 * - initialData: Datos iniciales (para modo edición)
 * - mode: 'create' | 'edit'
 */
const CustomerForm = ({ onSuccess, onCancel, initialData = null, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    tipo_documento: initialData?.tipo_documento || 'CC',
    numero_documento: initialData?.numero_documento || '',
    nombre_razon_social: initialData?.nombre_razon_social || '',
    tipo_contribuyente: initialData?.tipo_contribuyente || 'Persona Natural',
    regimen_fiscal: initialData?.regimen_fiscal || '',
    responsabilidad_tributaria: initialData?.responsabilidad_tributaria || '',
    pais: initialData?.pais || 'Colombia',
    departamento: initialData?.departamento || '',
    municipio_ciudad: initialData?.municipio_ciudad || '',
    direccion: initialData?.direccion || '',
    telefono_movil: initialData?.telefono_movil || '',
    correo: initialData?.correo || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Uniqueness check states
  const [documentoStatus, setDocumentoStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [correoStatus, setCorreoStatus] = useState(null);
  const [existingByDocumento, setExistingByDocumento] = useState(null);
  const [existingByCorreo, setExistingByCorreo] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isFormDirty = () => {
    if (!initialData) {
      return Object.values(formData).some(v => v && v.trim && v.trim() !== '');
    }
    return Object.keys(formData).some(key => formData[key] !== (initialData[key] || ''));
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'tipo_documento':
        if (!value) error = 'El tipo de documento es requerido';
        break;

      case 'numero_documento':
        if (!value || !value.trim()) {
          error = 'El número de documento es requerido';
        } else if (value.length > 20) {
          error = 'No puede exceder 20 caracteres';
        } else if (!/^[\d\-]+$/.test(value.trim())) {
          error = 'Solo dígitos y guión (-)';
        }
        break;

      case 'nombre_razon_social':
        if (!value || !value.trim()) {
          error = 'El nombre o razón social es requerido';
        } else if (value.length > 200) {
          error = 'No puede exceder 200 caracteres';
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.\-,&']+$/.test(value.trim())) {
          error = 'Solo letras, números y caracteres especiales';
        }
        break;

      case 'tipo_contribuyente':
        if (!value) error = 'El tipo de contribuyente es requerido';
        break;

      case 'correo':
        if (!value || !value.trim()) {
          error = 'El correo es requerido';
        } else if (value.length > 100) {
          error = 'No puede exceder 100 caracteres';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = 'Formato de correo inválido';
        }
        break;

      case 'telefono_movil':
        if (value && value.trim()) {
          if (value.length > 20) error = 'No puede exceder 20 caracteres';
          else if (!/^[\d\s\-+]+$/.test(value.trim())) error = 'Solo números, guiones, espacios y +';
        }
        break;

      case 'direccion':
        if (value && value.length > 300) error = 'No puede exceder 300 caracteres';
        break;

      case 'municipio_ciudad':
        if (value && value.length > 100) error = 'No puede exceder 100 caracteres';
        break;

      case 'pais':
        if (value && value.length > 100) error = 'No puede exceder 100 caracteres';
        break;

      case 'notes':
        if (value && value.length > 500) error = 'No puede exceder 500 caracteres';
        break;

      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitError(null);

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    if (name === 'numero_documento') {
      setDocumentoStatus(null);
      setExistingByDocumento(null);
    }
    if (name === 'correo') {
      setCorreoStatus(null);
      setExistingByCorreo(null);
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    if (name === 'numero_documento' && !error && value.trim()) {
      await checkDocumentoUniqueness(value.trim());
    }
    if (name === 'correo' && !error && value.trim()) {
      await checkCorreoUniqueness(value.trim());
    }
  };

  const checkDocumentoUniqueness = useCallback(async (numeroDocumento) => {
    setDocumentoStatus('checking');
    try {
      const result = await customerService.checkDocumento(numeroDocumento, initialData?.id);
      if (result.success) {
        if (result.data.available) {
          setDocumentoStatus('available');
          setExistingByDocumento(null);
        } else {
          setDocumentoStatus('taken');
          setExistingByDocumento(result.data.existing_customer || null);
          setErrors(prev => ({ ...prev, numero_documento: 'Este número de documento ya está registrado' }));
        }
      }
    } catch {
      setDocumentoStatus(null);
    }
  }, [initialData?.id]);

  const checkCorreoUniqueness = useCallback(async (correo) => {
    setCorreoStatus('checking');
    try {
      const result = await customerService.checkCorreo(correo, initialData?.id);
      if (result.success) {
        if (result.data.available) {
          setCorreoStatus('available');
          setExistingByCorreo(null);
        } else {
          setCorreoStatus('taken');
          setExistingByCorreo(result.data.existing_customer || null);
          setErrors(prev => ({ ...prev, correo: 'Este correo ya está registrado' }));
        }
      }
    } catch {
      setCorreoStatus(null);
    }
  }, [initialData?.id]);

  const validateAll = () => {
    const newErrors = {};
    const requiredFields = ['tipo_documento', 'numero_documento', 'nombre_razon_social', 'tipo_contribuyente', 'correo'];

    const newTouched = {};
    requiredFields.forEach(field => { newTouched[field] = true; });
    setTouched(prev => ({ ...prev, ...newTouched }));

    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    const requiredFields = ['tipo_documento', 'numero_documento', 'nombre_razon_social', 'tipo_contribuyente', 'correo'];
    const allRequiredFilled = requiredFields.every(field => formData[field] && formData[field].trim());
    const noErrors = Object.values(errors).every(e => !e);
    const uniquenessOk = documentoStatus !== 'taken' && correoStatus !== 'taken';
    return allRequiredFilled && noErrors && uniquenessOk;
  };

  const hasChanges = () => {
    if (!initialData) return true;
    return Object.keys(formData).some(key => {
      const currentValue = formData[key]?.trim() || '';
      const initialValue = initialData[key]?.trim() || '';
      return currentValue !== initialValue;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) return;
    if (documentoStatus === 'taken' || correoStatus === 'taken') return;

    if (mode === 'edit' && !hasChanges()) {
      setSubmitError('No hay cambios para guardar');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento.trim(),
        nombre_razon_social: formData.nombre_razon_social.trim(),
        tipo_contribuyente: formData.tipo_contribuyente,
        correo: formData.correo.trim(),
        telefono_movil: formData.telefono_movil?.trim() || null,
        pais: formData.pais?.trim() || 'Colombia',
        departamento: formData.departamento?.trim() || null,
        municipio_ciudad: formData.municipio_ciudad?.trim() || null,
        direccion: formData.direccion?.trim() || null,
        regimen_fiscal: formData.regimen_fiscal || null,
        responsabilidad_tributaria: formData.responsabilidad_tributaria || null,
        notes: formData.notes?.trim() || null,
      };

      let result;
      if (mode === 'edit' && initialData?.id) {
        result = await customerService.updateCustomer(initialData.id, submitData);
      } else {
        result = await customerService.createCustomer(submitData);
      }

      if (result.success) {
        onSuccess(result.data);
      } else {
        setSubmitError(result.error?.message || (mode === 'edit' ? 'Error al actualizar cliente' : 'Error al registrar cliente'));
      }
    } catch (error) {
      if (error.error?.code === 'DUPLICATE_DOCUMENTO') {
        setErrors(prev => ({ ...prev, numero_documento: 'Este número de documento ya está registrado por otro cliente' }));
        setDocumentoStatus('taken');
      } else if (error.error?.code === 'DUPLICATE_CORREO') {
        setErrors(prev => ({ ...prev, correo: 'Este correo ya está registrado por otro cliente' }));
        setCorreoStatus('taken');
      } else if (error.error?.details) {
        const backendErrors = {};
        Object.entries(error.error.details).forEach(([field, messages]) => {
          backendErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(prev => ({ ...prev, ...backendErrors }));
      } else {
        setSubmitError(error.error?.message || (mode === 'edit' ? 'Error al actualizar cliente' : 'Error al registrar cliente'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isFormDirty()) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

  const getStatusAdornment = (status) => {
    if (status === 'checking') return <InputAdornment position="end"><CircularProgress size={20} /></InputAdornment>;
    if (status === 'available') return <InputAdornment position="end"><CheckIcon sx={{ color: 'success.main' }} /></InputAdornment>;
    if (status === 'taken') return <InputAdornment position="end"><CloseIcon sx={{ color: 'error.main' }} /></InputAdornment>;
    return null;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {submitError && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="body2">{submitError}</Typography>
        </Paper>
      )}

      {/* Sección 1: Identificación */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BadgeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Identificación</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <TextField
              required
              fullWidth
              select
              label="Tipo de Documento"
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tipo_documento && !!errors.tipo_documento}
              helperText={touched.tipo_documento && errors.tipo_documento}
            >
              {TIPOS_DOCUMENTO.map(tipo => (
                <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              required
              fullWidth
              label="Número de Documento"
              name="numero_documento"
              value={formData.numero_documento}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.numero_documento && !!errors.numero_documento}
              helperText={
                touched.numero_documento && errors.numero_documento ? (
                  <>
                    {errors.numero_documento}
                    {documentoStatus === 'taken' && existingByDocumento && (
                      <>
                        {' - '}
                        <Link
                          component="button"
                          type="button"
                          variant="body2"
                          onClick={() => window.open(`/customers/${existingByDocumento.id}`, '_blank')}
                        >
                          Ver cliente existente
                        </Link>
                      </>
                    )}
                  </>
                ) : (formData.tipo_documento === 'NIT' ? 'Ej: 900123456-1' : '')
              }
              InputProps={{ endAdornment: getStatusAdornment(documentoStatus) }}
              inputProps={{ maxLength: 20 }}
              placeholder={formData.tipo_documento === 'NIT' ? '900123456-1' : '1234567890'}
            />
          </Grid>

          <Grid item xs={12} md={5}>
            <TextField
              required
              fullWidth
              label="Nombre / Razón Social"
              name="nombre_razon_social"
              value={formData.nombre_razon_social}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.nombre_razon_social && !!errors.nombre_razon_social}
              helperText={touched.nombre_razon_social && errors.nombre_razon_social}
              inputProps={{ maxLength: 200 }}
              placeholder={formData.tipo_contribuyente === 'Persona Jurídica' ? 'Empresa S.A.S.' : 'Juan Pérez García'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              required
              fullWidth
              select
              label="Tipo de Contribuyente"
              name="tipo_contribuyente"
              value={formData.tipo_contribuyente}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tipo_contribuyente && !!errors.tipo_contribuyente}
              helperText={touched.tipo_contribuyente && errors.tipo_contribuyente}
            >
              {TIPOS_CONTRIBUYENTE.map(tipo => (
                <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Sección 2: Información Fiscal */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FiscalIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Información Fiscal <Typography component="span" variant="body2" color="text.secondary">(opcional)</Typography></Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Régimen Fiscal"
              name="regimen_fiscal"
              value={formData.regimen_fiscal}
              onChange={handleChange}
            >
              <MenuItem value="">— Sin especificar —</MenuItem>
              {REGIMENES_FISCALES.filter(r => r).map(r => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Responsabilidad Tributaria"
              name="responsabilidad_tributaria"
              value={formData.responsabilidad_tributaria}
              onChange={handleChange}
            >
              <MenuItem value="">— Sin especificar —</MenuItem>
              {RESPONSABILIDADES_TRIBUTARIAS.filter(r => r).map(r => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Sección 3: Ubicación */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Ubicación <Typography component="span" variant="body2" color="text.secondary">(opcional)</Typography></Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="País"
              name="pais"
              value={formData.pais}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.pais && !!errors.pais}
              helperText={touched.pais && errors.pais}
              inputProps={{ maxLength: 100 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Departamento"
              name="departamento"
              value={formData.departamento}
              onChange={handleChange}
            >
              <MenuItem value="">— Seleccionar —</MenuItem>
              {DEPARTAMENTOS.map(dep => (
                <MenuItem key={dep} value={dep}>{dep}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Municipio / Ciudad"
              name="municipio_ciudad"
              value={formData.municipio_ciudad}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.municipio_ciudad && !!errors.municipio_ciudad}
              helperText={touched.municipio_ciudad && errors.municipio_ciudad}
              inputProps={{ maxLength: 100 }}
              placeholder="Ej: Medellín"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dirección"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.direccion && !!errors.direccion}
              helperText={touched.direccion && errors.direccion}
              inputProps={{ maxLength: 300 }}
              placeholder="Calle / Carrera, número, barrio"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Sección 4: Contacto y Notas */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ContactIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Contacto y Notas</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Teléfono Móvil"
              name="telefono_movil"
              value={formData.telefono_movil}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.telefono_movil && !!errors.telefono_movil}
              helperText={touched.telefono_movil && errors.telefono_movil}
              inputProps={{ maxLength: 20 }}
              placeholder="+57 300 123 4567"
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              required
              fullWidth
              label="Correo Electrónico"
              name="correo"
              type="email"
              value={formData.correo}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.correo && !!errors.correo}
              helperText={
                touched.correo && errors.correo ? (
                  <>
                    {errors.correo}
                    {correoStatus === 'taken' && existingByCorreo && (
                      <>
                        {' - '}
                        <Link
                          component="button"
                          type="button"
                          variant="body2"
                          onClick={() => window.open(`/customers/${existingByCorreo.id}`, '_blank')}
                        >
                          Ver cliente existente
                        </Link>
                      </>
                    )}
                  </>
                ) : ''
              }
              InputProps={{ endAdornment: getStatusAdornment(correoStatus) }}
              inputProps={{ maxLength: 100 }}
              placeholder="correo@empresa.com"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notas"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.notes && !!errors.notes}
              helperText={
                touched.notes && errors.notes
                  ? errors.notes
                  : `${formData.notes.length}/500 caracteres`
              }
              inputProps={{ maxLength: 500 }}
              placeholder="Información adicional sobre el cliente..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={isSubmitting || !isFormValid()}
        >
          {isSubmitting
            ? 'Guardando...'
            : (mode === 'edit' ? 'Guardar Cambios' : 'Guardar Cliente')}
        </Button>
      </Box>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Descartar Cambios</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hay datos sin guardar en el formulario. ¿Desea descartar los cambios?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>
            Seguir Editando
          </Button>
          <Button onClick={onCancel} color="error" variant="contained">
            Descartar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerForm;
