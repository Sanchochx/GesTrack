import { useState, useEffect, useCallback } from 'react';
import orderService from '../services/orderService';
import customerService from '../services/customerService';
import usePolling from './usePolling';
import { getPeriodRange, calculateChangePercentage } from '../utils/dashboardPeriods';

const toISODate = (date) => date.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
};

/**
 * DS-003: Hook que obtiene métricas y pedidos recientes para SalesDashboard.
 * US-REP-001 CA-2/4/5/6: Ventas del período (con selector hoy/semana/mes y
 * tendencia vs período anterior), gráfico de ventas de los últimos 7 días,
 * y actualización periódica (polling).
 */
const useSalesDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);

  // US-REP-001 CA-5/CA-6: Ventas del período seleccionado + tendencia
  const [period, setPeriod] = useState('today');
  const [periodSales, setPeriodSales] = useState(0);
  const [periodSalesChange, setPeriodSalesChange] = useState(null);

  // US-REP-001 CA-3: Gráfico de ventas de los últimos 7 días
  const [weeklyChartData, setWeeklyChartData] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { current, previous } = getPeriodRange(period);
      const weekStart = daysAgo(6);
      const today = toISODate(new Date());

      const [ordersRes, customersRes, currentPeriodRes, previousPeriodRes, weekRes] = await Promise.all([
        orderService.getOrders({ per_page: 5, sort_by: 'created_at', sort_order: 'desc' }),
        customerService.getCustomers({ per_page: 1, is_active: true }),
        orderService.getOrders({ date_from: current.from, date_to: current.to, per_page: 1 }),
        orderService.getOrders({ date_from: previous.from, date_to: previous.to, per_page: 1 }),
        orderService.getOrders({ date_from: weekStart, date_to: today, per_page: 200, sort_by: 'created_at', sort_order: 'asc' }),
      ]);

      setRecentOrders(ordersRes.data || []);
      setMetrics(ordersRes.metrics || null);
      setTotalOrders(ordersRes.pagination?.total || 0);
      setActiveCustomers(customersRes.pagination?.total || 0);

      const currentTotal = currentPeriodRes.metrics?.total_amount ?? 0;
      const previousTotal = previousPeriodRes.metrics?.total_amount ?? 0;
      setPeriodSales(currentTotal);
      setPeriodSalesChange(calculateChangePercentage(currentTotal, previousTotal));

      // Agrupar ventas de los últimos 7 días por fecha (CA-3: gráfico de barras)
      const totalsByDay = {};
      for (let i = 6; i >= 0; i--) totalsByDay[daysAgo(i)] = 0;
      for (const order of weekRes.data || []) {
        const day = (order.created_at || '').slice(0, 10);
        if (day in totalsByDay) totalsByDay[day] += order.total || 0;
      }
      setWeeklyChartData(
        Object.entries(totalsByDay).map(([date, total]) => ({
          label: new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(new Date(`${date}T00:00:00`)),
          total,
        }))
      );
    } catch (err) {
      setError(err?.error?.message || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePolling(fetchData, 60000);

  return {
    loading,
    error,
    recentOrders,
    metrics,
    totalOrders,
    activeCustomers,
    period,
    setPeriod,
    periodSales,
    periodSalesChange,
    weeklyChartData,
    refetch: fetchData,
  };
};

export default useSalesDashboard;
