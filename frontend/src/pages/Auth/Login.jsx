import { Container } from '@mui/material';
import LoginForm from '../../components/forms/LoginForm';

/**
 * Página de Inicio de Sesión
 * US-AUTH-002: Inicio de Sesión
 */
const Login = () => {
  return (
    <Container maxWidth="sm">
      <LoginForm />
    </Container>
  );
};

export default Login;
