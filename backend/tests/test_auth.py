import json
import pytest
from app.models.user import User


class TestUserRegistration:
    """Tests para US-AUTH-001: Registro de Usuario"""

    def test_successful_registration(self, client):
        """CA-4: Debe registrar un usuario exitosamente"""
        data = {
            'full_name': 'Juan Perez',
            'email': 'juan.perez@example.com',
            'password': 'Test1234',
            'role': 'Admin'
        }

        response = client.post('/api/auth/register',
                               data=json.dumps(data),
                               content_type='application/json')

        assert response.status_code == 201
        json_data = response.get_json()
        assert json_data['message'] == 'Usuario registrado correctamente'
        assert 'token' in json_data
        assert 'user' in json_data
        assert json_data['user']['email'] == 'juan.perez@example.com'
        assert json_data['user']['full_name'] == 'Juan Perez'
        assert json_data['user']['role'] == 'Admin'

    def test_password_strength_validation(self, client):
        """CA-2: Debe validar la fortaleza de la contraseña"""
        # Contraseña débil (sin mayúscula)
        data = {
            'full_name': 'Juan Pérez',
            'email': 'juan@example.com',
            'password': 'test1234',
            'role': 'Admin'
        }

        response = client.post('/api/auth/register',
                               data=json.dumps(data),
                               content_type='application/json')

        assert response.status_code == 400
        json_data = response.get_json()
        assert 'password' in json_data['errors']

    def test_duplicate_email(self, client):
        """CA-3: Debe rechazar emails duplicados"""
        # Registrar primer usuario
        data = {
            'full_name': 'Juan Pérez',
            'email': 'duplicate@example.com',
            'password': 'Test1234',
            'role': 'Admin'
        }
        client.post('/api/auth/register',
                    data=json.dumps(data),
                    content_type='application/json')

        # Intentar registrar con mismo email
        data2 = {
            'full_name': 'María García',
            'email': 'duplicate@example.com',
            'password': 'Test5678',
            'role': 'Gerente de Almacén'
        }
        response = client.post('/api/auth/register',
                               data=json.dumps(data2),
                               content_type='application/json')

        assert response.status_code == 400
        json_data = response.get_json()
        assert 'email' in json_data['errors']
        assert 'ya está registrado' in json_data['errors']['email'][0].lower()

    def test_required_fields(self, client):
        """CA-1: Debe validar campos requeridos"""
        data = {
            'full_name': 'Juan Pérez'
            # Faltan email, password, role
        }

        response = client.post('/api/auth/register',
                               data=json.dumps(data),
                               content_type='application/json')

        assert response.status_code == 400
        json_data = response.get_json()
        assert 'email' in json_data['errors']
        assert 'password' in json_data['errors']
        assert 'role' in json_data['errors']

    def test_invalid_role(self, client):
        """CA-1: Debe validar que el rol sea válido"""
        data = {
            'full_name': 'Juan Pérez',
            'email': 'juan@example.com',
            'password': 'Test1234',
            'role': 'InvalidRole'
        }

        response = client.post('/api/auth/register',
                               data=json.dumps(data),
                               content_type='application/json')

        assert response.status_code == 400
        json_data = response.get_json()
        assert 'role' in json_data['errors']

    def test_password_hashing(self, client):
        """Debe hashear la contraseña correctamente"""
        data = {
            'full_name': 'Juan Pérez',
            'email': 'hash.test@example.com',
            'password': 'Test1234',
            'role': 'Admin'
        }

        response = client.post('/api/auth/register',
                               data=json.dumps(data),
                               content_type='application/json')

        assert response.status_code == 201

        # Verificar que la contraseña no se devuelve
        json_data = response.get_json()
        assert 'password' not in json_data['user']
        assert 'password_hash' not in json_data['user']


class TestUserLogin:
    """Tests para el login de usuario"""

    def test_successful_login(self, client):
        """Debe hacer login exitosamente con credenciales correctas"""
        # Primero registrar un usuario
        register_data = {
            'full_name': 'Juan Pérez',
            'email': 'login.test@example.com',
            'password': 'Test1234',
            'role': 'Admin'
        }
        client.post('/api/auth/register',
                    data=json.dumps(register_data),
                    content_type='application/json')

        # Intentar login
        login_data = {
            'email': 'login.test@example.com',
            'password': 'Test1234'
        }
        response = client.post('/api/auth/login',
                               data=json.dumps(login_data),
                               content_type='application/json')

        assert response.status_code == 200
        json_data = response.get_json()
        assert 'token' in json_data
        assert 'user' in json_data

    def test_login_invalid_password(self, client):
        """Debe rechazar login con contraseña incorrecta"""
        # Primero registrar un usuario
        register_data = {
            'full_name': 'Juan Pérez',
            'email': 'wrong.pass@example.com',
            'password': 'Test1234',
            'role': 'Admin'
        }
        client.post('/api/auth/register',
                    data=json.dumps(register_data),
                    content_type='application/json')

        # Intentar login con contraseña incorrecta
        login_data = {
            'email': 'wrong.pass@example.com',
            'password': 'WrongPassword'
        }
        response = client.post('/api/auth/login',
                               data=json.dumps(login_data),
                               content_type='application/json')

        assert response.status_code == 401


class TestGetUsers:
    """Tests para listar usuarios"""

    def test_get_all_users(self, client):
        """CA-4: Debe listar todos los usuarios registrados"""
        # Registrar algunos usuarios
        users_data = [
            {'full_name': 'Admin User', 'email': 'admin@example.com',
             'password': 'Admin123', 'role': 'Admin'},
            {'full_name': 'Manager User', 'email': 'manager@example.com',
             'password': 'Manager123', 'role': 'Gerente de Almacén'},
            {'full_name': 'Sales User', 'email': 'sales@example.com',
             'password': 'Sales123', 'role': 'Personal de Ventas'}
        ]

        for user_data in users_data:
            client.post('/api/auth/register',
                        data=json.dumps(user_data),
                        content_type='application/json')

        # Obtener lista de usuarios
        response = client.get('/api/auth/users')

        assert response.status_code == 200
        json_data = response.get_json()
        assert len(json_data) == 3
        assert all('email' in user for user in json_data)
        assert all('password' not in user for user in json_data)
