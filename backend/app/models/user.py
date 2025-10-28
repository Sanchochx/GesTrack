import uuid
from datetime import datetime
from app import db
import bcrypt


class User(db.Model):
    """
    Modelo de Usuario del sistema

    Representa a los usuarios que tienen acceso al sistema GesTrack.
    Incluye autenticación, roles y control de acceso.
    """
    __tablename__ = 'users'

    # Campos principales
    id = db.Column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.Enum('Admin', 'Gerente de Almacén', 'Personal de Ventas', name='user_roles'),
        nullable=False
    )
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    def set_password(self, password):
        """
        Hash de la contraseña usando bcrypt

        Args:
            password: Contraseña en texto plano
        """
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=12)
        self.password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')

    def check_password(self, password):
        """
        Verifica si la contraseña es correcta

        Args:
            password: Contraseña en texto plano a verificar

        Returns:
            bool: True si la contraseña es correcta, False en caso contrario
        """
        password_bytes = password.encode('utf-8')
        password_hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, password_hash_bytes)

    def to_dict(self):
        """
        Convierte el usuario a diccionario (sin incluir password_hash)

        Returns:
            dict: Representación del usuario
        """
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<User {self.email} ({self.role})>'
