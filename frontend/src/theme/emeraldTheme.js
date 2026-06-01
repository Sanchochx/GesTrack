import { createTheme } from '@mui/material';

export const COLORS = {
  primary: '#006948',
  primaryLight: '#68dba9',
  primaryDark: '#005137',
  primaryContainer: '#00855d',
  secondary: '#565e74',
  tertiary: '#9b3e3b',
  error: '#ba1a1a',
  surface: '#f8f9ff',
  surfaceLow: '#eff4ff',
  surfaceContainer: '#e5eeff',
  surfaceHigh: '#dce9ff',
  surfaceHighest: '#d3e4fe',
  surfaceWhite: '#ffffff',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#3d4a42',
  outline: '#6d7a72',
  outlineVariant: '#bccac0',
};

export const RADIUS = {
  sm: '2px',
  DEFAULT: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
};

export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.primary,
      light: COLORS.primaryLight,
      dark: COLORS.primaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: COLORS.secondary,
      contrastText: '#ffffff',
    },
    error: {
      main: COLORS.error,
    },
    warning: {
      main: COLORS.tertiary,
    },
    background: {
      default: COLORS.surface,
      paper: COLORS.surfaceWhite,
    },
    text: {
      primary: COLORS.onSurface,
      secondary: COLORS.onSurfaceVariant,
    },
    custom: {
      surface: COLORS.surface,
      surfaceLow: COLORS.surfaceLow,
      surfaceContainer: COLORS.surfaceContainer,
      surfaceHigh: COLORS.surfaceHigh,
      surfaceHighest: COLORS.surfaceHighest,
      onSurface: COLORS.onSurface,
      onSurfaceVariant: COLORS.onSurfaceVariant,
      outline: COLORS.outline,
      outlineVariant: COLORS.outlineVariant,
      tertiary: COLORS.tertiary,
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontSize: '36px', fontWeight: 700, lineHeight: '44px', letterSpacing: '-0.02em' },
    h2: { fontSize: '28px', fontWeight: 600, lineHeight: '36px', letterSpacing: '-0.01em' },
    h4: { fontSize: '20px', fontWeight: 600, lineHeight: '28px' },
    body1: { fontSize: '16px', fontWeight: 400, lineHeight: '24px' },
    body2: { fontSize: '14px', fontWeight: 400, lineHeight: '20px' },
    caption: {
      fontSize: '12px',
      fontWeight: 500,
      lineHeight: '16px',
      letterSpacing: '0.05em',
    },
    overline: {
      fontSize: '14px',
      fontWeight: 600,
      lineHeight: '20px',
      fontVariantNumeric: 'tabular-nums',
    },
  },
  shape: { borderRadius: 2 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: `1px solid ${COLORS.outlineVariant}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9999 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: COLORS.surfaceLow,
            fontWeight: 600,
            fontSize: '12px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: COLORS.onSurfaceVariant,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover .MuiTableCell-root': {
            backgroundColor: 'rgba(0, 105, 72, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 8 },
      },
    },
  },
});

export default theme;
