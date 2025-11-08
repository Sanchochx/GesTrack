import React, { useState, useRef, useEffect } from 'react';
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
 * US-PROD-005 - CA-6: Support for current image display and update
 * US-PROD-009 - CA-3: Drag and drop support
 *
 * Reusable component for uploading and previewing images
 * Validates format (JPG, PNG, WEBP) and size (max 5MB)
 * Supports displaying current image when editing
 * Supports drag and drop file upload
 */
const ImageUpload = ({
  value,
  onChange,
  error,
  helperText,
  currentImageUrl = null,  // US-PROD-005: Current image URL when editing
  showChangeButton = false // US-PROD-005: Show change button for existing image
}) => {
  const [preview, setPreview] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isDragging, setIsDragging] = useState(false); // US-PROD-009 CA-3: Drag state
  const fileInputRef = useRef(null);

  // Supported formats and max size (5MB)
  const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  // US-PROD-005 CA-6: Set initial preview from currentImageUrl
  useEffect(() => {
    if (currentImageUrl && !preview && !value) {
      setPreview(currentImageUrl);
    }
  }, [currentImageUrl]);

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
      setPreview(currentImageUrl); // Restore current image if validation fails
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
   * US-PROD-005 CA-6: Restore current image when removing new selection
   */
  const handleRemove = () => {
    setPreview(currentImageUrl || null); // Restore current image or null
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

  /**
   * US-PROD-009 CA-3: Handle drag events
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validate file
      const error = validateImage(file);
      if (error) {
        setValidationError(error);
        setPreview(currentImageUrl);
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
    }
  };

  // Determine if showing current image (not a new upload)
  const isShowingCurrentImage = preview === currentImageUrl && !value;

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
        {/* US-PROD-009 CA-3: Add drag-and-drop handlers and visual feedback */}
        <Box
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={!preview ? handleClick : undefined}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
            border: error || validationError
              ? '2px dashed #d32f2f'
              : isDragging
              ? '2px dashed #4CAF50'
              : '2px dashed #ccc',
            borderRadius: 2,
            backgroundColor: isDragging ? '#e8f5e9' : '#f5f5f5',
            position: 'relative',
            cursor: !preview ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
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
              {/* US-PROD-005 CA-6: Only show delete button if it's a new upload */}
              {!isShowingCurrentImage && (
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
                  title="Cancelar y mantener imagen actual"
                >
                  <DeleteIcon />
                </IconButton>
              )}
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
                  backgroundColor: isDragging ? '#4CAF50' : '#e0e0e0',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <ImageIcon sx={{ fontSize: 40, color: isDragging ? '#fff' : '#9e9e9e' }} />
              </Avatar>
              {/* US-PROD-009 CA-3: Drag and drop text */}
              <Typography variant="body2" color="textSecondary" align="center">
                {isDragging
                  ? 'Suelta la imagen aquí'
                  : 'Arrastra una imagen o haz clic para seleccionar'}
              </Typography>
              <Typography variant="caption" color="textSecondary" align="center">
                JPG, PNG, WEBP (máx. 5MB)
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
          {/* US-PROD-005 CA-6: Show appropriate button text */}
          {showChangeButton && isShowingCurrentImage
            ? 'Cambiar Imagen'
            : preview && !isShowingCurrentImage
            ? 'Cambiar Imagen Seleccionada'
            : 'Seleccionar Imagen'}
        </Button>

        {/* US-PROD-005 CA-6: Info about current image */}
        {isShowingCurrentImage && (
          <Typography variant="caption" color="textSecondary" align="center">
            Imagen actual del producto. Selecciona una nueva imagen para reemplazarla.
          </Typography>
        )}

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
