"""
Decoradores personalizados para control de acceso
US-AUTH-005: Control de Acceso por Roles
"""

import logging
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

# Configurar logger de seguridad (US-AUTH-005 CA-3)
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.WARNING)


def require_role(allowed_roles):
    """
    Decorador para restringir acceso a endpoints según roles
    US-AUTH-005 CA-3: Restricción en Backend
    US-AUTH-005 CA-4: Validación de Token JWT

    Uso:
        @require_role(['Admin'])
        @require_role(['Admin', 'Gerente de Almacén'])

    Args:
        allowed_roles: Lista de roles permitidos para acceder al endpoint

    Returns:
        Función decorada que valida el rol antes de ejecutar

    Raises:
        HTTP 401: Si el token es inválido o ha expirado
        HTTP 403: Si el usuario no tiene el rol requerido
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verificar que el JWT es válido (CA-4)
            verify_jwt_in_request()

            # Obtener el payload del JWT (CA-4)
            claims = get_jwt()

            # Extraer rol del token
            user_role = claims.get('role')

            # Verificar que el usuario tiene uno de los roles permitidos (CA-3)
            if user_role not in allowed_roles:
                # Registrar intento de acceso no autorizado (CA-3)
                user_id = get_jwt_identity()
                endpoint = request.endpoint
                method = request.method
                ip_address = request.remote_addr

                security_logger.warning(
                    f'Acceso denegado - User ID: {user_id}, Role: {user_role}, '
                    f'Endpoint: {endpoint}, Method: {method}, IP: {ip_address}, '
                    f'Required roles: {allowed_roles}'
                )

                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'FORBIDDEN',
                        'message': 'No tienes permisos para realizar esta acción'
                    }
                }), 403

            # Si pasa la validación, ejecutar la función
            return fn(*args, **kwargs)

        return wrapper
    return decorator


def admin_required(fn):
    return require_role(['Admin'])(fn)


def warehouse_manager_or_admin(fn):
    return require_role(['Admin', 'Gerente de Almacén'])(fn)


def sales_staff_or_admin(fn):
    return require_role(['Admin', 'Personal de Ventas'])(fn)
