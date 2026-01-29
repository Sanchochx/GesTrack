/**
 * US-INV-005 CA-4: Gráfico de Evolución Temporal del Valor del Inventario
 *
 * Muestra la evolución del valor del inventario en el tiempo
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  TextField
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import inventoryService from '../../services/inventoryService';

/**
 * Componente para mostrar la evolución del valor del inventario
 */
const ValueEvolutionChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evolutionData, setEvolutionData] = useState([]);
  const [period, setPeriod] = useState('7d');
  const [customDateFrom, setCustomDateFrom] = useState(null);
  const [customDateTo, setCustomDateTo] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchEvolution();

    // CA-6: Set up polling (every 5 minutes)
    const intervalId = setInterval(() => {
      fetchEvolution();
    }, 5 * 60 * 1000); // 5 minutes

    // CA-6: Page visibility handling - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, fetch fresh data
        fetchEvolution();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount or dependency change
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [period, customDateFrom, customDateTo]);

  const fetchEvolution = async () => {
    try {
      setLoading(true);
      setError(null);

      let dateFrom = null;
      let dateTo = null;

      if (period === 'custom' && customDateFrom && customDateTo) {
        dateFrom = customDateFrom.toISOString();
        dateTo = customDateTo.toISOString();
      }

      const response = await inventoryService.getValueEvolution(period, dateFrom, dateTo);
      setEvolutionData(response.data || []);
    } catch (err) {
      console.error('Error fetching value evolution:', err);
      setError(err.error?.message || 'Error al cargar evolución');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  // Formatear datos para el gráfico
  const chartData = evolutionData.map(item => ({
    date: new Date(item.snapshot_date).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      ...(period === '1y' || period === 'custom' ? { year: '2-digit' } : {})
    }),
    value: item.total_value,
    products: item.total_products,
    quantity: item.total_quantity
  }));

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" gutterBottom>
            {data.date}
          </Typography>
          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Valor: ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Productos: {data.products}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Unidades: {data.quantity.toLocaleString()}
          </Typography>
        </Card>
      );
    }
    return null;
  };

  // Formatear valores del eje Y
  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Evolución del Valor del Inventario
          </Typography>

          {/* Selector de Período */}
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriodChange}
            size="small"
          >
            <ToggleButton value="7d">7 días</ToggleButton>
            <ToggleButton value="30d">30 días</ToggleButton>
            <ToggleButton value="3m">3 meses</ToggleButton>
            <ToggleButton value="1y">1 año</ToggleButton>
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Date Pickers para período custom */}
        {period === 'custom' && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha inicial"
                value={customDateFrom}
                onChange={(newValue) => setCustomDateFrom(newValue)}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
              <DatePicker
                label="Fecha final"
                value={customDateTo}
                onChange={(newValue) => setCustomDateTo(newValue)}
                renderInput={(params) => <TextField {...params} size="small" />}
                minDate={customDateFrom}
              />
            </LocalizationProvider>
          </Box>
        )}

        {/* Gráfico */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : evolutionData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <Typography color="text.secondary">
              No hay datos históricos disponibles para este período
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1976d2"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Valor del Inventario"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ValueEvolutionChart;
