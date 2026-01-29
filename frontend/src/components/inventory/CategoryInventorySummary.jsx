/**
 * US-INV-006 CA-6: Panel de Resumen General de Inventario por Categorías
 *
 * Muestra métricas generales del inventario agrupado por categorías
 */
import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip
} from '@mui/material';
import {
  Category as CategoryIcon,
  Inventory2 as ProductIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * Componente para mostrar resumen de métricas de inventario por categorías
 */
const CategoryInventorySummary = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return null;
  }

  const summaryCards = [
    {
      title: 'Total Categorías',
      value: metrics.total_categories || 0,
      icon: <CategoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      bgColor: 'primary.light',
      color: 'primary.main'
    },
    {
      title: 'Total Productos',
      value: metrics.total_products || 0,
      icon: <ProductIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      bgColor: 'info.light',
      color: 'info.main'
    },
    {
      title: 'Valor Total',
      value: metrics.formatted_value || '$0.00',
      icon: <MoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      bgColor: 'success.light',
      color: 'success.main',
      isFormatted: true
    },
    {
      title: 'Categorías Stock Bajo',
      value: metrics.categories_with_low_stock || 0,
      icon: <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      bgColor: 'warning.light',
      color: 'warning.main',
      badge: metrics.categories_with_low_stock > 0
    },
    {
      title: 'Categorías Sin Stock',
      value: metrics.categories_out_of_stock || 0,
      icon: <ErrorIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      bgColor: 'error.light',
      color: 'error.main',
      badge: metrics.categories_out_of_stock > 0
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Resumen General
      </Typography>
      <Grid container spacing={2}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              <CardContent>
                {/* Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 2,
                    backgroundColor: card.bgColor,
                    borderRadius: 2,
                    p: 1.5,
                    width: 'fit-content',
                    mx: 'auto'
                  }}
                >
                  {card.icon}
                </Box>

                {/* Title */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  align="center"
                  display="block"
                  gutterBottom
                >
                  {card.title}
                </Typography>

                {/* Value */}
                <Typography
                  variant={card.isFormatted ? 'h5' : 'h3'}
                  component="div"
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    color: card.color
                  }}
                >
                  {card.value}
                </Typography>

                {/* Badge for alerts */}
                {card.badge && card.value > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <Chip
                      label="Requiere atención"
                      size="small"
                      sx={{
                        backgroundColor: `${card.color}20`,
                        color: card.color,
                        fontWeight: 'medium'
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CategoryInventorySummary;
