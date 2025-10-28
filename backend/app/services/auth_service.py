from app import db
from app.models.user import User
from app.utils.validators import validate_email_format
from flask_jwt_extended import create_access_token


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
    def login_user(email, password):
        """
        Autentica un usuario

        Args:
            email: Email del usuario
            password: Contraseña en texto plano

        Returns:
            tuple: (user: User, token: str) si las credenciales son válidas

        Raises:
            ValueError: Si las credenciales son inválidas
        """
        # Normalizar email
        _, normalized_email, _ = validate_email_format(email)

        # Buscar usuario
        user = User.query.filter_by(email=normalized_email).first()

        if not user:
            raise ValueError('Email o contraseña incorrectos')

        # Verificar contraseña
        if not user.check_password(password):
            raise ValueError('Email o contraseña incorrectos')

        # Verificar que el usuario esté activo
        if not user.is_active:
            raise ValueError('Esta cuenta está inactiva')

        # Generar token JWT
        token = create_access_token(identity=user.id)

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
