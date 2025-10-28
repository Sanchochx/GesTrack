from app import db
from app.models.user import User
from app.models.login_attempt import LoginAttempt
from app.utils.validators import validate_email_format
from flask_jwt_extended import create_access_token
from datetime import timedelta


class AuthService:
    """
    Servicio de autenticación
    Maneja la lógica de negocio para registro, login, etc.
    """

    @staticmethod
    def register_user(full_name, email, password, role):
        """
        Registra un nuevo usuario en el sistema

        Args:
            full_name: Nombre completo del usuario
            email: Email del usuario
            password: Contraseña en texto plano (será hasheada)
            role: Rol del usuario

        Returns:
            tuple: (user: User, token: str)

        Raises:
            ValueError: Si hay algún error en el registro
        """
        # Normalizar email
        _, normalized_email, _ = validate_email_format(email)

        # Crear nuevo usuario
        user = User(
            full_name=full_name.strip(),
            email=normalized_email,
            role=role
        )

        # Hash de contraseña usando el método del modelo
        user.set_password(password)

        try:
            # Guardar en base de datos
            db.session.add(user)
            db.session.commit()

            # Generar token JWT para el nuevo usuario
            token = create_access_token(identity=user.id)

            return user, token

        except Exception as e:
            db.session.rollback()
            raise ValueError(f'Error al registrar usuario: {str(e)}')

    @staticmethod
    def login_user(email, password, ip_address=None, remember_me=False):
        """
        Autentica un usuario
        US-AUTH-002 - CA-4: Control de intentos fallidos
        US-AUTH-002 - CA-5: Persistencia de sesión

        Args:
            email: Email del usuario
            password: Contraseña en texto plano
            ip_address: Dirección IP del cliente (opcional)
            remember_me: Si True, token válido por 30 días. Si False, 24 horas (CA-5)

        Returns:
            tuple: (user: User, token: str) si las credenciales son válidas

        Raises:
            ValueError: Si las credenciales son inválidas o la cuenta está bloqueada
        """
        # Normalizar email
        _, normalized_email, _ = validate_email_format(email)

        # Verificar si la cuenta está bloqueada (CA-4)
        is_locked, remaining_attempts = LoginAttempt.is_account_locked(normalized_email)

        if is_locked:
            raise ValueError('Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta nuevamente en 15 minutos.')

        # Buscar usuario
        user = User.query.filter_by(email=normalized_email).first()

        if not user:
            # Registrar intento fallido (CA-4)
            LoginAttempt.record_attempt(normalized_email, ip_address, success=False)
            raise ValueError('Email o contraseña incorrectos')

        # Verificar contraseña
        if not user.check_password(password):
            # Registrar intento fallido (CA-4)
            LoginAttempt.record_attempt(normalized_email, ip_address, success=False)

            # Calcular intentos restantes
            _, remaining = LoginAttempt.is_account_locked(normalized_email)

            if remaining > 0:
                raise ValueError(f'Email o contraseña incorrectos. Intentos restantes: {remaining}')
            else:
                raise ValueError('Email o contraseña incorrectos. Cuenta bloqueada temporalmente.')

        # Verificar que el usuario esté activo
        if not user.is_active:
            raise ValueError('Esta cuenta está inactiva')

        # Login exitoso - registrar intento exitoso (CA-4)
        LoginAttempt.record_attempt(normalized_email, ip_address, success=True)

        # Generar token JWT con expiración según "Remember me" (CA-5)
        if remember_me:
            # Si "Recordarme" está activado: 30 días
            expires_delta = timedelta(days=30)
        else:
            # Por defecto: 24 horas
            expires_delta = timedelta(hours=24)

        token = create_access_token(identity=user.id, expires_delta=expires_delta)

        return user, token

    @staticmethod
    def get_user_by_id(user_id):
        """
        Obtiene un usuario por su ID

        Args:
            user_id: ID del usuario

        Returns:
            User or None
        """
        return User.query.get(user_id)

    @staticmethod
    def get_all_users():
        """
        Obtiene todos los usuarios del sistema

        Returns:
            list[User]: Lista de usuarios
        """
        return User.query.order_by(User.created_at.desc()).all()
