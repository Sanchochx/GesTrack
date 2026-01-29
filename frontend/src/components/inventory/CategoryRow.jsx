/**
 * US-INV-006 CA-1, CA-2, CA-3, CA-5, CA-7: Fila Expandible de Categoría
 *
 * Componente para mostrar una categoría con sus productos en formato expandible
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Collapse,
  Box,
  Typography,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * Componente de fila de categoría expandible
 */
const CategoryRow = ({ category, expanded, products, onToggle, loading, onExport }) => {
  const navigate = useNavigate();

  // CA-5: Obtener contadores de estado de stock
  const getStockBadges = () => {
    const badges = [];

    if (category.products_in_stock > 0) {
      badges.push({
        label: `${category.products_in_stock} en stock`,
        color: 'success',
        icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
      });
    }

    if (category.products_low_stock > 0) {
      badges.push({
        label: `${category.products_low_stock} stock bajo`,
        color: 'warning',
        icon: <WarningIcon sx={{ fontSize: 16 }} />
      });
    }

    if (category.products_out_of_stock > 0) {
      badges.push({
        label: `${category.products_out_of_stock} sin stock`,
        color: 'error',
        icon: <ErrorIcon sx={{ fontSize: 16 }} />
      });
    }

    return badges;
  };

  // CA-3: Obtener color de fila según stock_status
  const getRowColor = (status) => {
    switch (status) {
      case 'out_of_stock':
        return 'error.light';
      case 'low_stock':
        return 'warning.light';
      default:
        return 'transparent';
    }
  };

  // CA-3: Renderizar badge de stock_status
  const renderStockBadge = (status, stock) => {
    const configs = {
      out_of_stock: { label: 'Sin Stock', color: 'error', icon: <ErrorIcon sx={{ fontSize: 16 }} /> },
      low_stock: { label: 'Stock Bajo', color: 'warning', icon: <WarningIcon sx={{ fontSize: 16 }} /> },
      in_stock: { label: 'En Stock', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> }
    };

    const config = configs[status] || configs.in_stock;

    return (
      <Chip
        size="small"
        label={config.label}
        color={config.color}
        icon={config.icon}
      />
    );
  };

  // CA-7: Manejar acciones rápidas
  const handleAdjustReorderPoints = () => {
    // Navegar a ajuste de puntos de reorden para esta categoría
    navigate(`/products?category=${category.category_id}`);
  };

  const handleExportCategory = () => {
    if (onExport) {
      onExport(category.category_id, category.category_name);
    }
  };

  const handleViewHistory = () => {
    // Navegar a historial de movimientos filtrado por categoría
    navigate(`/inventory/history?category=${category.category_id}`);
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <Card sx={{ mb: 2 }}>
      {/* CA-1: Header de categoría (clickeable para expandir) */}
      <CardContent
        onClick={onToggle}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left: Información de categoría */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {/* Color indicator */}
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: category.category_color || '#1976d2',
                flexShrink: 0
              }}
            />

            {/* Category name with icon */}
            <Box>
              <Typography variant="h6" component="div">
                {category.category_icon && <span style={{ marginRight: 8 }}>{category.category_icon}</span>}
                {category.category_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {category.total_products} producto{category.total_products !== 1 ? 's' : ''} · {category.total_units} unidades
              </Typography>
            </Box>

            {/* CA-5: Stock status badges */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {getStockBadges().map((badge, index) => (
                <Chip
                  key={index}
                  size="small"
                  label={badge.label}
                  color={badge.color}
                  icon={badge.icon}
                  sx={{ fontWeight: 'medium' }}
                />
              ))}
            </Box>
          </Box>

          {/* Right: Value and expand icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" component="div" color="primary.main">
                {category.formatted_value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Valor total
              </Typography>
            </Box>

            {/* CA-2: Expand/Collapse icon */}
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
      </CardContent>

      {/* CA-2, CA-3: Contenido expandible con productos */}
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0, backgroundColor: 'grey.50' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : products && products.length > 0 ? (
            <>
              {/* CA-3: Tabla de productos */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Imagen</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell align="right">Stock Actual</TableCell>
                      <TableCell align="right">Punto Reorden</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Valor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow
                        key={product.id}
                        hover
                        onClick={() => handleProductClick(product.id)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: getRowColor(product.stock_status)
                        }}
                      >
                        <TableCell>
                          <Box
                            component="img"
                            src={product.image_url || '/placeholder.png'}
                            alt={product.name}
                            sx={{
                              width: 40,
                              height: 40,
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {product.sku}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{product.name}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {product.stock_quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {product.reorder_point}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {renderStockBadge(product.stock_status, product.stock_quantity)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {product.formatted_value}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* CA-7: Botones de acciones rápidas */}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="Ajustar puntos de reorden para productos de esta categoría">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={handleAdjustReorderPoints}
                  >
                    Ajustar Puntos de Reorden
                  </Button>
                </Tooltip>

                <Tooltip title="Exportar productos de esta categoría a Excel">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportCategory}
                    color="success"
                  >
                    Exportar Categoría
                  </Button>
                </Tooltip>

                <Tooltip title="Ver historial de movimientos de esta categoría">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<HistoryIcon />}
                    onClick={handleViewHistory}
                    color="info"
                  >
                    Ver Historial
                  </Button>
                </Tooltip>
              </Box>
            </>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No hay productos en esta categoría
              </Typography>
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default CategoryRow;
