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
import ProductCardView from './ProductCardView';
import productService from '../../services/productService';

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
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

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
   * CA-7: Quick actions - delete
   */
  const handleDeleteRequest = (product) => {
    setProductToDelete(product);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  /**
   * Handle delete product confirmation
   */
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await productService.deleteProduct(productToDelete.id);

      if (response.success) {
        setDeleteDialogOpen(false);
        setProductToDelete(null);
        onProductDeleted && onProductDeleted();
      } else {
        setDeleteError(response.error?.message || 'Error al eliminar el producto');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setDeleteError(err.error?.message || 'Error al eliminar el producto');
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Handle delete dialog close
   */
  const handleDeleteCancel = () => {
    if (!deleting) {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      setDeleteError(null);
    }
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
   */
  const columns = [
    { id: 'image', label: 'Imagen', sortable: false, width: '100px' },
    { id: 'name', label: 'Nombre', sortable: true },
    { id: 'sku', label: 'SKU', sortable: true },
    { id: 'category', label: 'Categoría', sortable: true },
    { id: 'sale_price', label: 'Precio de Venta', sortable: true },
    { id: 'stock_quantity', label: 'Stock Actual', sortable: true },
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
                const isLowStock = product.stock_quantity <= product.min_stock_level;
                const isOutOfStock = product.stock_quantity === 0;

                return (
                  <TableRow
                    key={product.id}
                    hover
                    sx={{
                      backgroundColor: isOutOfStock
                        ? '#ffebee'
                        : isLowStock
                        ? '#fff3e0'
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

                    {/* Stock with Badge */}
                    <TableCell>
                      <StockBadge
                        stock={product.stock_quantity}
                        minStockLevel={product.min_stock_level}
                        showQuantity={true}
                      />
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
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRequest(product)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Eliminar Producto
        </DialogTitle>

        <DialogContent>
          {deleteError && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#ffebee', borderRadius: 1 }}>
              <Typography variant="body2" color="error">
                {deleteError}
              </Typography>
            </Box>
          )}

          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el producto{' '}
            <strong>{productToDelete?.name}</strong>?
          </DialogContentText>

          {productToDelete && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">
                <strong>SKU:</strong> {productToDelete.sku}
              </Typography>
              <Typography variant="body2">
                <strong>Precio:</strong> {formatPrice(productToDelete.sale_price)}
              </Typography>
              <Typography variant="body2">
                <strong>Stock:</strong> {productToDelete.stock_quantity} unidades
              </Typography>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductTable;
