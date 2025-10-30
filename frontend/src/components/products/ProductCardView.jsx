import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Box,
  Chip,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import StockBadge from './StockBadge';

/**
 * ProductCardView - Vista en cards para dispositivos móviles
 * Muestra los productos en un grid responsive de cards
 */
const ProductCardView = ({
  products = [],
  onView,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleMenuOpen = (event, product) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleView = () => {
    if (selectedProduct && onView) {
      onView(selectedProduct.id);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedProduct && onEdit) {
      onEdit(selectedProduct.id);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedProduct && onDelete) {
      onDelete(selectedProduct);
    }
    handleMenuClose();
  };

  const handleCardClick = (productId) => {
    if (onView) {
      onView(productId);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (products.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          color: 'text.secondary',
        }}
      >
        <Typography variant="h6">No hay productos para mostrar</Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {products.map((product) => {
          const isOutOfStock = product.stock_quantity === 0;
          const isLowStock =
            product.stock_quantity > 0 &&
            product.stock_quantity <= product.min_stock_level;

          return (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                  border: isOutOfStock
                    ? '2px solid #f44336'
                    : isLowStock
                    ? '2px solid #ff9800'
                    : '1px solid #e0e0e0',
                }}
                onClick={() => handleCardClick(product.id)}
              >
                {/* Imagen del producto */}
                <CardMedia
                  component="img"
                  height="200"
                  image={product.image_url || '/placeholder-product.png'}
                  alt={product.name}
                  loading="lazy"
                  sx={{
                    objectFit: 'cover',
                    backgroundColor: '#f5f5f5',
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder-product.png';
                  }}
                />

                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  {/* Header con nombre y menú */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        flexGrow: 1,
                        pr: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {product.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, product)}
                      sx={{ mt: -1, mr: -1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {/* SKU */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    SKU: <strong>{product.sku}</strong>
                  </Typography>

                  {/* Categoría */}
                  <Chip
                    label={product.category?.name || 'Sin categoría'}
                    size="small"
                    sx={{ mb: 2 }}
                    color="default"
                    variant="outlined"
                  />

                  <Divider sx={{ my: 1.5 }} />

                  {/* Precio */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Precio:
                    </Typography>
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    >
                      {formatPrice(product.sale_price)}
                    </Typography>
                  </Box>

                  {/* Stock */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Stock:
                    </Typography>
                    <StockBadge
                      stockQuantity={product.stock_quantity}
                      minStockLevel={product.min_stock_level}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Ver detalles</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProductCardView;
