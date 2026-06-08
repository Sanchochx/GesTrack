/**
 * OrderFilters — Panel de filtros para la lista de pedidos
 * US-ORD-006: CA-1 (búsqueda texto), CA-2 (rango fechas), CA-3 (multi-estado),
 *             CA-4 (multi-estado pago), CA-6 (chips activos), CA-7 (contador),
 *             CA-8 (limpiar filtros)
 */
import { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Typography,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Switch,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import {
  startOfDay, endOfDay, startOfMonth, endOfMonth,
  startOfYear, subDays, subMonths,
} from 'date-fns';
import { ORDER_STATUSES, PAYMENT_STATUSES, DEFAULT_STATUSES } from './orderConstants';

const DATE_SHORTCUTS = [
  { label: 'Hoy', getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Últimos 7 días', getRange: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: 'Últimos 30 días', getRange: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
  { label: 'Este mes', getRange: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Mes anterior', getRange: () => {
    const prev = subMonths(new Date(), 1);
    return { from: startOfMonth(prev), to: endOfMonth(prev) };
  }},
  { label: 'Este año', getRange: () => ({ from: startOfYear(new Date()), to: endOfDay(new Date()) }) },
];

const toISO = (date) => date ? date.toISOString().slice(0, 10) : null;

const formatDateLabel = (isoDate) => {
  if (!isoDate) return '';
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const OrderFilters = ({
  search,
  onSearchChange,
  selectedStatuses,
  onStatusesChange,
  selectedPaymentStatuses,
  onPaymentStatusesChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  totalResults,
  loading,
}) => {
  const [statusAnchor, setStatusAnchor] = useState(null);
  const [paymentAnchor, setPaymentAnchor] = useState(null);
  const [dateAnchor, setDateAnchor] = useState(null);

  // CA-3: Toggle de estados individuales
  const toggleStatus = (status) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  // Toggle "Mostrar cancelados"
  const toggleCancelados = () => {
    if (selectedStatuses.includes('Cancelado')) {
      onStatusesChange(selectedStatuses.filter((s) => s !== 'Cancelado'));
    } else {
      onStatusesChange([...selectedStatuses, 'Cancelado']);
    }
  };

  // CA-4: Toggle de estados de pago
  const togglePaymentStatus = (status) => {
    if (selectedPaymentStatuses.includes(status)) {
      onPaymentStatusesChange(selectedPaymentStatuses.filter((s) => s !== status));
    } else {
      onPaymentStatusesChange([...selectedPaymentStatuses, status]);
    }
  };

  // Calcular filtros activos para chips (CA-6)
  const activeFilters = [];

  if (search.trim()) {
    activeFilters.push({ key: 'search', label: `Búsqueda: "${search}"`, onRemove: () => onSearchChange('') });
  }

  if (dateFrom || dateTo) {
    const label = dateFrom && dateTo
      ? `${formatDateLabel(dateFrom)} — ${formatDateLabel(dateTo)}`
      : dateFrom ? `Desde ${formatDateLabel(dateFrom)}` : `Hasta ${formatDateLabel(dateTo)}`;
    activeFilters.push({
      key: 'date',
      label: `Fecha: ${label}`,
      onRemove: () => { onDateFromChange(null); onDateToChange(null); },
    });
  }

  const allActiveStatuses = ORDER_STATUSES.filter((s) => s !== 'Cancelado');
  const isAllActive = allActiveStatuses.every((s) => selectedStatuses.includes(s));
  const hasCancelado = selectedStatuses.includes('Cancelado');
  const statusLabel = selectedStatuses.length === ORDER_STATUSES.length
    ? 'Todos'
    : selectedStatuses.length === 0
    ? 'Ninguno'
    : selectedStatuses.join(', ');
  const statusChanged = !(isAllActive && !hasCancelado);
  if (statusChanged) {
    activeFilters.push({
      key: 'status',
      label: `Estado: ${statusLabel || 'Ninguno'}`,
      onRemove: () => onStatusesChange(DEFAULT_STATUSES),
    });
  }

  const isAllPayment = PAYMENT_STATUSES.every((s) => selectedPaymentStatuses.includes(s));
  if (!isAllPayment) {
    activeFilters.push({
      key: 'payment',
      label: `Pago: ${selectedPaymentStatuses.length === 0 ? 'Ninguno' : selectedPaymentStatuses.join(', ')}`,
      onRemove: () => onPaymentStatusesChange(PAYMENT_STATUSES),
    });
  }

  const hasAnyFilter = activeFilters.length > 0;

  return (
    <Box>
      {/* Fila de controles de filtro */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 1.5 }}>
        {/* CA-1: Búsqueda por texto */}
        <TextField
          placeholder="Buscar por número de pedido o nombre de cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          sx={{ minWidth: 300, flex: '1 1 300px', maxWidth: 450 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        {/* CA-2: Filtro por fecha */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<CalendarTodayIcon />}
          endIcon={<KeyboardArrowDownIcon />}
          onClick={(e) => setDateAnchor(e.currentTarget)}
          color={dateFrom || dateTo ? 'primary' : 'inherit'}
          sx={{ minWidth: 130, whiteSpace: 'nowrap' }}
        >
          {dateFrom || dateTo ? 'Fecha activa' : 'Fecha'}
        </Button>

        {/* CA-3: Filtro por estado */}
        <Button
          variant="outlined"
          size="small"
          endIcon={<KeyboardArrowDownIcon />}
          onClick={(e) => setStatusAnchor(e.currentTarget)}
          color={statusChanged ? 'primary' : 'inherit'}
          sx={{ minWidth: 110, whiteSpace: 'nowrap' }}
        >
          Estado
          {statusChanged && (
            <Box
              component="span"
              sx={{
                ml: 0.5,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '10px',
                px: 0.7,
                fontSize: '0.65rem',
                fontWeight: 'bold',
                lineHeight: 1.6,
              }}
            >
              {selectedStatuses.length}
            </Box>
          )}
        </Button>

        {/* CA-4: Filtro por estado de pago */}
        <Button
          variant="outlined"
          size="small"
          endIcon={<KeyboardArrowDownIcon />}
          onClick={(e) => setPaymentAnchor(e.currentTarget)}
          color={!isAllPayment ? 'primary' : 'inherit'}
          sx={{ minWidth: 130, whiteSpace: 'nowrap' }}
        >
          Pago
          {!isAllPayment && (
            <Box
              component="span"
              sx={{
                ml: 0.5,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '10px',
                px: 0.7,
                fontSize: '0.65rem',
                fontWeight: 'bold',
                lineHeight: 1.6,
              }}
            >
              {selectedPaymentStatuses.length}
            </Box>
          )}
        </Button>

        {/* CA-8: Limpiar filtros */}
        {hasAnyFilter && (
          <Tooltip title="Restablecer todos los filtros">
            <Button
              size="small"
              startIcon={<FilterListOffIcon />}
              onClick={onClearFilters}
              color="inherit"
            >
              Limpiar
            </Button>
          </Tooltip>
        )}

        {/* CA-7: Contador de resultados */}
        {!loading && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>
            {totalResults === 0
              ? 'Sin resultados'
              : `Mostrando ${totalResults.toLocaleString('es-CO')} pedido${totalResults !== 1 ? 's' : ''}`}
          </Typography>
        )}
      </Box>

      {/* CA-6: Chips de filtros activos */}
      {hasAnyFilter && (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            {activeFilters.length} filtro{activeFilters.length !== 1 ? 's' : ''} activo{activeFilters.length !== 1 ? 's' : ''}:
          </Typography>
          {activeFilters.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              size="small"
              onDelete={f.onRemove}
              deleteIcon={<CloseIcon />}
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.72rem' }}
            />
          ))}
        </Box>
      )}

      {/* Popover: Filtro de fecha (CA-2) */}
      <Popover
        open={Boolean(dateAnchor)}
        anchorEl={dateAnchor}
        onClose={() => setDateAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, minWidth: 320 } }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
          Rango de fechas
        </Typography>

        {/* Shortcuts */}
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
          {DATE_SHORTCUTS.map((s) => (
            <Chip
              key={s.label}
              label={s.label}
              size="small"
              clickable
              variant="outlined"
              onClick={() => {
                const range = s.getRange();
                onDateFromChange(toISO(range.from));
                onDateToChange(toISO(range.to));
                setDateAnchor(null);
              }}
            />
          ))}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Date pickers */}
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <Stack spacing={1.5}>
            <DatePicker
              label="Fecha inicio"
              value={dateFrom ? new Date(dateFrom + 'T00:00:00') : null}
              onChange={(d) => onDateFromChange(d ? toISO(d) : null)}
              maxDate={dateTo ? new Date(dateTo + 'T00:00:00') : undefined}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DatePicker
              label="Fecha fin"
              value={dateTo ? new Date(dateTo + 'T00:00:00') : null}
              onChange={(d) => onDateToChange(d ? toISO(d) : null)}
              minDate={dateFrom ? new Date(dateFrom + 'T00:00:00') : undefined}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Stack>
        </LocalizationProvider>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
          {(dateFrom || dateTo) && (
            <Button
              size="small"
              onClick={() => { onDateFromChange(null); onDateToChange(null); }}
            >
              Limpiar
            </Button>
          )}
          <Button size="small" variant="contained" onClick={() => setDateAnchor(null)}>
            Aplicar
          </Button>
        </Box>
      </Popover>

      {/* Popover: Filtro de estado (CA-3) */}
      <Popover
        open={Boolean(statusAnchor)}
        anchorEl={statusAnchor}
        onClose={() => setStatusAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, minWidth: 220 } }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Estado del pedido
        </Typography>
        <FormGroup>
          {ORDER_STATUSES.filter((s) => s !== 'Cancelado').map((status) => (
            <FormControlLabel
              key={status}
              control={
                <Checkbox
                  size="small"
                  checked={selectedStatuses.includes(status)}
                  onChange={() => toggleStatus(status)}
                />
              }
              label={<Typography variant="body2">{status}</Typography>}
            />
          ))}
        </FormGroup>
        <Divider sx={{ my: 1 }} />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={selectedStatuses.includes('Cancelado')}
              onChange={toggleCancelados}
            />
          }
          label={<Typography variant="body2">Mostrar cancelados</Typography>}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            size="small"
            onClick={() => onStatusesChange(ORDER_STATUSES)}
          >
            Todos
          </Button>
          <Button
            size="small"
            onClick={() => onStatusesChange(DEFAULT_STATUSES)}
          >
            Activos
          </Button>
        </Box>
      </Popover>

      {/* Popover: Filtro de estado de pago (CA-4) */}
      <Popover
        open={Boolean(paymentAnchor)}
        anchorEl={paymentAnchor}
        onClose={() => setPaymentAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, minWidth: 200 } }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Estado de pago
        </Typography>
        <FormGroup>
          {PAYMENT_STATUSES.map((status) => (
            <FormControlLabel
              key={status}
              control={
                <Checkbox
                  size="small"
                  checked={selectedPaymentStatuses.includes(status)}
                  onChange={() => togglePaymentStatus(status)}
                />
              }
              label={<Typography variant="body2">{status}</Typography>}
            />
          ))}
        </FormGroup>
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            onClick={() => onPaymentStatusesChange(PAYMENT_STATUSES)}
          >
            Todos
          </Button>
        </Box>
      </Popover>
    </Box>
  );
};

export default OrderFilters;
