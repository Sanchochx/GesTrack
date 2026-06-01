import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import UserList from './pages/Auth/UserList';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Profile from './pages/Profile/Profile';
import MainDashboard from './pages/Dashboard/MainDashboard';
import SalesDashboard from './pages/Dashboard/SalesDashboard';
import Forbidden from './pages/Errors/Forbidden';
import ProductList from './pages/Products/ProductList';
import CreateProduct from './pages/Products/CreateProduct';
import ProductDetail from './pages/Products/ProductDetail';
import EditProduct from './pages/Products/EditProduct';
import LowStockProducts from './pages/Products/LowStockProducts';
import Categories from './pages/Categories/Categories';
import ManualAdjustments from './pages/Inventory/ManualAdjustments';
import MovementHistory from './pages/Inventory/MovementHistory';
import CategoryInventoryView from './pages/Inventory/CategoryInventoryView';
import OutOfStockProducts from './pages/Inventory/OutOfStockProducts';
import InventoryDashboard from './pages/Inventory/InventoryDashboard';
import CustomerList from './pages/Customers/CustomerList';
import CreateCustomer from './pages/Customers/CreateCustomer';
import CustomerDetail from './pages/Customers/CustomerDetail';
import EditCustomer from './pages/Customers/EditCustomer';
import CustomerOrderHistory from './pages/Customers/CustomerOrderHistory';
import CustomerSegmentation from './pages/Customers/CustomerSegmentation';
import CreateOrder from './pages/Orders/CreateOrder';
import OrderList from './pages/Orders/OrderList';
import OrderDetail from './pages/Orders/OrderDetail';
import ProtectedRoute from './components/common/ProtectedRoute';
import authService from './services/authService';

/**
 * Redirige al dashboard correcto según el rol del usuario.
 * US-AUTH-005: CA-5 — Dashboard dinámico según rol
 */
function DashboardRedirect() {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) return <Navigate to="/login" replace />;

  switch (currentUser.role) {
    case 'Admin':
      return <Navigate to="/dashboard/admin" replace />;
    case 'Gerente de Almacén':
      return <Navigate to="/dashboard/warehouse" replace />;
    case 'Personal de Ventas':
      return <Navigate to="/dashboard/sales" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Public / Auth routes — no sidebar layout */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forbidden" element={<Forbidden />} />

          {/* Protected — Admin only */}
          <Route
            path="/users"
            element={<ProtectedRoute allowedRoles={['Admin']}><UserList /></ProtectedRoute>}
          />

          {/* Protected — all roles */}
          <Route
            path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />

          {/* Dashboard routing */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin"
            element={<ProtectedRoute allowedRoles={['Admin']}><MainDashboard /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/warehouse"
            element={<ProtectedRoute allowedRoles={['Gerente de Almacén']}><MainDashboard /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/sales"
            element={<ProtectedRoute allowedRoles={['Personal de Ventas']}><SalesDashboard /></ProtectedRoute>}
          />

          {/* Products */}
          <Route
            path="/products"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><ProductList /></ProtectedRoute>}
          />
          <Route
            path="/products/new"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><CreateProduct /></ProtectedRoute>}
          />
          <Route
            path="/products/low-stock"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><LowStockProducts /></ProtectedRoute>}
          />
          <Route
            path="/products/:id/edit"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><EditProduct /></ProtectedRoute>}
          />
          <Route
            path="/products/:id"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><ProductDetail /></ProtectedRoute>}
          />

          {/* Inventory */}
          <Route
            path="/inventory/adjustments"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><ManualAdjustments /></ProtectedRoute>}
          />
          <Route
            path="/inventory/history"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><MovementHistory /></ProtectedRoute>}
          />
          <Route
            path="/inventory/by-category"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><CategoryInventoryView /></ProtectedRoute>}
          />
          <Route
            path="/inventory/out-of-stock"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><OutOfStockProducts /></ProtectedRoute>}
          />
          <Route
            path="/inventory/dashboard"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><InventoryDashboard /></ProtectedRoute>}
          />

          {/* Customers */}
          <Route
            path="/customers"
            element={<ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}><CustomerList /></ProtectedRoute>}
          />
          <Route
            path="/customers/new"
            element={<ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}><CreateCustomer /></ProtectedRoute>}
          />
          <Route
            path="/customers/segmentation"
            element={<ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}><CustomerSegmentation /></ProtectedRoute>}
          />
          <Route
            path="/customers/:id/orders"
            element={<ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}><CustomerOrderHistory /></ProtectedRoute>}
          />
          <Route
            path="/customers/:id/edit"
            element={<ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}><EditCustomer /></ProtectedRoute>}
          />
          <Route
            path="/customers/:id"
            element={<ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}><CustomerDetail /></ProtectedRoute>}
          />

          {/* Orders */}
          <Route
            path="/orders"
            element={<ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}><OrderList /></ProtectedRoute>}
          />
          <Route
            path="/orders/new"
            element={<ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}><CreateOrder /></ProtectedRoute>}
          />
          <Route
            path="/orders/:id"
            element={<ProtectedRoute allowedRoles={['Admin', 'Personal de Ventas', 'Gerente de Almacén']}><OrderDetail /></ProtectedRoute>}
          />

          {/* Categories */}
          <Route
            path="/categories"
            element={<ProtectedRoute allowedRoles={['Admin', 'Gerente de Almacén']}><Categories /></ProtectedRoute>}
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
