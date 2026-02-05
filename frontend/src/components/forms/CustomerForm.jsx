import { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  TextField,
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
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as AddressIcon,
  Notes as NotesIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import customerService from '../../services/customerService';

/**
 * CustomerForm Component
 * US-CUST-001: Formulario de Registro de Cliente
 *
 * Props:
 * - onSuccess(customer): Callback al guardar exitosamente
 * - onCancel(): Callback al cancelar
 * - initialData: Datos iniciales (para modo edición)
 * - mode: 'create' | 'edit'
 */
const CustomerForm = ({ onSuccess, onCancel, initialData = null, mode = 'create' }) => {
  // CA-2, CA-3, CA-4: Form state
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    secondary_phone: initialData?.secondary_phone || '',
    address_street: initialData?.address_street || '',
    address_city: initialData?.address_city || '',
    address_postal_code: initialData?.address_postal_code || '',
    address_country: initialData?.address_country || 'México',
    notes: initialData?.notes || '',
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // CA-5: Email uniqueness check state
  const [emailStatus, setEmailStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [existingCustomer, setExistingCustomer] = useState(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // CA-10: Cancel confirmation dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Check if form has been modified
  const isFormDirty = () => {
    if (!initialData) {
      return Object.values(formData).some(v => v && v.trim && v.trim() !== '');
    }
    return Object.keys(formData).some(key => formData[key] !== (initialData[key] || ''));
  };

  // CA-8: Real-time validation
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'full_name':
        if (!value || !value.trim()) {
          error = 'El nombre completo es requerido';
        } else if (value.length > 200) {
          error = 'El nombre no puede exceder 200 caracteres';
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-]+$/.test(value.trim())) {
          error = 'El nombre solo puede contener letras y espacios';
        }
        break;

      case 'email':
        if (!value || !value.trim()) {
          error = 'El email es requerido';
        } else if (value.length > 100) {
          error = 'El email no puede exceder 100 caracteres';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = 'Formato de email inválido';
        }
        break;

      case 'phone':
        if (!value || !value.trim()) {
          error = 'El teléfono es requerido';
        } else if (value.length > 20) {
          error = 'El teléfono no puede exceder 20 caracteres';
        } else if (!/^[\d\s\-()+ ]+$/.test(value.trim())) {
          error = 'Solo números, guiones, paréntesis y espacios';
        }
        break;

      case 'secondary_phone':
        if (value && value.trim()) {
          if (value.length > 20) {
            error = 'El teléfono no puede exceder 20 caracteres';
          } else if (!/^[\d\s\-()+ ]+$/.test(value.trim())) {
            error = 'Solo números, guiones, paréntesis y espacios';
          }
        }
        break;

      case 'address_street':
        if (!value || !value.trim()) {
          error = 'La dirección es requerida';
        } else if (value.length > 300) {
          error = 'La dirección no puede exceder 300 caracteres';
        }
        break;

      case 'address_city':
        if (!value || !value.trim()) {
          error = 'La ciudad es requerida';
        } else if (value.length > 100) {
          error = 'La ciudad no puede exceder 100 caracteres';
        }
        break;

      case 'address_postal_code':
        if (!value || !value.trim()) {
          error = 'El código postal es requerido';
        } else if (value.length > 20) {
          error = 'El código postal no puede exceder 20 caracteres';
        } else if (!/^[\d\-\s]+$/.test(value.trim())) {
          error = 'Solo números y guiones';
        }
        break;

      case 'address_country':
        if (!value || !value.trim()) {
          error = 'El país es requerido';
        } else if (value.length > 100) {
          error = 'El país no puede exceder 100 caracteres';
        }
        break;

      case 'notes':
        if (value && value.length > 500) {
          error = 'Las notas no pueden exceder 500 caracteres';
        }
        break;

      default:
        break;
    }

    return error;
  };

  // Handle field change with real-time validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitError(null);

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    // Reset email status when email changes
    if (name === 'email') {
      setEmailStatus(null);
      setExistingCustomer(null);
    }
  };

  // Handle field blur - validate and check email uniqueness
  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    // CA-5: Check email uniqueness on blur
    if (name === 'email' && !error && value.trim()) {
      await checkEmailUniqueness(value.trim());
    }
  };

  // CA-5: Email uniqueness check
  const checkEmailUniqueness = useCallback(async (email) => {
    setEmailStatus('checking');
    try {
      const result = await customerService.checkEmail(email, initialData?.id);
      if (result.success) {
        if (result.data.available) {
          setEmailStatus('available');
          setExistingCustomer(null);
        } else {
          setEmailStatus('taken');
          setExistingCustomer(result.data.existing_customer || null);
          setErrors(prev => ({ ...prev, email: 'Este email ya está registrado' }));
        }
      }
    } catch {
      setEmailStatus(null);
    }
  }, [initialData?.id]);

  // Validate all fields
  const validateAll = () => {
    const newErrors = {};
    const requiredFields = [
      'full_name', 'email', 'phone', 'address_street',
      'address_city', 'address_postal_code', 'address_country'
    ];

    // Mark all required fields as touched
    const newTouched = {};
    requiredFields.forEach(field => { newTouched[field] = true; });
    setTouched(prev => ({ ...prev, ...newTouched }));

    // Validate each field
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for submit button state
  const isFormValid = () => {
    const requiredFields = [
      'full_name', 'email', 'phone', 'address_street',
      'address_city', 'address_postal_code', 'address_country'
    ];

    const allRequiredFilled = requiredFields.every(
      field => formData[field] && formData[field].trim()
    );

    const noErrors = Object.values(errors).every(e => !e);
    const emailOk = emailStatus !== 'taken';

    return allRequiredFilled && noErrors && emailOk;
  };

  // CA-9: Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) return;
    if (emailStatus === 'taken') return;

    setIsSubmitting(true);

    try {
      // Build clean data
      const submitData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        secondary_phone: formData.secondary_phone?.trim() || null,
        address_street: formData.address_street.trim(),
        address_city: formData.address_city.trim(),
        address_postal_code: formData.address_postal_code.trim(),
        address_country: formData.address_country.trim(),
        notes: formData.notes?.trim() || null,
      };

      const result = await customerService.createCustomer(submitData);

      if (result.success) {
        onSuccess(result.data);
      } else {
        setSubmitError(result.error?.message || 'Error al registrar cliente');
      }
    } catch (error) {
      if (error.error?.code === 'DUPLICATE_EMAIL') {
        setErrors(prev => ({ ...prev, email: 'Este email ya está registrado' }));
        setEmailStatus('taken');
      } else if (error.error?.details) {
        // Map backend validation errors to form fields
        const backendErrors = {};
        Object.entries(error.error.details).forEach(([field, messages]) => {
          backendErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(prev => ({ ...prev, ...backendErrors }));
      } else {
        setSubmitError(error.error?.message || 'Error al registrar cliente');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // CA-10: Handle cancel
  const handleCancel = () => {
    if (isFormDirty()) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

  // Email status adornment for CA-5
  const getEmailAdornment = () => {
    if (emailStatus === 'checking') {
      return (
        <InputAdornment position="end">
          <CircularProgress size={20} />
        </InputAdornment>
      );
    }
    if (emailStatus === 'available') {
      return (
        <InputAdornment position="end">
          <CheckIcon sx={{ color: 'success.main' }} />
        </InputAdornment>
      );
    }
    if (emailStatus === 'taken') {
      return (
        <InputAdornment position="end">
          <CloseIcon sx={{ color: 'error.main' }} />
        </InputAdornment>
      );
    }
    return null;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* Submit error */}
      {submitError && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="body2">{submitError}</Typography>
        </Paper>
      )}

      {/* CA-2: Información Personal */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Información Personal</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Nombre Completo"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.full_name && !!errors.full_name}
              helperText={touched.full_name && errors.full_name}
              inputProps={{ maxLength: 200 }}
              placeholder="Ej: Juan Pérez García"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && !!errors.email}
              helperText={
                touched.email && errors.email
                  ? (
                    <>
                      {errors.email}
                      {emailStatus === 'taken' && existingCustomer && (
                        <>
                          {' - '}
                          <Link
                            component="button"
                            type="button"
                            variant="body2"
                            onClick={() => window.open(`/customers/${existingCustomer.id}`, '_blank')}
                          >
                            Ver cliente existente
                          </Link>
                        </>
                      )}
                    </>
                  )
                  : ''
              }
              InputProps={{
                endAdornment: getEmailAdornment(),
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
              }}
              inputProps={{ maxLength: 100 }}
              placeholder="correo@ejemplo.com"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              required
              fullWidth
              label="Teléfono Principal"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone && !!errors.phone}
              helperText={touched.phone && errors.phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
              }}
              inputProps={{ maxLength: 20 }}
              placeholder="(555) 123-4567"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Teléfono Secundario"
              name="secondary_phone"
              value={formData.secondary_phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.secondary_phone && !!errors.secondary_phone}
              helperText={touched.secondary_phone && errors.secondary_phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
              }}
              inputProps={{ maxLength: 20 }}
              placeholder="(Opcional)"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* CA-3: Dirección Completa */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AddressIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Dirección</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Calle / Dirección"
              name="address_street"
              value={formData.address_street}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.address_street && !!errors.address_street}
              helperText={touched.address_street && errors.address_street}
              inputProps={{ maxLength: 300 }}
              placeholder="Calle, número, colonia, referencias"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              required
              fullWidth
              label="Ciudad"
              name="address_city"
              value={formData.address_city}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.address_city && !!errors.address_city}
              helperText={touched.address_city && errors.address_city}
              inputProps={{ maxLength: 100 }}
              placeholder="Ej: Ciudad de México"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              required
              fullWidth
              label="Código Postal"
              name="address_postal_code"
              value={formData.address_postal_code}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.address_postal_code && !!errors.address_postal_code}
              helperText={touched.address_postal_code && errors.address_postal_code}
              inputProps={{ maxLength: 20 }}
              placeholder="Ej: 06600"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              required
              fullWidth
              label="País"
              name="address_country"
              value={formData.address_country}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.address_country && !!errors.address_country}
              helperText={touched.address_country && errors.address_country}
              inputProps={{ maxLength: 100 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* CA-4: Información Adicional */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotesIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Información Adicional</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

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
      </Paper>

      {/* CA-9: Action Buttons */}
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
          {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
        </Button>
      </Box>

      {/* CA-10: Cancel Confirmation Dialog */}
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
