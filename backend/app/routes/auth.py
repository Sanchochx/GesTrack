from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from app.schemas.user_schema import user_registration_schema, user_schema, users_schema
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    POST /api/auth/register
    Registra un nuevo usuario en el sistema

    Request Body:
        {
            "full_name": "Juan Pérez",
            "email": "juan@example.com",
            "password": "Password123",
            "role": "Admin"
        }

    Returns:
        201: Usuario registrado exitosamente
        400: Errores de validación
        500: Error del servidor
    """
    try:
        # Obtener datos del request
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INVALID_DATA',
                    'message': 'No se proporcionaron datos'
                }
            }), 400

        # Validar datos con Marshmallow (CA-1, CA-2, CA-3, CA-5)
        try:
            validated_data = user_registration_schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Errores de validación',
                    'details': err.messages
                }
            }), 400

        # Registrar usuario usando el servicio
        user, token = AuthService.register_user(
            full_name=validated_data['full_name'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )

        # Respuesta exitosa (CA-4)
        return jsonify({
            'success': True,
            'message': 'Usuario registrado correctamente',
            'data': {
                'user': user_schema.dump(user),
                'token': token
            }
        }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'REGISTRATION_ERROR',
                'message': str(e)
            }
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'Error interno del servidor'
            }
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    Inicia sesión de un usuario

    Request Body:
        {
            "email": "juan@example.com",
            "password": "Password123"
        }

    Returns:
        200: Login exitoso
        400: Credenciales inválidas
        500: Error del servidor
    """
    try:
        data = request.get_json()

        if not data or 'email' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INVALID_DATA',
                    'message': 'Email y contraseña son requeridos'
                }
            }), 400

        # Autenticar usuario
        user, token = AuthService.login_user(
            email=data['email'],
            password=data['password']
        )

        return jsonify({
            'success': True,
            'message': 'Inicio de sesión exitoso',
            'data': {
                'user': user_schema.dump(user),
                'token': token
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'AUTH_ERROR',
                'message': str(e)
            }
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'Error interno del servidor'
            }
        }), 500


@auth_bp.route('/users', methods=['GET'])
def get_users():
    """
    GET /api/auth/users
    Obtiene la lista de todos los usuarios

    Returns:
        200: Lista de usuarios
        500: Error del servidor
    """
    try:
        users = AuthService.get_all_users()
        return jsonify({
            'success': True,
            'data': users_schema.dump(users)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'Error al obtener usuarios'
            }
        }), 500
