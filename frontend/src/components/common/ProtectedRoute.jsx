import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

/**
 * Componente de Ruta Protegida
 * US-AUTH-003: CA-4 - Protección de rutas
 *
 * Verifica si el usuario está autenticado antes de permitir el acceso.
 * Si no está autenticado, redirige al login con un mensaje.
 *
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componente hijo a proteger
 * @param {Array<string>} props.allowedRoles - Roles permitidos (opcional)
 */
const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  // US-AUTH-003: CA-4 - Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          message: 'Debes iniciar sesión para acceder a esta página',
          from: location.pathname
        }}
        replace
      />
    );
  }

  // Verificar roles si se especificaron
  if (allowedRoles && allowedRoles.length > 0) {
    const currentUser = authService.getCurrentUser();

    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return (
        <Navigate
          to="/login"
          state={{
            message: 'No tienes permisos para acceder a esta página'
          }}
          replace
        />
      );
    }
  }

  // Usuario autenticado y con permisos, mostrar el componente
  return children;
};

export default ProtectedRoute;
