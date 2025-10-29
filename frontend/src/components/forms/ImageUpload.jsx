import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  IconButton,
  Alert,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

/**
 * ImageUpload Component
 * US-PROD-001 - CA-5: Image upload with validation and preview
 *
 * Reusable component for uploading and previewing images
 * Validates format (JPG, PNG, WEBP) and size (max 5MB)
 */
const ImageUpload = ({ value, onChange, error, helperText }) => {
  const [preview, setPreview] = useState(null);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  // Supported formats and max size (5MB)
  const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  /**
   * Validates image file
   * @param {File} file - File to validate
   * @returns {string|null} - Error message or null if valid
   */
  const validateImage = (file) => {
    if (!file) return null;

    // Validate format
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return 'Formato no soportado. Use JPG, PNG o WEBP';
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return `El archivo excede el tamaño máximo de ${MAX_SIZE_MB}MB`;
    }

    return null;
  };

  /**
   * Handles file selection
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Validate file
    const error = validateImage(file);
    if (error) {
      setValidationError(error);
      setPreview(null);
      onChange(null);
      return;
    }

    // Clear validation error
    setValidationError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onChange(file);
  };

  /**
   * Handles file removal
   */
  const handleRemove = () => {
    setPreview(null);
    setValidationError('');
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Opens file picker
   */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_FORMATS.join(',')}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Preview or Placeholder */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
            border: error || validationError ? '2px dashed #d32f2f' : '2px dashed #ccc',
            borderRadius: 2,
            backgroundColor: '#f5f5f5',
            position: 'relative',
          }}
        >
          {preview ? (
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  maxHeight: 300,
                }}
              />
              <IconButton
                onClick={handleRemove}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  },
                }}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                padding: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#e0e0e0',
                }}
              >
                <ImageIcon sx={{ fontSize: 40, color: '#9e9e9e' }} />
              </Avatar>
              <Typography variant="body2" color="textSecondary" align="center">
                No hay imagen seleccionada
              </Typography>
              <Typography variant="caption" color="textSecondary" align="center">
                Formatos: JPG, PNG, WEBP (máx. 5MB)
              </Typography>
            </Box>
          )}
        </Box>

        {/* Upload/Change Button */}
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleClick}
          fullWidth
        >
          {preview ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
        </Button>

        {/* Validation Errors */}
        {(validationError || (error && helperText)) && (
          <Alert severity="error">
            {validationError || helperText}
          </Alert>
        )}

        {/* Info */}
        {!preview && !validationError && !error && (
          <Typography variant="caption" color="textSecondary" align="center">
            La imagen es opcional. Si no se proporciona, se usará una imagen por defecto.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ImageUpload;
