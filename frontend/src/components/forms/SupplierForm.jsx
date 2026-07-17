import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Category as CategoryIcon,
  AccountBalance as PaymentIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import supplierService from '../../services/supplierService';
import categoryService from '../../services/categoryService';

const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;

/**
 * SupplierForm Component
 * US-SUPP-001: Formulario de Registro de Proveedor
 *
 * Props:
 * - onSuccess(supplier): Callback al guardar exitosamente
 * - onCancel(): Callback al cancelar
 */
const SupplierForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    payment_bank: '',
    payment_account: '',
    payment_terms: '',
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await categoryService.getCategories();
        if (result.success) setAvailableCategories(result.data);
      } catch {
        // silencioso — el campo de categorías es opcional
      }
    };
    loadCategories();
  }, []);

  const isFormDirty = () =>
    Object.values(formData).some(v => v && v.trim && v.trim() !== '') || selectedCategories.length > 0;

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'company_name':
        if (!value || !value.trim()) error = 'El nombre de la empresa es requerido';
        else if (value.length > 200) error = 'No puede exceder 200 caracteres';
        break;

      case 'contact_name':
        if (!value || !value.trim()) error = 'El nombre de contacto es requerido';
        else if (value.length > 200) error = 'No puede exceder 200 caracteres';
        break;

      case 'email':
        if (!value || !value.trim()) {
          error = 'El correo es requerido';
        } else if (value.length > 120) {
          error = 'No puede exceder 120 caracteres';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = 'Formato de correo inválido';
        }
        break;

      case 'phone':
        if (!value || !value.trim()) {
          error = 'El teléfono es requerido';
        } else if (value.length > 20) {
          error = 'No puede exceder 20 caracteres';
        } else if (!/^[\d\s\-+()]+$/.test(value.trim())) {
          error = 'Solo números, espacios, guiones, paréntesis y +';
        }
        break;

      case 'address':
        if (value && value.length > 300) error = 'No puede exceder 300 caracteres';
        break;

      case 'website':
        if (value && value.trim()) {
          if (value.length > 300) error = 'No puede exceder 300 caracteres';
          else if (!URL_REGEX.test(value.trim())) error = 'Formato de sitio web inválido';
        }
        break;

      case 'payment_bank':
        if (value && value.length > 100) error = 'No puede exceder 100 caracteres';
        break;

      case 'payment_account':
        if (value && value.length > 50) error = 'No puede exceder 50 caracteres';
        break;

      case 'payment_terms':
        if (value && value.length > 200) error = 'No puede exceder 200 caracteres';
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
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const newErrors = {};
    const requiredFields = ['company_name', 'contact_name', 'email', 'phone'];

    const newTouched = {};
    Object.keys(formData).forEach(field => { newTouched[field] = true; });
    setTouched(prev => ({ ...prev, ...newTouched }));

    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && requiredFields.every(f => formData[f]?.trim());
  };

  const isFormValid = () => {
    const requiredFields = ['company_name', 'contact_name', 'email', 'phone'];
    const allRequiredFilled = requiredFields.every(field => formData[field] && formData[field].trim());
    const noErrors = Object.values(errors).every(e => !e);
    return allRequiredFilled && noErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) return;

    setIsSubmitting(true);

    try {
      const submitData = {
        company_name: formData.company_name.trim(),
        contact_name: formData.contact_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address?.trim() || null,
        website: formData.website?.trim() || null,
        category_ids: selectedCategories.map(c => c.id),
        payment_bank: formData.payment_bank?.trim() || null,
        payment_account: formData.payment_account?.trim() || null,
        payment_terms: formData.payment_terms?.trim() || null,
      };

      const result = await supplierService.createSupplier(submitData);

      if (result.success) {
        onSuccess(result.data);
      } else {
        setSubmitError(result.error?.message || 'Error al registrar proveedor');
      }
    } catch (error) {
      if (error.error?.code === 'DUPLICATE_EMAIL') {
        setErrors(prev => ({ ...prev, email: 'Este correo ya está registrado por otro proveedor' }));
      } else if (error.error?.details) {
        const backendErrors = {};
        Object.entries(error.error.details).forEach(([field, messages]) => {
          backendErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(prev => ({ ...prev, ...backendErrors }));
      } else {
        setSubmitError(error.error?.message || 'Error al registrar proveedor');
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

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {submitError && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="body2">{submitError}</Typography>
        </Paper>
      )}

      {/* Sección 1: Datos de Contacto */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Datos de Contacto</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Nombre de la Empresa"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.company_name && !!errors.company_name}
              helperText={touched.company_name && errors.company_name}
              inputProps={{ maxLength: 200 }}
              placeholder="Distribuidora ABC S.A.S."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Nombre de Contacto"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.contact_name && !!errors.contact_name}
              helperText={touched.contact_name && errors.contact_name}
              inputProps={{ maxLength: 200 }}
              placeholder="Juan Pérez"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Correo Electrónico"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && !!errors.email}
              helperText={touched.email && errors.email}
              inputProps={{ maxLength: 120 }}
              placeholder="contacto@proveedor.com"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Teléfono"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone && !!errors.phone}
              helperText={touched.phone && errors.phone}
              inputProps={{ maxLength: 20 }}
              placeholder="+57 300 123 4567"
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Dirección"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.address && !!errors.address}
              helperText={touched.address && errors.address}
              inputProps={{ maxLength: 300 }}
              placeholder="Calle / Carrera, número, ciudad"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Sitio Web"
              name="website"
              value={formData.website}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.website && !!errors.website}
              helperText={touched.website && errors.website}
              inputProps={{ maxLength: 300 }}
              placeholder="www.proveedor.com"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Sección 2: Categorías de Productos */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Categorías de Productos{' '}
            <Typography component="span" variant="body2" color="text.secondary">(opcional)</Typography>
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Autocomplete
          multiple
          options={availableCategories}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={selectedCategories}
          onChange={(_e, value) => setSelectedCategories(value)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label="Categorías que provee" placeholder="Seleccionar categorías" />
          )}
        />
      </Paper>

      {/* Sección 3: Información de Pago */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PaymentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Información de Pago{' '}
            <Typography component="span" variant="body2" color="text.secondary">(opcional)</Typography>
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Banco"
              name="payment_bank"
              value={formData.payment_bank}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.payment_bank && !!errors.payment_bank}
              helperText={touched.payment_bank && errors.payment_bank}
              inputProps={{ maxLength: 100 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Número de Cuenta"
              name="payment_account"
              value={formData.payment_account}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.payment_account && !!errors.payment_account}
              helperText={touched.payment_account && errors.payment_account}
              inputProps={{ maxLength: 50 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Condiciones de Pago"
              name="payment_terms"
              value={formData.payment_terms}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.payment_terms && !!errors.payment_terms}
              helperText={touched.payment_terms && errors.payment_terms}
              inputProps={{ maxLength: 200 }}
              placeholder="30 días crédito"
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
          {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
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

export default SupplierForm;
