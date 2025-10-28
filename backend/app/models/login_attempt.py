from app import db
from datetime import datetime
import uuid


class LoginAttempt(db.Model):
    """
    Modelo para rastrear intentos de inicio de sesión fallidos
    US-AUTH-002 - CA-4: Login Fallido
    """
    __tablename__ = 'login_attempts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), nullable=False, index=True)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv4 o IPv6
    attempt_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    success = db.Column(db.Boolean, nullable=False, default=False)

    def __repr__(self):
        return f'<LoginAttempt {self.email} at {self.attempt_time}>'

    @staticmethod
    def record_attempt(email, ip_address=None, success=False):
        """
        Registra un intento de login

        Args:
            email: Email del usuario
            ip_address: Dirección IP (opcional)
            success: Si el intento fue exitoso

        Returns:
            LoginAttempt: El registro creado
        """
        attempt = LoginAttempt(
            email=email.lower().strip(),
            ip_address=ip_address,
            success=success
        )
        db.session.add(attempt)
        db.session.commit()
        return attempt

    @staticmethod
    def get_failed_attempts_count(email, minutes=15):
        """
        Cuenta los intentos fallidos recientes para un email

        Args:
            email: Email del usuario
            minutes: Ventana de tiempo en minutos (default: 15)

        Returns:
            int: Número de intentos fallidos en el período
        """
        from datetime import timedelta

        time_threshold = datetime.utcnow() - timedelta(minutes=minutes)

        failed_count = LoginAttempt.query.filter(
            LoginAttempt.email == email.lower().strip(),
            LoginAttempt.success == False,
            LoginAttempt.attempt_time >= time_threshold
        ).count()

        return failed_count

    @staticmethod
    def is_account_locked(email, max_attempts=5, lockout_minutes=15):
        """
        Verifica si una cuenta está bloqueada por múltiples intentos fallidos

        Args:
            email: Email del usuario
            max_attempts: Número máximo de intentos permitidos (default: 5)
            lockout_minutes: Minutos de bloqueo (default: 15)

        Returns:
            tuple: (is_locked: bool, remaining_attempts: int)
        """
        failed_count = LoginAttempt.get_failed_attempts_count(email, lockout_minutes)

        is_locked = failed_count >= max_attempts
        remaining_attempts = max(0, max_attempts - failed_count)

        return is_locked, remaining_attempts

    @staticmethod
    def clear_failed_attempts(email):
        """
        Limpia los intentos fallidos para un email (llamar al login exitoso)

        Args:
            email: Email del usuario
        """
        from datetime import timedelta

        time_threshold = datetime.utcnow() - timedelta(minutes=15)

        # No eliminar, solo marcar como exitoso el último
        LoginAttempt.record_attempt(email, success=True)
