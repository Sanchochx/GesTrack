/**
 * ScheduledReports – Exportación Masiva de Reportes
 * US-REP-013: Exportación Masiva de Reportes
 *
 * CA-1: Programar generación automática de reportes
 * CA-2: Frecuencia configurable: diaria, semanal, mensual
 * CA-3: Selección de tipo de reporte y parámetros
 * CA-4: Envío automático por email
 * CA-5: Configuración de destinatarios
 * CA-6: Archivo Excel/PDF adjunto
 * CA-7: Activar/pausar la programación
 * CA-8: Historial de reportes generados
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Skeleton,
  Divider,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Home as HomeIcon,
  Assessment as ReportIcon,
  Add as AddIcon,
  PlayArrow as RunIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import scheduledReportService from '../../services/scheduledReportService';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
];

const STATUS_LABELS = { success: 'Enviado', error: 'Error' };

const emptyForm = { name: '', report_type: '', frequency: 'weekly', recipients: [] };

const ScheduledReports = () => {
  const navigate = useNavigate();

  const [reportTypes, setReportTypes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySchedule, setHistorySchedule] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesRes, schedulesRes] = await Promise.all([
        scheduledReportService.getReportTypes(),
        scheduledReportService.getSchedules(),
      ]);
      if (typesRes.success) setReportTypes(typesRes.data || []);
      if (schedulesRes.success) {
        setSchedules(schedulesRes.data || []);
      } else {
        setError(schedulesRes.error?.message || 'Error al cargar los reportes programados');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar los reportes programados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!form.name || !form.report_type || !form.frequency || form.recipients.length === 0) {
      setError('Completa el nombre, tipo de reporte, frecuencia y al menos un destinatario');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await scheduledReportService.createSchedule(form);
      if (response.success) {
        setCreateOpen(false);
        setSuccess('Reporte programado creado correctamente');
        loadData();
      } else {
        setError(response.error?.message || 'Error al crear la programación');
      }
    } catch (err) {
      setError(err?.error?.message || 'Error al crear la programación');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (schedule) => {
    try {
      const response = await scheduledReportService.toggleSchedule(schedule.id, !schedule.is_active);
      if (response.success) {
        loadData();
      } else {
        setError(response.error?.message || 'Error al actualizar la programación');
      }
    } catch (err) {
      setError(err?.error?.message || 'Error al actualizar la programación');
    }
  };

  const handleDelete = async (schedule) => {
    if (!window.confirm(`¿Eliminar la programación "${schedule.name}"?`)) return;
    try {
      const response = await scheduledReportService.deleteSchedule(schedule.id);
      if (response.success) {
        setSuccess('Reporte programado eliminado');
        loadData();
      } else {
        setError(response.error?.message || 'Error al eliminar la programación');
      }
    } catch (err) {
      setError(err?.error?.message || 'Error al eliminar la programación');
    }
  };

  const handleRunNow = async (schedule) => {
    setRunningId(schedule.id);
    setError(null);
    try {
      const response = await scheduledReportService.runNow(schedule.id);
      if (response.success) {
        setSuccess(`"${schedule.name}" generado y enviado correctamente`);
        loadData();
      } else {
        setError(response.error?.message || 'Error al ejecutar el reporte');
      }
    } catch (err) {
      setError(err?.error?.message || 'Error al ejecutar el reporte');
    } finally {
      setRunningId(null);
    }
  };

  const handleShowHistory = async (schedule) => {
    try {
      const response = await scheduledReportService.getSchedule(schedule.id);
      if (response.success) {
        setHistorySchedule(response.data);
        setHistoryOpen(true);
      }
    } catch (err) {
      setError(err?.error?.message || 'Error al cargar el historial');
    }
  };

  const reportTypeLabel = (value) => reportTypes.find((t) => t.value === value)?.label || value;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/dashboard')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          Inicio
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ReportIcon fontSize="small" />
          Exportación Masiva de Reportes
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Reportes Programados</Typography>
          <Typography variant="body2" color="text.secondary">
            Programa el envío automático de reportes por email
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Nueva Programación
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tipo de Reporte</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Frecuencia</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Destinatarios</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Próxima Ejecución</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Activo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay reportes programados. Crea uno para comenzar.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{reportTypeLabel(s.report_type)}</TableCell>
                    <TableCell>
                      <Chip label={FREQUENCY_OPTIONS.find((f) => f.value === s.frequency)?.label || s.frequency} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{s.recipients.join(', ')}</TableCell>
                    <TableCell>{s.is_active ? new Date(s.next_run_at).toLocaleString('es-CO') : '—'}</TableCell>
                    <TableCell>
                      <Switch checked={s.is_active} onChange={() => handleToggle(s)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ejecutar ahora">
                        <IconButton size="small" onClick={() => handleRunNow(s)} disabled={runningId === s.id}>
                          {runningId === s.id ? <CircularProgress size={18} /> : <RunIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver historial">
                        <IconButton size="small" onClick={() => handleShowHistory(s)}>
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleDelete(s)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* CA-1/CA-2/CA-3/CA-5: Diálogo de creación */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Programación de Reporte</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              select
              label="Tipo de Reporte"
              value={form.report_type}
              onChange={(e) => setForm((f) => ({ ...f, report_type: e.target.value }))}
              fullWidth
              required
            >
              {reportTypes.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label} ({t.format === 'pdf' ? 'PDF' : 'Excel'})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Frecuencia"
              value={form.frequency}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
              fullWidth
              required
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={form.recipients}
              onChange={(e, value) => setForm((f) => ({ ...f, recipients: value }))}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Destinatarios (email, Enter para agregar)" required />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CA-8: Historial de ejecuciones */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Historial — {historySchedule?.name}</DialogTitle>
        <DialogContent>
          {(historySchedule?.history?.length ?? 0) === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              Aún no se ha ejecutado esta programación
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Detalle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historySchedule.history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.run_at).toLocaleString('es-CO')}</TableCell>
                    <TableCell>
                      <Chip label={STATUS_LABELS[h.status] || h.status} size="small" color={h.status === 'success' ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell>
                      {h.status === 'success'
                        ? `Enviado a: ${(h.recipients_sent || []).join(', ')}`
                        : h.error_message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ScheduledReports;
