import uuid
from datetime import datetime, timedelta
from app import db
import secrets
import hashlib


class PasswordResetToken(db.Model):
    """
    Modelo de Token de Recuperación de Contraseña
    US-AUTH-006: Password Recovery

    Almacena tokens seguros de un solo uso para resetear contraseñas.
    Los tokens expiran después de 1 hora desde su creación.
    """
    __tablename__ = 'password_reset_tokens'

    # Campos principales
    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    user_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    token_hash = db.Column(db.String(64), nullable=False, unique=True, index=True)
    used = db.Column(db.Boolean, default=False, nullable=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

    # Relación con User
    user = db.relationship('User', backref=db.backref('password_reset_tokens', lazy='dynamic'))

    def __init__(self, user_id, **kwargs):
        """
        Constructor que establece automáticamente la fecha de expiración
        """
        super(PasswordResetToken, self).__init__(user_id=user_id, **kwargs)
        # Token expira en 1 hora
        self.expires_at = datetime.utcnow() + timedelta(hours=1)

    @staticmethod
    def generate_token():
        """
        Genera un token seguro y aleatorio

        Returns:
            str: Token sin hashear (para enviar por email)
        """
        # Genera un token URL-safe de 32 bytes (43 caracteres en base64)
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_token(token):
        """
        Hashea un token usando SHA256

        Args:
            token: Token en texto plano

        Returns:
            str: Token hasheado (hex)
        """
        return hashlib.sha256(token.encode('utf-8')).hexdigest()

    def is_valid(self):
        """
        Verifica si el token es válido

        Returns:
            bool: True si el token no ha sido usado y no ha expirado
        """
        if self.used:
            return False

        if datetime.utcnow() > self.expires_at:
            return False

        return True

    def mark_as_used(self):
        """
        Marca el token como usado
        """
        self.used = True
        db.session.commit()

    def is_expired(self):
        """
        Verifica si el token ha expirado

        Returns:
            bool: True si el token ha expirado
        """
        return datetime.utcnow() > self.expires_at

    @classmethod
    def invalidate_user_tokens(cls, user_id):
        """
        Invalida todos los tokens activos de un usuario
        Útil cuando se cambia la contraseña exitosamente

        Args:
            user_id: ID del usuario
        """
        cls.query.filter_by(user_id=user_id, used=False).update({'used': True})
        db.session.commit()

    @classmethod
    def find_by_token(cls, token):
        """
        Busca un token por su valor hasheado

        Args:
            token: Token en texto plano

        Returns:
            PasswordResetToken or None
        """
        token_hash = cls.hash_token(token)
        return cls.query.filter_by(token_hash=token_hash).first()

    @classmethod
    def cleanup_expired_tokens(cls):
        """
        Limpia tokens expirados de la base de datos
        Puede ser llamado periódicamente por un cron job
        """
        expired_date = datetime.utcnow()
        cls.query.filter(cls.expires_at < expired_date).delete()
        db.session.commit()

    def __repr__(self):
        return f'<PasswordResetToken user_id={self.user_id} expires_at={self.expires_at} used={self.used}>'
