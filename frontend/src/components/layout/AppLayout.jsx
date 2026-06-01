import { useState, useEffect } from 'react';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import authService from '../../services/authService';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/forbidden'];
const SIDEBAR_WIDTH = 256;

/**
 * US-DASH-002: Layout principal con Sidebar fijo + TopBar sticky.
 * Renderiza el layout completo para páginas autenticadas y
 * pasa los children directamente para páginas de auth.
 */
const AppLayout = ({ children }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);

  const isAuthPage = AUTH_PATHS.some((p) => location.pathname.startsWith(p));
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    if (isAuthenticated && !isAuthPage) {
      setUser(authService.getCurrentUser());
    } else {
      setUser(null);
    }
  }, [isAuthenticated, isAuthPage, location.pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Auth pages and unauthenticated: render without layout
  if (!isAuthenticated || isAuthPage) {
    return children;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'var(--color-surface)' }}>
      {/* Desktop: permanent sidebar */}
      {!isMobile && <Sidebar user={user} />}

      {/* Mobile: temporary drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              bgcolor: 'transparent',
              border: 'none',
            },
          }}
        >
          <Sidebar user={user} />
        </Drawer>
      )}

      {/* Main area (right of sidebar) */}
      <Box
        sx={{
          flex: 1,
          ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <TopBar user={user} onMenuClick={() => setDrawerOpen(true)} />

        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: 1440,
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
