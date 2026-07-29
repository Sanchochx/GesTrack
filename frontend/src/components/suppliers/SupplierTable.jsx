import { useNavigate } from 'react-router-dom';
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
  Typography,
  Box,
  TablePagination,
  Chip,
  Stack,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  PendingActions as PendingIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

/**
 * SupplierTable Component
 * US-SUPP-002: Listar Proveedores
 * CA-1: Tabla con nombre, contacto, teléfono, email, categorías, órdenes activas
 * CA-2: Paginación
 * CA-3: Ordenamiento por nombre / fecha de registro
 * CA-4: Indicador de órdenes de compra pendientes
 */
const SupplierTable = ({
  suppliers = [],
  totalSuppliers = 0,
  page,
  itemsPerPage,
  sortField,
  sortOrder,
  onPageChange,
  onItemsPerPageChange,
  onSort,
}) => {
  const navigate = useNavigate();

  const handleSortClick = () => {
    const isAsc = sortField === 'company_name' && sortOrder === 'asc';
    onSort('company_name', isAsc ? 'desc' : 'asc');
  };

  const handleChangePage = (event, newPage) => {
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    onItemsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(1);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortField === 'company_name'}
                direction={sortField === 'company_name' ? sortOrder : 'asc'}
                onClick={handleSortClick}
              >
                Nombre
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Contacto</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Teléfono</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Categorías</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Órdenes Activas</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {suppliers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Box sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No se encontraron proveedores
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            suppliers.map((supplier) => (
              <TableRow
                key={supplier.id}
                hover
                onClick={() => navigate(`/suppliers/${supplier.id}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {supplier.company_name}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">{supplier.contact_name}</Typography>
                </TableCell>

                <TableCell>
                  <Typography
                    variant="body2"
                    component="a"
                    href={`tel:${supplier.phone}`}
                    sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    <PhoneIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    {supplier.phone}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography
                    variant="body2"
                    component="a"
                    href={`mailto:${supplier.email}`}
                    sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    <EmailIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    {supplier.email}
                  </Typography>
                </TableCell>

                <TableCell>
                  {supplier.categories && supplier.categories.length > 0 ? (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {supplier.categories.map((category) => (
                        <Chip key={category.id} label={category.name} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.disabled">—</Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{supplier.active_orders_count || 0}</Typography>
                    {supplier.has_pending_orders && (
                      <Tooltip title="Tiene órdenes de compra pendientes">
                        <PendingIcon fontSize="small" color="warning" />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>

                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Ver perfil">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/suppliers/${supplier.id}`)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {suppliers.length > 0 && (
        <TablePagination
          component="div"
          count={totalSuppliers}
          page={page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={itemsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Proveedores por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      )}
    </TableContainer>
  );
};

export default SupplierTable;
