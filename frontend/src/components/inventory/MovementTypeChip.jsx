import { Chip } from '@mui/material';
import {
  FiberNew as InitialIcon,
  ShoppingCart as SaleIcon,
  Edit as AdjustmentIcon,
  LocalShipping as SupplierIcon,
  AssignmentReturn as ReturnIcon,
  Lock as ReservationIcon,
  LockOpen as CancellationIcon,
  Inventory as DefaultIcon
} from '@mui/icons-material';

/**
 * US-INV-003 CA-2: Movement Type Chip Component
 *
 * Muestra un chip con icono y color según el tipo de movimiento de inventario
 *
 * Tipos de movimiento:
 * - Stock Inicial: Azul
 * - Salida / Venta: Rojo
 * - Ajuste Manual: Naranja
 * - Entrada / Compra: Verde
 * - Devolución: Púrpura
 * - Reserva de Orden: Gris
 * - Cancelación de Orden: Verde claro
 */

const MOVEMENT_TYPE_CONFIG = {
  'Stock Inicial': {
    icon: InitialIcon,
    color: '#1976d2', // Blue
    bgColor: '#e3f2fd'
  },
  'Salida': {
    icon: SaleIcon,
    color: '#d32f2f', // Red
    bgColor: '#ffebee'
  },
  'Venta': {
    icon: SaleIcon,
    color: '#d32f2f', // Red
    bgColor: '#ffebee'
  },
  'Ajuste Manual': {
    icon: AdjustmentIcon,
    color: '#ed6c02', // Orange
    bgColor: '#fff3e0'
  },
  'Entrada': {
    icon: SupplierIcon,
    color: '#2e7d32', // Green
    bgColor: '#e8f5e9'
  },
  'Compra': {
    icon: SupplierIcon,
    color: '#2e7d32', // Green
    bgColor: '#e8f5e9'
  },
  'Devolución': {
    icon: ReturnIcon,
    color: '#7b1fa2', // Purple
    bgColor: '#f3e5f5'
  },
  'Reserva de Orden': {
    icon: ReservationIcon,
    color: '#616161', // Gray
    bgColor: '#f5f5f5'
  },
  'Cancelación de Orden': {
    icon: CancellationIcon,
    color: '#66bb6a', // Light Green
    bgColor: '#f1f8e9'
  }
};

const MovementTypeChip = ({ movementType, size = 'small', showIcon = true }) => {
  const config = MOVEMENT_TYPE_CONFIG[movementType] || {
    icon: DefaultIcon,
    color: '#757575',
    bgColor: '#eeeeee'
  };

  const Icon = config.icon;

  return (
    <Chip
      icon={showIcon ? <Icon style={{ color: config.color }} /> : undefined}
      label={movementType}
      size={size}
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 'medium',
        '& .MuiChip-icon': {
          color: config.color
        }
      }}
    />
  );
};

export default MovementTypeChip;
