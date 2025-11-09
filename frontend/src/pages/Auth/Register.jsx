import { Container, Box } from '@mui/material';
import UserRegistrationForm from '../../components/forms/UserRegistrationForm';

/**
 * Página de Registro de Usuario
 */
const Register = () => {
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
      <Container maxWidth="md">
        <UserRegistrationForm />
      </Container>
    </Box>
  );
};

export default Register;
