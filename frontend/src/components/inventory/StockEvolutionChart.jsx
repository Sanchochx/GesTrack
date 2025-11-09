import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * US-INV-003 CA-4: Stock Evolution Chart Component
 *
 * Gráfico de línea que muestra la evolución del stock de un producto en el tiempo
 *
 * Nota: Este componente intentará usar Recharts si está disponible,
 * de lo contrario mostrará una tabla simple
 */

// Intentar importar Recharts
let LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend;
let rechartsAvailable = false;

try {
  const recharts = require('recharts');
  LineChart = recharts.LineChart;
  Line = recharts.Line;
  XAxis = recharts.XAxis;
  YAxis = recharts.YAxis;
  CartesianGrid = recharts.CartesianGrid;
  Tooltip = recharts.Tooltip;
  ResponsiveContainer = recharts.ResponsiveContainer;
  Legend = recharts.Legend;
  rechartsAvailable = true;
} catch (e) {
  rechartsAvailable = false;
}

const StockEvolutionChart = ({ data = [], loading = false, error = null, title = "Evolución de Stock" }) => {
  // Formatear datos para Recharts
  const formatDataForChart = () => {
    return data.map(point => ({
      ...point,
      dateFormatted: format(new Date(point.date), 'dd/MM HH:mm', { locale: es }),
      dateShort: format(new Date(point.date), 'dd/MM', { locale: es })
    }));
  };

  const chartData = formatDataForChart();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight="bold">
            {data.dateFormatted}
          </Typography>
          <Typography variant="body2" color="primary">
            Stock: {data.stock} unidades
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tipo: {data.movement_type}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Cantidad: {data.quantity > 0 ? '+' : ''}{data.quantity}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Mostrar loading
  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Cargando datos del gráfico...
        </Typography>
      </Paper>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  // Sin datos
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No hay datos suficientes para mostrar el gráfico
        </Typography>
      </Paper>
    );
  }

  // Si Recharts está disponible, usar gráfico
  if (rechartsAvailable) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="dateShort"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              label={{ value: 'Stock (unidades)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="stock"
              stroke="#2e7d32"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Stock"
            />
          </LineChart>
        </ResponsiveContainer>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Mostrando últimos {data.length} movimientos
        </Typography>
      </Paper>
    );
  }

  // Fallback: Tabla simple si Recharts no está disponible
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Para visualizar el gráfico, instale la librería recharts: <code>npm install recharts</code>
      </Alert>
      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Fecha</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Stock</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tipo</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Cambio</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((point, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{point.dateFormatted}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{point.stock}</td>
                <td style={{ padding: '8px' }}>{point.movement_type}</td>
                <td style={{
                  padding: '8px',
                  textAlign: 'right',
                  color: point.quantity > 0 ? '#2e7d32' : '#d32f2f'
                }}>
                  {point.quantity > 0 ? '+' : ''}{point.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Paper>
  );
};

export default StockEvolutionChart;
