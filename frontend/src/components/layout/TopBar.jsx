import { useState } from 'react';
import { Box, Typography, InputBase, Avatar, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

const TABS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Pedidos', path: '/orders' },
  { label: 'Analítica', path: '/inventory/dashboard' },
];

const TopBar = ({ user, onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    setUserMenuAnchor(null);
    authService.logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const firstName = user?.full_name?.split(' ')[0] || 'Usuario';

  const isTabActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        bgcolor: '#ffffff',
        borderBottom: '1px solid #bccac0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        height: 64,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: { xs: 2, md: 4 },
      }}
    >
      {/* Left: hamburger (mobile) + branding + search */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 4 } }}>
        <IconButton
          onClick={onMenuClick}
          sx={{ display: { xs: 'flex', md: 'none' }, color: '#006948' }}
          aria-label="abrir menú de navegación"
        >
          <MenuIcon />
        </IconButton>

        <Typography
          sx={{
            fontFamily: 'Inter',
            fontWeight: 900,
            fontSize: 28,
            color: '#006948',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => navigate('/dashboard')}
        >
          GesTrack
        </Typography>

        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: { xs: 'none', lg: 'flex' },
            alignItems: 'center',
            bgcolor: '#eff4ff',
            borderRadius: '9999px',
            border: '1px solid #bccac0',
            px: 2,
            py: 0.5,
            width: 256,
            transition: 'border-color 0.15s',
            '&:focus-within': { borderColor: '#006948' },
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        >
          <SearchIcon sx={{ color: '#6d7a72', mr: 1, fontSize: 20, flexShrink: 0 }} />
          <InputBase
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ fontSize: 14, fontFamily: 'Inter', flex: 1 }}
            inputProps={{ 'aria-label': 'buscar productos' }}
          />
        </Box>
      </Box>

      {/* Right: tabs + controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
        {/* Tabs — desktop only */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
          {TABS.map((tab) => {
            const active = isTabActive(tab.path);
            return (
              <Typography
                key={tab.path}
                onClick={() => navigate(tab.path)}
                sx={{
                  fontFamily: 'Inter',
                  fontSize: 12,
                  fontWeight: active ? 700 : 400,
                  color: active ? '#006948' : '#565e74',
                  borderBottom: active ? '2px solid #006948' : '2px solid transparent',
                  pb: 0.5,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  transition: 'color 0.15s',
                  '&:hover': { color: '#006948' },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                }}
              >
                {tab.label}
              </Typography>
            );
          })}
        </Box>

        {/* Divider */}
        <Box
          sx={{
            width: 1,
            height: 24,
            bgcolor: '#bccac0',
            display: { xs: 'none', md: 'block' },
          }}
          aria-hidden="true"
        />

        {/* Notifications */}
        <IconButton size="small" sx={{ color: '#565e74' }} aria-label="notificaciones">
          <NotificationsIcon fontSize="small" />
        </IconButton>

        {/* User chip */}
        <Box
          onClick={(e) => setUserMenuAnchor(e.currentTarget)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setUserMenuAnchor(e.currentTarget)}
          aria-label="menú de usuario"
          aria-haspopup="true"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            transition: 'background 0.15s',
            '&:hover': { bgcolor: '#eff4ff' },
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#006948',
              fontSize: 13,
              fontWeight: 700,
              border: '1px solid #00855d',
              fontFamily: 'Inter',
            }}
          >
            {initials}
          </Avatar>
          <Typography
            sx={{
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: 700,
              display: { xs: 'none', sm: 'block' },
              color: '#0b1c30',
            }}
          >
            {firstName}
          </Typography>
        </Box>
      </Box>

      {/* User dropdown menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableScrollLock
        PaperProps={{ sx: { mt: 1, minWidth: 180, borderRadius: '8px', border: '1px solid #bccac0' } }}
      >
        {user && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#0b1c30', fontFamily: 'Inter' }}>
              {user.full_name}
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#3d4a42', fontFamily: 'Inter' }}>
              {user.role}
            </Typography>
          </Box>
        )}
        <Divider />
        <MenuItem
          onClick={() => { setUserMenuAnchor(null); navigate('/profile'); }}
          sx={{ fontSize: 14, gap: 1.5, fontFamily: 'Inter' }}
        >
          <PersonIcon fontSize="small" /> Mi Perfil
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          sx={{ fontSize: 14, gap: 1.5, fontFamily: 'Inter', color: '#ba1a1a' }}
        >
          <LogoutIcon fontSize="small" /> Cerrar Sesión
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TopBar;
