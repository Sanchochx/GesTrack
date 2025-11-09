import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  Chip,
  Box,
  Tooltip,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  TrendingUp as IncreaseIcon,
  TrendingDown as DecreaseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MovementTypeChip from './MovementTypeChip';

/**
 * US-INV-003 CA-1: Movement History Table Component
 *
 * Tabla para mostrar el historial de movimientos de inventario con:
 * - Todas las columnas requeridas
 * - Paginación
 * - Indicadores visuales (CA-7)
 * - Click para detalles
 */

const MovementHistoryTable = ({
  movements = [],
  totalMovements = 0,
  page = 0,
  rowsPerPage = 50,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  loading = false
}) => {

  // Formatear fecha
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  // Formatear fecha relativa para tooltip
  const formatRelativeDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 24) {
        return `Hace ${diffHours} horas`;
      }
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays} días`;
    } catch {
      return '';
    }
  };

  // Verificar si es del día actual (CA-7)
  const isToday = (dateString) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  };

  // Renderizar cantidad con indicador visual (CA-7)
  const renderQuantity = (quantity) => {
    const isPositive = quantity > 0;
    const Icon = isPositive ? IncreaseIcon : DecreaseIcon;
    const color = isPositive ? 'success.main' : 'error.main';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Icon sx={{ fontSize: 18, color }} />
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ color }}
        >
          {isPositive ? '+' : ''}{quantity}
        </Typography>
      </Box>
    );
  };

  // Renderizar badge de stock (CA-7)
  const renderStockBadge = (newStock, minStockLevel = 0) => {
    if (newStock === 0) {
      return (
        <Chip
          label="SIN STOCK"
          size="small"
          color="error"
          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
        />
      );
    }
    if (newStock <= minStockLevel) {
      return (
        <Chip
          label="STOCK BAJO"
          size="small"
          color="warning"
          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
        />
      );
    }
    return null;
  };

  // Mostrar skeleton mientras carga
  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Stock Anterior</TableCell>
              <TableCell align="right">Stock Nuevo</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Motivo</TableCell>
              <TableCell align="center">Detalles</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                {[...Array(9)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Mostrar mensaje si no hay movimientos
  if (!movements || movements.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No se encontraron movimientos con los filtros seleccionados
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Fecha y Hora</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Stock Anterior</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Stock Nuevo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Motivo</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Detalles</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movements.map((movement) => {
              const rowIsToday = isToday(movement.created_at);

              return (
                <TableRow
                  key={movement.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: rowIsToday ? '#fff3e0' : 'inherit', // CA-7: Highlight today
                    '&:hover': {
                      backgroundColor: rowIsToday ? '#ffe0b2' : '#f5f5f5'
                    }
                  }}
                  onClick={() => onRowClick && onRowClick(movement)}
                >
                  {/* Fecha y Hora */}
                  <TableCell>
                    <Tooltip title={formatRelativeDate(movement.created_at)} arrow>
                      <Typography variant="body2">
                        {formatDate(movement.created_at)}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  {/* Producto (nombre + SKU) */}
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {movement.product_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU: {movement.product_sku}
                    </Typography>
                  </TableCell>

                  {/* Tipo de Movimiento */}
                  <TableCell>
                    <MovementTypeChip
                      movementType={movement.movement_type}
                      size="small"
                      showIcon={true}
                    />
                  </TableCell>

                  {/* Cantidad (con indicador visual) */}
                  <TableCell align="right">
                    {renderQuantity(movement.quantity)}
                  </TableCell>

                  {/* Stock Anterior */}
                  <TableCell align="right">
                    <Typography variant="body2">
                      {movement.previous_stock}
                    </Typography>
                  </TableCell>

                  {/* Stock Nuevo (con badge si aplica) */}
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {movement.new_stock}
                      </Typography>
                      {renderStockBadge(movement.new_stock, 10)}
                    </Box>
                  </TableCell>

                  {/* Usuario */}
                  <TableCell>
                    <Typography variant="body2">
                      {movement.user_name}
                    </Typography>
                  </TableCell>

                  {/* Motivo/Razón */}
                  <TableCell>
                    <Tooltip title={movement.reason || 'Sin motivo especificado'} arrow>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {movement.reason || '-'}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  {/* Botón de Detalles */}
                  <TableCell align="center">
                    <Tooltip title="Ver detalles completos" arrow>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick && onRowClick(movement);
                        }}
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación (CA-1: 50 registros por página) */}
      <TablePagination
        component="div"
        count={totalMovements}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[25, 50, 100]}
        labelRowsPerPage="Registros por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </Paper>
  );
};

export default MovementHistoryTable;
