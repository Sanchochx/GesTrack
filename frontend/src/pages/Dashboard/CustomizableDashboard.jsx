/**
 * CustomizableDashboard – Dashboard Personalizable
 * US-REP-014: Dashboard Personalizable
 *
 * CA-1: Agregar/eliminar widgets del dashboard
 * CA-2: Catálogo de widgets disponibles
 * CA-3: Reordenar widgets mediante drag-and-drop
 * CA-4: Configuración guardada por usuario
 * CA-5: Restablecer a configuración por defecto
 * CA-6: Cada widget tiene actualización manual (heredada de los componentes reutilizados)
 * CA-7: Redimensionar widgets
 * CA-8: La personalización persiste entre sesiones
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Grid, Alert, Menu, MenuItem, ListItemText,
  Breadcrumbs, Link, IconButton, Tooltip, CircularProgress, Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon, Dashboard as DashboardIcon, Add as AddIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import dashboardPreferenceService from '../../services/dashboardPreferenceService';
import DashboardWidgetContainer from '../../components/dashboard/DashboardWidgetContainer';

import DailySalesCard from '../../components/dashboard/DailySalesCard';
import PendingOrdersCard from '../../components/dashboard/PendingOrdersCard';
import OutOfStockCard from '../../components/dashboard/OutOfStockCard';
import InventoryValueCard from '../../components/dashboard/InventoryValueCard';
import TopProductsTable from '../../components/dashboard/TopProductsTable';
import TopCategoriesPanel from '../../components/dashboard/TopCategoriesPanel';
import StockDistributionPanel from '../../components/dashboard/StockDistributionPanel';
import InventoryEvolutionChart from '../../components/dashboard/InventoryEvolutionChart';
import CategoryDistributionChart from '../../components/dashboard/CategoryDistributionChart';

const WIDGET_COMPONENTS = {
  daily_sales: DailySalesCard,
  pending_orders: PendingOrdersCard,
  out_of_stock: OutOfStockCard,
  inventory_value: InventoryValueCard,
  top_products: TopProductsTable,
  top_categories: TopCategoriesPanel,
  stock_distribution: StockDistributionPanel,
  inventory_evolution: InventoryEvolutionChart,
  category_distribution: CategoryDistributionChart,
};

const SIZE_GRID_PROPS = {
  third: { xs: 12, sm: 6, lg: 4 },
  half: { xs: 12, md: 6 },
  two_thirds: { xs: 12, lg: 8 },
  full: { xs: 12 },
};

const CustomizableDashboard = () => {
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);

  const dragIndex = useRef(null);
  const [draggingType, setDraggingType] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalogRes, prefsRes] = await Promise.all([
        dashboardPreferenceService.getWidgetCatalog(),
        dashboardPreferenceService.getPreferences(),
      ]);
      if (catalogRes.success) setCatalog(catalogRes.data || []);
      if (prefsRes.success) {
        setWidgets(prefsRes.data.widgets || []);
      } else {
        setError(prefsRes.error?.message || 'Error al cargar el dashboard');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el dashboard personalizado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // CA-4/CA-8: Persiste cualquier cambio en la configuración (agregar, quitar,
  // reordenar, redimensionar) para el usuario actual.
  const persist = useCallback(async (nextWidgets) => {
    setSaving(true);
    try {
      const response = await dashboardPreferenceService.savePreferences(nextWidgets);
      if (!response.success) {
        setError(response.error?.message || 'Error al guardar la configuración');
      }
    } catch (err) {
      setError(err?.error?.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  }, []);

  const updateWidgets = (nextWidgets) => {
    setWidgets(nextWidgets);
    persist(nextWidgets);
  };

  // CA-1: Agregar widget del catálogo
  const handleAddWidget = (widgetType) => {
    setAddMenuAnchor(null);
    const meta = catalog.find((w) => w.widget_type === widgetType);
    updateWidgets([...widgets, { widget_type: widgetType, size: meta?.default_size || 'half' }]);
  };

  // CA-1: Eliminar widget
  const handleRemoveWidget = (widgetType) => {
    updateWidgets(widgets.filter((w) => w.widget_type !== widgetType));
  };

  // CA-7: Redimensionar widget
  const handleSizeChange = (widgetType, size) => {
    updateWidgets(widgets.map((w) => (w.widget_type === widgetType ? { ...w, size } : w)));
  };

  // CA-5: Restablecer a configuración por defecto
  const handleReset = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await dashboardPreferenceService.resetPreferences();
      if (response.success) {
        setWidgets(response.data.widgets || []);
      } else {
        setError(response.error?.message || 'Error al restablecer el dashboard');
      }
    } catch (err) {
      setError(err?.error?.message || 'Error al restablecer el dashboard');
    } finally {
      setSaving(false);
    }
  };

  // CA-3: Reordenar mediante drag-and-drop (API nativa HTML5)
  const handleDragStart = (index, widgetType) => () => {
    dragIndex.current = index;
    setDraggingType(widgetType);
  };

  const handleDragOver = (index) => (e) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    const reordered = [...widgets];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(index, 0, moved);
    dragIndex.current = index;
    setWidgets(reordered);
  };

  const handleDrop = (e) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDraggingType(null);
    persist(widgets);
  };

  const availableToAdd = catalog.filter((c) => !widgets.some((w) => w.widget_type === c.widget_type));

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/dashboard')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          Inicio
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <DashboardIcon fontSize="small" />
          Mi Dashboard Personalizado
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Mi Dashboard Personalizado</Typography>
          <Typography variant="body2" color="text.secondary">
            Agrega, quita, reordena (arrastrando) y redimensiona los widgets que más te sirvan
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {saving && <CircularProgress size={18} />}
          <Tooltip title="Restablecer a configuración por defecto">
            <Button variant="outlined" startIcon={<ResetIcon />} onClick={handleReset} disabled={saving}>
              Restablecer
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={(e) => setAddMenuAnchor(e.currentTarget)}
            disabled={availableToAdd.length === 0}
          >
            Agregar Widget
          </Button>
          <Menu anchorEl={addMenuAnchor} open={Boolean(addMenuAnchor)} onClose={() => setAddMenuAnchor(null)}>
            {availableToAdd.map((w) => (
              <MenuItem key={w.widget_type} onClick={() => handleAddWidget(w.widget_type)}>
                <ListItemText>{w.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : widgets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">
            Tu dashboard está vacío. Usa &quot;Agregar Widget&quot; para empezar a personalizarlo.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {widgets.map((w, index) => {
            const Component = WIDGET_COMPONENTS[w.widget_type];
            const meta = catalog.find((c) => c.widget_type === w.widget_type);
            if (!Component) return null;
            return (
              <Grid item key={w.widget_type} {...SIZE_GRID_PROPS[w.size]}>
                <DashboardWidgetContainer
                  widgetType={w.widget_type}
                  size={w.size}
                  label={meta?.label || w.widget_type}
                  isDragging={draggingType === w.widget_type}
                  onDragStart={handleDragStart(index, w.widget_type)}
                  onDragOver={handleDragOver(index)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onSizeChange={handleSizeChange}
                  onRemove={handleRemoveWidget}
                >
                  <Component />
                </DashboardWidgetContainer>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default CustomizableDashboard;
