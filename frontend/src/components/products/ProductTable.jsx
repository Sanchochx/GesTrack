import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  Typography,
  Box,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StockBadge from './StockBadge';
import ProfitMarginBadge from './ProfitMarginBadge';
import ProductCardView from './ProductCardView';
import DeleteProductDialog from './DeleteProductDialog';
import authService from '../../services/authService';

/**
 * ProductTable Component
 * US-PROD-002: List Products
 *
 * Complete product table with:
 * - CA-1: Table structure with all columns
 * - CA-2: Pagination controls
 * - CA-3: Stock indicators
 * - CA-4: Column sorting
 * - CA-7: Quick actions (view, edit, delete)
 * - CA-8: Responsive view (cards on mobile)
 */
const ProductTable = ({
  products = [],
  totalProducts = 0,
  page,
  itemsPerPage,
  sortField,
  sortOrder,
  onPageChange,
  onItemsPerPageChange,
  onSort,
  onProductDeleted,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 960px

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // US-PROD-006 CA-1: Verificar si el usuario es Admin
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'Admin';

  /**
   * Handle sort column click
   * CA-4: Column sorting
   */
  const handleSortClick = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    onSort(field, isAsc ? 'desc' : 'asc');
  };

  /**
   * Handle view product details
   * CA-7: Quick actions - view
   */
  const handleView = (productId) => {
    navigate(`/products/${productId}`);
  };

  /**
   * Handle edit product
   * CA-7: Quick actions - edit
   */
  const handleEdit = (productId) => {
    navigate(`/products/${productId}/edit`);
  };

  /**
   * Handle delete product request
   * US-PROD-006 CA-7: Quick actions - delete
   */
  const handleDeleteRequest = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  /**
   * Handle delete dialog close
   * US-PROD-006
   */
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  /**
   * Handle product deletion success
   * US-PROD-006 CA-7
   */
  const handleProductDeleted = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
    onProductDeleted && onProductDeleted();
  };

  /**
   * Format price to currency
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  /**
   * Handle page change
   * CA-2: Pagination
   */
  const handleChangePage = (event, newPage) => {
    onPageChange(newPage + 1); // MUI uses 0-based, API uses 1-based
  };

  /**
   * Handle rows per page change
   * CA-2: Items per page selector
   */
  const handleChangeRowsPerPage = (event) => {
    onItemsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(1); // Reset to first page
  };

  /**
   * Table column configuration
   * CA-1: Table structure
   * US-PROD-010 CA-5: Added profit margin column
   * US-INV-004 CA-3: Added reorder point column
   */
  const columns = [
    { id: 'image', label: 'Imagen', sortable: false, width: '100px' },
    { id: 'name', label: 'Nombre', sortable: true },
    { id: 'sku', label: 'SKU', sortable: true },
    { id: 'category', label: 'Categoría', sortable: true },
    { id: 'sale_price', label: 'Precio de Venta', sortable: true },
    { id: 'profit_margin', label: 'Margen', sortable: true }, // US-PROD-010 CA-5
    { id: 'stock_quantity', label: 'Stock Actual', sortable: true },
    { id: 'reorder_point', label: 'Punto de Reorden', sortable: true }, // US-INV-004 CA-3
    { id: 'actions', label: 'Acciones', sortable: false, align: 'right' },
  ];

  return (
    <>
      {/* CA-8: Responsive view - Show cards on mobile, table on desktop */}
      {isMobile ? (
        <Box>
          <ProductCardView
            products={products}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            isAdmin={isAdmin} // US-PROD-006 CA-1
          />
          {/* Pagination for mobile */}
          {products.length > 0 && (
            <Box component={Paper} sx={{ mt: 2 }}>
              <TablePagination
                component="div"
                count={totalProducts}
                page={page - 1}
                onPageChange={handleChangePage}
                rowsPerPage={itemsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="Por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </Box>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    style={{ width: column.width, fontWeight: 'bold' }}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={sortField === column.id}
                        direction={sortField === column.id ? sortOrder : 'asc'}
                        onClick={() => handleSortClick(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <Box sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No se encontraron productos
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                // US-PROD-008 CA-3: Determinar estado del stock usando reorder_point
                const reorderPoint = product.reorder_point || product.min_stock_level || 10;
                const isOutOfStock = product.stock_quantity === 0;
                const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= reorderPoint;

                return (
                  <TableRow
                    key={product.id}
                    hover
                    sx={{
                      // US-PROD-008 CA-3: Resaltar fila según estado de stock
                      backgroundColor: isOutOfStock
                        ? '#ffebee'  // Rojo tenue para sin stock
                        : isLowStock
                        ? '#fff3e0'  // Naranja/amarillo tenue para stock bajo
                        : 'inherit',
                      '&:hover': {
                        backgroundColor: isOutOfStock
                          ? '#ffcdd2 !important'
                          : isLowStock
                          ? '#ffe0b2 !important'
                          : undefined,
                      },
                    }}
                  >
                    {/* Image with lazy loading */}
                    <TableCell>
                      <Avatar
                        src={product.image_url}
                        alt={product.name}
                        variant="rounded"
                        sx={{ width: 80, height: 80 }}
                        imgProps={{ loading: 'lazy' }}
                      >
                        {product.name.charAt(0)}
                      </Avatar>
                    </TableCell>

                    {/* Name */}
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {product.name}
                      </Typography>
                      {product.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {product.description}
                        </Typography>
                      )}
                    </TableCell>

                    {/* SKU */}
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {product.sku}
                      </Typography>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Typography variant="body2">
                        {product.category?.name || 'Sin categoría'}
                      </Typography>
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {formatPrice(product.sale_price)}
                      </Typography>
                    </TableCell>

                    {/* Profit Margin - US-PROD-010 CA-5 */}
                    <TableCell>
                      <ProfitMarginBadge
                        profitMargin={product.profit_margin}
                        size="small"
                        showIcon={true}
                      />
                    </TableCell>

                    {/* Stock with Badge - US-PROD-008 CA-3 */}
                    <TableCell>
                      <StockBadge
                        stock={product.stock_quantity}
                        reorderPoint={product.reorder_point}
                        minStockLevel={product.min_stock_level}
                        showQuantity={true}
                      />
                    </TableCell>

                    {/* US-INV-004 CA-3: Reorder Point with Badge */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {product.reorder_point || 10}
                        </Typography>
                        {product.stock_quantity <= (product.reorder_point || 10) && (
                          <Tooltip title="Stock en o debajo del punto de reorden">
                            <Box
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: 'warning.main',
                                color: 'warning.contrastText',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <WarningIcon sx={{ fontSize: '0.875rem' }} />
                              REORDEN
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleView(product.id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(product.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* US-PROD-006 CA-1: Solo mostrar eliminar para Admin */}
                      <Tooltip title={isAdmin ? "Eliminar" : "Solo administradores pueden eliminar"}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRequest(product)}
                            disabled={!isAdmin}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {products.length > 0 && (
            <TablePagination
              component="div"
              count={totalProducts}
              page={page - 1} // MUI uses 0-based, convert from 1-based
              onPageChange={handleChangePage}
              rowsPerPage={itemsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Productos por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          )}
        </TableContainer>
      )}

      {/* US-PROD-006: Delete Product Dialog */}
      <DeleteProductDialog
        open={deleteDialogOpen}
        product={productToDelete}
        onClose={handleDeleteDialogClose}
        onDeleted={handleProductDeleted}
      />
    </>
  );
};

export default ProductTable;
