/**
 * LowStockReport – Reporte de Productos con Stock Bajo
 * US-REP-008: Reporte de Productos con Stock Bajo
 *
 * CA-1: Productos con stock en o bajo el punto de reorden
 * CA-2: Nombre, SKU, stock actual, punto de reorden, proveedor preferido, días estimados sin stock
 * CA-3: Ordenado por urgencia (sin stock primero, luego por días estimados)
 * CA-4: Cantidad sugerida de reorden basada en promedio de ventas
 * CA-5: Agrupación por proveedor
 * CA-6: Crear órdenes de compra directamente desde el reporte
 * CA-7: Exportación a Excel/CSV
 * CA-8: Timestamp del reporte
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
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
  IconButton,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Home as HomeIcon,
  Assessment as ReportIcon,
  WarningAmber as WarningIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as SupplierIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import reportService from '../../services/reportService';

// CA-5: Agrupa los productos por proveedor preferido (o "sin proveedor")
const groupBySupplier = (products) => {
  const groups = new Map();
  for (const p of products) {
    const key = p.preferred_supplier?.supplier_id || 'none';
    if (!groups.has(key)) {
      groups.set(key, {
        supplierId: p.preferred_supplier?.supplier_id || null,
        supplierName: p.preferred_supplier?.supplier_name || 'Sin proveedor asignado',
        items: [],
      });
    }
    groups.get(key).items.push(p);
  }
  return Array.from(groups.values()).sort((a, b) => {
    if (!a.supplierId) return 1;
    if (!b.supplierId) return -1;
    return a.supplierName.localeCompare(b.supplierName);
  });
};

function MetricCard({ icon, value, label, color = 'primary' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
        <Box sx={{ color: `${color}.main`, mb: 1 }}>{icon}</Box>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
}

const LowStockReport = () => {
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getLowStockReport();
      if (response.success) {
        setReport(response.data);
      } else {
        setError(response.error?.message || 'Error al cargar el reporte');
      }
    } catch (err) {
      setError(err.error?.message || 'Error al cargar el reporte de stock bajo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const groups = useMemo(() => groupBySupplier(report?.products || []), [report]);

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    setExporting(true);
    try {
      await reportService.exportLowStockReport(format);
    } catch (err) {
      setError(err?.error?.message || 'Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  // CA-6: Crea una orden de compra prellenada con los productos del proveedor
  const handleCreateOrder = (group) => {
    const items = group.items.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      product_sku: p.product_sku,
      quantity_ordered: p.suggested_quantity,
      unit_cost: p.preferred_supplier?.preferential_price ?? 0,
    }));

    navigate('/purchase-orders/new', {
      state: {
        prefill: {
          supplier: group.supplierId ? { id: group.supplierId, company_name: group.supplierName } : null,
          items,
        },
      },
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/dashboard')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          Inicio
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ReportIcon fontSize="small" />
          Productos con Stock Bajo
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Reporte de Productos con Stock Bajo</Typography>
          {/* CA-8: Timestamp del reporte */}
          <Typography variant="body2" color="text.secondary">
            {report?.generated_at
              ? `Generado: ${new Date(report.generated_at).toLocaleString('es-CO')}`
              : '—'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Actualizar">
            <IconButton onClick={fetchReport} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={exporting || !report?.products?.length}
          >
            Exportar
          </Button>
          <Menu anchorEl={exportMenuAnchor} open={Boolean(exportMenuAnchor)} onClose={() => setExportMenuAnchor(null)}>
            <MenuItem onClick={() => handleExport('csv')}>Exportar CSV</MenuItem>
            <MenuItem onClick={() => handleExport('excel')}>Exportar Excel (.xlsx)</MenuItem>
          </Menu>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <MetricCard
            icon={<WarningIcon sx={{ fontSize: 28 }} />}
            value={report?.total_products ?? 0}
            label="Productos que Necesitan Reabastecimiento"
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <MetricCard
            icon={<WarningIcon sx={{ fontSize: 28 }} />}
            value={report?.out_of_stock_count ?? 0}
            label="Sin Stock (Urgente)"
            color="error"
          />
        </Grid>
      </Grid>

      {loading ? (
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </Paper>
      ) : groups.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay productos que necesiten reabastecimiento</Typography>
        </Paper>
      ) : (
        groups.map((group) => (
          <Paper key={group.supplierId || 'none'} variant="outlined" sx={{ mb: 3 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SupplierIcon fontSize="small" color="action" />
                {group.supplierName}
                <Typography component="span" variant="body2" color="text.secondary">
                  ({group.items.length} {group.items.length === 1 ? 'producto' : 'productos'})
                </Typography>
              </Typography>
              {/* CA-6: Crear orden de compra desde el reporte */}
              <Button
                size="small"
                variant="contained"
                startIcon={<OrderIcon />}
                onClick={() => handleCreateOrder(group)}
              >
                Crear Orden de Compra
              </Button>
            </Box>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Stock Actual</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Punto de Reorden</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Días Estimados Sin Stock</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Cantidad Sugerida</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.items.map((p) => (
                    <TableRow key={p.product_id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${p.product_id}`)}>
                      <TableCell>{p.product_name}</TableCell>
                      <TableCell>{p.product_sku}</TableCell>
                      <TableCell align="right">{p.stock_quantity}</TableCell>
                      <TableCell align="right">{p.reorder_point}</TableCell>
                      <TableCell align="right">
                        {p.is_out_of_stock ? (
                          <Chip label="Sin stock" size="small" color="error" />
                        ) : p.days_until_stockout !== null ? (
                          <Chip label={`${p.days_until_stockout} días`} size="small" color={p.days_until_stockout <= 7 ? 'warning' : 'default'} variant="outlined" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">Sin datos de venta</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{p.suggested_quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))
      )}
    </Container>
  );
};

export default LowStockReport;
