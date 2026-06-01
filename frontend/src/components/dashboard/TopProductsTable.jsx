import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Skeleton, Button,
} from '@mui/material';
import inventoryService from '../../services/inventoryService';

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v ?? 0);

const CATEGORY_COLORS = [
  { bg: 'rgba(0,105,72,0.08)', text: '#006948' },
  { bg: '#dae2fd', text: '#565e74' },
  { bg: '#ffdad7', text: '#9b3e3b' },
  { bg: '#eff4ff', text: '#006948' },
  { bg: '#e5eeff', text: '#565e74' },
];

// Assign consistent color per category name
const categoryColorCache = {};
let colorIndex = 0;
const getCategoryColor = (name) => {
  if (!categoryColorCache[name]) {
    categoryColorCache[name] = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
    colorIndex++;
  }
  return categoryColorCache[name];
};

/**
 * US-DASH-005 CA-3/4/5/6/7/8/9: Tabla top 10 productos por valor.
 */
const TopProductsTable = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getTopProductsByValue(10);
      setProducts(res.data ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #bccac0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #bccac0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 20, fontWeight: 600, color: '#0b1c30', fontFamily: 'Inter' }}>
          Top 10 Productos por Valor
        </Typography>
        <Button
          onClick={() => navigate('/products')}
          sx={{ color: '#006948', fontWeight: 700, fontSize: 12, fontFamily: 'Inter', textTransform: 'none', minWidth: 0, p: 0 }}
        >
          Ver Todo
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Valor Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                  </TableRow>
                ))
              : products.map((p, idx) => {
                  const catColor = getCategoryColor(p.category_name);
                  return (
                    <TableRow
                      key={p.product_id || idx}
                      hover
                      sx={{ cursor: 'pointer', height: 48 }}
                      onClick={() => navigate(`/products/${p.product_id}`)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '4px',
                              bgcolor: '#dce9ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700,
                              fontFamily: 'Inter',
                              color: '#0b1c30',
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </Box>
                          <Typography
                            sx={{ fontSize: 14, fontWeight: 700, fontFamily: 'Inter', color: '#0b1c30' }}
                            noWrap
                          >
                            {p.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.category_name}
                          size="small"
                          sx={{
                            bgcolor: catColor.bg,
                            color: catColor.text,
                            fontWeight: 500,
                            fontSize: 12,
                            borderRadius: '9999px',
                            border: 'none',
                            height: 22,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{ fontSize: 14, fontWeight: 600, fontFamily: 'Inter', fontVariantNumeric: 'tabular-nums', color: '#0b1c30' }}
                        >
                          {formatCOP(p.total_value)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TopProductsTable;
