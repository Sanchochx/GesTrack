/**
 * US-REP-001 CA-5/CA-6: Helpers de rango de fechas para selector de período
 * (hoy / semana / mes) y su período anterior equivalente, usado para calcular
 * tendencias (% de cambio) en los dashboards.
 */
const toISODate = (date) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfWeek = (date) => {
  // Semana iniciando el lunes
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

/**
 * @param {'today'|'week'|'month'} period
 * @returns {{ current: {from: string, to: string}, previous: {from: string, to: string} }}
 */
export const getPeriodRange = (period) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let from;
  if (period === 'week') from = startOfWeek(today);
  else if (period === 'month') from = startOfMonth(today);
  else from = today;

  const spanDays = Math.round((today - from) / 86400000) + 1;
  const previousTo = addDays(from, -1);
  const previousFrom = addDays(previousTo, -(spanDays - 1));

  return {
    current: { from: toISODate(from), to: toISODate(today) },
    previous: { from: toISODate(previousFrom), to: toISODate(previousTo) },
  };
};

/** Calcula el % de cambio entre dos valores, redondeado a 1 decimal */
export const calculateChangePercentage = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

export const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];
