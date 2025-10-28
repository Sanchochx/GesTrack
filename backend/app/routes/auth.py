from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.schemas.user_schema import (
    user_registration_schema,
    user_schema,
    users_schema,
    user_profile_update_schema,
    user_password_change_schema
)
from app.services.auth_service import AuthService
from app.utils.decorators import admin_required

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

        # Obtener IP del cliente para control de intentos (CA-4)
        ip_address = request.remote_addr

        # Obtener remember_me (CA-5)
        remember_me = data.get('remember_me', False)

        # Autenticar usuario
        user, token = AuthService.login_user(
            email=data['email'],
            password=data['password'],
            ip_address=ip_address,
            remember_me=remember_me
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
@admin_required
def get_users():
    """
    GET /api/auth/users
    Obtiene la lista de todos los usuarios
    US-AUTH-005 CA-3: Solo Admin puede listar usuarios

    Returns:
        200: Lista de usuarios
        401: No autenticado
        403: Sin permisos (solo Admin)
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


@auth_bp.route('/users/<user_id>', methods=['PATCH'])
@jwt_required()
def update_user_profile(user_id):
    """
    PATCH /api/auth/users/:id
    Actualiza el perfil de un usuario
    US-AUTH-004: CA-3, CA-4 - Update profile information

    Request Body:
        {
            "full_name": "Nombre Actualizado",  // optional
            "email": "nuevo@example.com"        // optional
        }

    Returns:
        200: Perfil actualizado correctamente
        400: Errores de validación
        401: No autenticado
        403: Sin permiso para actualizar este usuario
        500: Error del servidor
    """
    try:
        # Verificar que el usuario solo pueda actualizar su propio perfil
        current_user_id = get_jwt_identity()
        if current_user_id != user_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'FORBIDDEN',
                    'message': 'No tienes permiso para actualizar este perfil'
                }
            }), 403

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

        # Validar datos con Marshmallow
        try:
            validated_data = user_profile_update_schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Errores de validación',
                    'details': err.messages
                }
            }), 400

        # Actualizar perfil usando el servicio
        user = AuthService.update_user_profile(
            user_id=user_id,
            full_name=validated_data.get('full_name'),
            email=validated_data.get('email')
        )

        # Respuesta exitosa (CA-6)
        return jsonify({
            'success': True,
            'message': 'Perfil actualizado correctamente',
            'data': {
                'user': user_schema.dump(user)
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'UPDATE_ERROR',
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


@auth_bp.route('/users/<user_id>/password', methods=['PUT'])
@jwt_required()
def change_user_password(user_id):
    """
    PUT /api/auth/users/:id/password
    Cambia la contraseña de un usuario
    US-AUTH-004: CA-5 - Password change functionality

    Request Body:
        {
            "current_password": "CurrentPassword123",
            "new_password": "NewPassword123",
            "confirm_password": "NewPassword123"
        }

    Returns:
        200: Contraseña cambiada correctamente
        400: Errores de validación
        401: No autenticado
        403: Sin permiso para cambiar esta contraseña
        500: Error del servidor
    """
    try:
        # Verificar que el usuario solo pueda cambiar su propia contraseña
        current_user_id = get_jwt_identity()
        if current_user_id != user_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'FORBIDDEN',
                    'message': 'No tienes permiso para cambiar esta contraseña'
                }
            }), 403

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

        # Validar datos con Marshmallow (CA-5)
        try:
            validated_data = user_password_change_schema.load(data)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Errores de validación',
                    'details': err.messages
                }
            }), 400

        # Cambiar contraseña usando el servicio (CA-5)
        user = AuthService.change_user_password(
            user_id=user_id,
            current_password=validated_data['current_password'],
            new_password=validated_data['new_password'],
            confirm_password=validated_data['confirm_password']
        )

        # Respuesta exitosa (CA-6)
        return jsonify({
            'success': True,
            'message': 'Contraseña cambiada correctamente',
            'data': {
                'user': user_schema.dump(user)
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'PASSWORD_CHANGE_ERROR',
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
