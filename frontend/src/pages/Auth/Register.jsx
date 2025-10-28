import { Container } from '@mui/material';
import UserRegistrationForm from '../../components/forms/UserRegistrationForm';

/**
 * Página de Registro de Usuario
 */
const Register = () => {
  return (
    <Container maxWidth="md">
      <UserRegistrationForm />
    </Container>
  );
};

export default Register;
