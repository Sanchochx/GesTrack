import { Container, Box } from '@mui/material';
import LoginForm from '../../components/forms/LoginForm';

/**
 * Página de Inicio de Sesión
 * US-AUTH-002: Inicio de Sesión
 */
const Login = () => {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)', // Minus AppBar height
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3
      }}
    >
      <Container maxWidth="sm">
        <LoginForm />
      </Container>
    </Box>
  );
};

export default Login;
