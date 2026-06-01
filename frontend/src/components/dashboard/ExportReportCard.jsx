import { useState } from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton, Button, CircularProgress } from '@mui/material';
import { Description as DescriptionIcon, Download as DownloadIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';

const PERIODS = [
  { value: '7d', label: '7 DÍAS' },
  { value: '30d', label: '30 DÍAS' },
  { value: '1y', label: '1 AÑO' },
];

const CHECKLIST = [
  'Valor total por categoría',
  'Top 10 productos de mayor valor',
];

/**
 * US-DASH-003 CA-9/10/11/12: Tarjeta de exportación de reporte.
 */
const ExportReportCard = () => {
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      await inventoryService.exportValueReport('excel', period);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #bccac0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 240,
        height: '100%',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <DescriptionIcon sx={{ fontSize: 18, color: '#3d4a42' }} />
        <Typography
          sx={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#3d4a42', fontFamily: 'Inter' }}
        >
          Exportar Reporte
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 14, color: '#3d4a42', mb: 2, fontFamily: 'Inter' }}>
        Selecciona el período para el informe detallado.
      </Typography>

      {/* Period toggle */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          bgcolor: '#eff4ff',
          borderRadius: '8px',
          p: 0.5,
          mb: 2,
        }}
      >
        {PERIODS.map((p) => (
          <Box
            key={p.value}
            onClick={() => setPeriod(p.value)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setPeriod(p.value)}
            sx={{
              flex: 1,
              py: 0.5,
              px: 1,
              borderRadius: '6px',
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: period === p.value ? '#ffffff' : 'transparent',
              boxShadow: period === p.value ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'Inter',
                color: period === p.value ? '#006948' : '#3d4a42',
              }}
            >
              {p.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Checklist */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        {CHECKLIST.map((item) => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon sx={{ fontSize: 18, color: '#006948', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 14, color: '#3d4a42', fontFamily: 'Inter' }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Download button */}
      <Button
        fullWidth
        variant="contained"
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
        onClick={handleDownload}
        disabled={loading}
        sx={{
          bgcolor: '#006948',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.04em',
          borderRadius: '8px',
          py: 1.25,
          transition: 'transform 0.1s',
          '&:active': { transform: 'scale(0.98)' },
          '&:hover': { bgcolor: '#00855d' },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:active': { transform: 'none' } },
        }}
      >
        {loading ? 'Generando...' : 'Descargar Excel'}
      </Button>
    </Box>
  );
};

export default ExportReportCard;
