from app import db
from app.models.user import User
from app.models.login_attempt import LoginAttempt
from app.models.password_reset_token import PasswordResetToken
from app.utils.validators import validate_email_format
from app.services.email_service import EmailService
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

            # Generar token JWT para el nuevo usuario (US-AUTH-005 CA-4)
            # Incluir rol en el token para validaciones de autorización
            token = create_access_token(
                identity=user.id,
                additional_claims={'role': user.role}
            )

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
        # US-AUTH-005 CA-4: Incluir rol en el token para validaciones de autorización
        if remember_me:
            # Si "Recordarme" está activado: 30 días
            expires_delta = timedelta(days=30)
        else:
            # Por defecto: 24 horas
            expires_delta = timedelta(hours=24)

        token = create_access_token(
            identity=user.id,
            expires_delta=expires_delta,
            additional_claims={'role': user.role}
        )

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

    @staticmethod
    def update_user_profile(user_id, full_name=None, email=None):
        """
        Actualiza el perfil de un usuario
        US-AUTH-004 - CA-3, CA-4: Update name and email

        Args:
            user_id: ID del usuario
            full_name: Nuevo nombre completo (opcional)
            email: Nuevo email (opcional)

        Returns:
            User: Usuario actualizado

        Raises:
            ValueError: Si hay algún error en la actualización
        """
        user = User.query.get(user_id)
        if not user:
            raise ValueError('Usuario no encontrado')

        # Actualizar nombre si se proporciona
        if full_name is not None:
            user.full_name = full_name.strip()

        # Actualizar email si se proporciona (CA-4)
        if email is not None:
            # Normalizar email
            _, normalized_email, _ = validate_email_format(email)

            # Verificar que no exista otro usuario con ese email
            existing_user = User.query.filter_by(email=normalized_email).first()
            if existing_user and existing_user.id != user_id:
                raise ValueError('Este email ya está registrado')

            user.email = normalized_email

        try:
            db.session.commit()
            return user
        except Exception as e:
            db.session.rollback()
            raise ValueError(f'Error al actualizar perfil: {str(e)}')

    @staticmethod
    def change_user_password(user_id, current_password, new_password, confirm_password):
        """
        Cambia la contraseña de un usuario
        US-AUTH-004 - CA-5: Password change with validation

        Args:
            user_id: ID del usuario
            current_password: Contraseña actual (para verificación)
            new_password: Nueva contraseña
            confirm_password: Confirmación de nueva contraseña

        Returns:
            User: Usuario actualizado

        Raises:
            ValueError: Si hay algún error en el cambio de contraseña
        """
        user = User.query.get(user_id)
        if not user:
            raise ValueError('Usuario no encontrado')

        # Verificar contraseña actual (CA-5)
        if not user.check_password(current_password):
            raise ValueError('La contraseña actual es incorrecta')

        # Verificar que las contraseñas coincidan (CA-5)
        if new_password != confirm_password:
            raise ValueError('Las contraseñas no coinciden')

        # Verificar que la nueva contraseña sea diferente (CA-5)
        if user.check_password(new_password):
            raise ValueError('La nueva contraseña debe ser diferente de la actual')

        try:
            # Cambiar contraseña (se hasheará automáticamente)
            user.set_password(new_password)
            db.session.commit()
            return user
        except Exception as e:
            db.session.rollback()
            raise ValueError(f'Error al cambiar contraseña: {str(e)}')

    @staticmethod
    def request_password_reset(email):
        """
        Solicita el reseteo de contraseña
        US-AUTH-006 - CA-2, CA-3, CA-4, CA-5: Password recovery request

        Args:
            email: Email del usuario

        Returns:
            bool: True si el proceso fue exitoso (siempre retorna True por seguridad)

        Raises:
            Exception: Si hay un error al enviar el email
        """
        # Normalizar email
        _, normalized_email, _ = validate_email_format(email)

        # Buscar usuario (CA-3: No revelar si el email existe o no)
        user = User.query.filter_by(email=normalized_email).first()

        # Si el usuario existe, crear token y enviar email
        if user:
            try:
                # Generar token seguro (CA-5)
                token = PasswordResetToken.generate_token()
                token_hash = PasswordResetToken.hash_token(token)

                # Crear registro en BD
                reset_token = PasswordResetToken(
                    user_id=user.id,
                    token_hash=token_hash
                )
                db.session.add(reset_token)
                db.session.commit()

                # Enviar email (CA-4)
                EmailService.send_password_reset_email(
                    user_email=user.email,
                    user_name=user.full_name,
                    reset_token=token  # Enviamos el token sin hashear
                )

            except Exception as e:
                db.session.rollback()
                # Log error pero no exponerlo al usuario
                raise Exception('Error al procesar la solicitud')

        # Siempre retornar True por seguridad (CA-3: evitar enumeration attacks)
        # Tanto si el email existe como si no
        return True

    @staticmethod
    def reset_password_with_token(token, new_password, confirm_password):
        """
        Resetea la contraseña usando el token
        US-AUTH-006 - CA-6, CA-7, CA-8, CA-9: Password reset with token

        Args:
            token: Token de recuperación
            new_password: Nueva contraseña
            confirm_password: Confirmación de nueva contraseña

        Returns:
            User: Usuario actualizado

        Raises:
            ValueError: Si el token es inválido, expirado o las contraseñas no coinciden
        """
        # Verificar que las contraseñas coincidan (CA-6)
        if new_password != confirm_password:
            raise ValueError('Las contraseñas no coinciden')

        # Buscar token
        reset_token = PasswordResetToken.find_by_token(token)

        # Verificar que el token existe (CA-7)
        if not reset_token:
            raise ValueError('Enlace inválido o ya utilizado')

        # Verificar que el token no ha expirado (CA-7)
        if reset_token.is_expired():
            raise ValueError('Este enlace ha expirado. Solicita uno nuevo')

        # Verificar que el token no ha sido usado (CA-7)
        if not reset_token.is_valid():
            raise ValueError('Enlace inválido o ya utilizado')

        # Obtener usuario
        user = User.query.get(reset_token.user_id)
        if not user:
            raise ValueError('Usuario no encontrado')

        try:
            # Cambiar contraseña (CA-8)
            user.set_password(new_password)

            # Marcar token como usado (CA-8)
            reset_token.mark_as_used()

            # Invalidar otros tokens activos del usuario
            PasswordResetToken.invalidate_user_tokens(user.id)

            db.session.commit()

            # Enviar email de notificación (CA-9)
            try:
                EmailService.send_password_changed_notification(
                    user_email=user.email,
                    user_name=user.full_name
                )
            except Exception as e:
                # Log error pero no fallar el proceso
                pass

            return user

        except Exception as e:
            db.session.rollback()
            raise ValueError(f'Error al resetear contraseña: {str(e)}')
