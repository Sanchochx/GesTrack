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

  // Colores para el gráfico de pastel
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#795548', // Brown
    '#607D8B'  // Blue Grey
  ];

  // Preparar datos para el gráfico de pastel
  const chartData = categories.map(cat => ({
    name: cat.category_name,
    value: cat.total_value,
    percentage: cat.percentage
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
            Valor: ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary" align="center">
            No hay datos disponibles
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Distribución por Categoría
        </Typography>

        {/* Gráfico de Pastel */}
        <Box sx={{ height: 300, mb: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Tabla de Categorías */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Categoría</TableCell>
                <TableCell align="right">Productos</TableCell>
                <TableCell align="right">Unidades</TableCell>
                <TableCell align="right">Valor Total</TableCell>
                <TableCell align="right">% del Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category, index) => (
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
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {category.formatted_value}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${category.percentage.toFixed(1)}%`}
                      size="small"
                      sx={{
                        backgroundColor: `${COLORS[index % COLORS.length]}20`,
                        color: COLORS[index % COLORS.length],
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default CategoryValueBreakdown;
