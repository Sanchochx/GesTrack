import { useState, useEffect, useCallback } from 'react';
import orderService from '../services/orderService';
import customerService from '../services/customerService';

/**
 * DS-003: Hook que obtiene métricas y pedidos recientes para SalesDashboard.
 */
const useSalesDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersRes, customersRes] = await Promise.all([
        orderService.getOrders({ per_page: 5, sort_by: 'created_at', sort_order: 'desc' }),
        customerService.getCustomers({ per_page: 1, is_active: true }),
      ]);

      setRecentOrders(ordersRes.data || []);
      setMetrics(ordersRes.metrics || null);
      setTotalOrders(ordersRes.pagination?.total || 0);
      setActiveCustomers(customersRes.pagination?.total || 0);
    } catch (err) {
      setError(err?.error?.message || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    recentOrders,
    metrics,
    totalOrders,
    activeCustomers,
    refetch: fetchData,
  };
};

export default useSalesDashboard;
