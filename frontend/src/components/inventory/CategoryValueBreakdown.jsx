/**
 * US-INV-005 CA-3: Desglose del Valor del Inventario por Categoría
 *
 * Muestra tabla y gráfico de pastel con la distribución del valor por categoría
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import inventoryService from '../../services/inventoryService';

/**
 * Componente para mostrar el desglose del valor del inventario por categoría
 */
const CategoryValueBreakdown = ({ onCategoryClick }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Initial fetch
    fetchCategoryBreakdown();

    // CA-6: Set up polling (every 5 minutes)
    const intervalId = setInterval(() => {
      fetchCategoryBreakdown();
    }, 5 * 60 * 1000); // 5 minutes

    // CA-6: Page visibility handling - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, fetch fresh data
        fetchCategoryBreakdown();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchCategoryBreakdown = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await inventoryService.getValueByCategory();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching category breakdown:', err);
      setError(err.error?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const FALLBACK_COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#9C27B0',
    '#FF9800',
    '#795548',
    '#607D8B'
  ];

  // Preparar datos para el gráfico de pastel
  const chartData = categories.map((cat, index) => ({
    name: cat.category_name,
    value: cat.total_value,
    percentage: cat.percentage,
    color: cat.category_color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  }));

  // Custom label para el gráfico
  const renderCustomLabel = ({ name, percentage }) => {
    if (percentage < 5) return null; // No mostrar label si es muy pequeño
    return `${name} (${percentage.toFixed(1)}%)`;
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" gutterBottom>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Valor: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(data.value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Porcentaje: {data.percentage.toFixed(2)}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const handleRowClick = (categoryId) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    }
  };

  const cardSx = { borderRadius: 2, elevation: 2 };

  if (loading) {
    return (
      <Card elevation={2} sx={cardSx}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={2} sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card elevation={2} sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <Typography color="text.secondary" align="center">
            No hay datos disponibles
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2} sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
          Distribución por Categoría
        </Typography>

        {/* Layout: gráfico a la izquierda, tabla a la derecha en pantallas grandes */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 3,
            alignItems: { lg: 'flex-start' }
          }}
        >
          {/* Gráfico de Pastel */}
          <Box sx={{ height: 360, flex: { lg: '0 0 360px' }, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Tabla de Categorías */}
          <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Productos</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Unidades</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Valor Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>% del Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category, index) => {
                    const color = chartData[index]?.color;
                    return (
                      <TableRow
                        key={category.category_id}
                        hover
                        onClick={() => handleRowClick(category.category_id)}
                        sx={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: color,
                                flexShrink: 0
                              }}
                            />
                            <Typography variant="body2" fontWeight={500}>
                              {category.category_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {category.product_count}
                        </TableCell>
                        <TableCell align="right">
                          {category.total_quantity.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500}>
                            {category.formatted_value}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${category.percentage.toFixed(1)}%`}
                            size="small"
                            sx={{
                              backgroundColor: `${color}20`,
                              color: color,
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoryValueBreakdown;
