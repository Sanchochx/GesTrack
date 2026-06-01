import { Paper, Box, Avatar, Typography } from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Warehouse as WarehouseIcon,
  PointOfSale as SalesIcon,
} from '@mui/icons-material';

const ROLE_CONFIG = {
  Admin: {
    gradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #66bb6a 100%)',
    icon: <AdminIcon sx={{ fontSize: 28 }} />,
    title: 'Dashboard Administrativo',
    subtitle: 'Visión general del sistema, inventario y ventas',
  },
  'Gerente de Almacén': {
    gradient: 'linear-gradient(135deg, #00695c 0%, #00897b 60%, #4db6ac 100%)',
    icon: <WarehouseIcon sx={{ fontSize: 28 }} />,
    title: 'Dashboard de Inventario',
    subtitle: 'Gestión de productos, categorías y movimientos de stock',
  },
  'Personal de Ventas': {
    gradient: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 60%, #ce93d8 100%)',
    icon: <SalesIcon sx={{ fontSize: 28 }} />,
    title: 'Dashboard de Ventas',
    subtitle: 'Gestión de clientes, pedidos y seguimiento de ingresos',
  },
};

/**
 * DS-001: Cabecera de bienvenida del Sistema de Diseño Emerald Logic.
 * Aplica el gradiente y el icono correspondiente al rol del usuario.
 */
const DashboardHeader = ({ role, userName }) => {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG['Admin'];

  return (
    <Paper
      elevation={0}
      sx={{
        background: config.gradient,
        borderRadius: 3,
        p: { xs: 2.5, md: 3 },
        mb: 4,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Avatar
        sx={{
          width: 52,
          height: 52,
          bgcolor: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.35)',
        }}
        aria-hidden="true"
      >
        {config.icon}
      </Avatar>

      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {config.title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
          ¡Bienvenido/a, {userName}!&nbsp;&nbsp;·&nbsp;&nbsp;{config.subtitle}
        </Typography>
      </Box>
    </Paper>
  );
};

export default DashboardHeader;
