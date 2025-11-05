import React, { useState } from 'react';
import {
  Dialog,
  IconButton,
  Box,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';

/**
 * ImageZoomModal Component
 * US-PROD-009 CA-11: Modal de zoom para imágenes
 *
 * Modal que muestra una imagen en tamaño completo con capacidad de zoom in/out
 */
const ImageZoomModal = ({ open, onClose, imageUrl, alt = 'Imagen' }) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  /**
   * Incrementa el nivel de zoom
   */
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3)); // Máximo 300%
  };

  /**
   * Decrementa el nivel de zoom
   */
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5)); // Mínimo 50%
  };

  /**
   * Resetea el zoom al cerrar
   */
  const handleClose = () => {
    setZoomLevel(1);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          boxShadow: 'none',
          maxWidth: '95vw',
          maxHeight: '95vh',
          margin: 0,
        },
      }}
      TransitionComponent={Fade}
    >
      {/* Close button */}
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'white',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Zoom controls */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          padding: 1,
          zIndex: 1,
        }}
      >
        <IconButton
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.5}
          sx={{
            color: 'white',
            '&:disabled': {
              color: 'rgba(255, 255, 255, 0.3)',
            },
          }}
          size="small"
        >
          <ZoomOutIcon />
        </IconButton>

        <Box
          sx={{
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            fontSize: '0.875rem',
            minWidth: 60,
            justifyContent: 'center',
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </Box>

        <IconButton
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
          sx={{
            color: 'white',
            '&:disabled': {
              color: 'rgba(255, 255, 255, 0.3)',
            },
          }}
          size="small"
        >
          <ZoomInIcon />
        </IconButton>
      </Box>

      {/* Image */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          overflow: 'auto',
          padding: 4,
        }}
      >
        <img
          src={imageUrl}
          alt={alt}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.2s ease',
            cursor: zoomLevel > 1 ? 'grab' : 'default',
          }}
          draggable={false}
        />
      </Box>
    </Dialog>
  );
};

export default ImageZoomModal;
