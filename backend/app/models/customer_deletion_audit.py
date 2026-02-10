"""
Modelo de Auditoría de Eliminación de Clientes
US-CUST-006 CA-8: Registro de auditoría para eliminaciones
"""
from app import db
from datetime import datetime
import uuid


class CustomerDeletionAudit(db.Model):
    """Modelo de Auditoría de Eliminación de Clientes"""

    __tablename__ = 'customer_deletion_audits'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Información del cliente eliminado
    customer_id = db.Column(db.String(36), nullable=False, index=True)
    customer_data = db.Column(db.JSON, nullable=False)  # Snapshot completo del cliente

    # Información de auditoría
    deleted_by_user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    deleted_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    reason = db.Column(db.Text, nullable=True)  # Razón opcional de eliminación

    # Relaciones
    deleted_by = db.relationship('User', foreign_keys=[deleted_by_user_id])

    def __repr__(self):
        return f'<CustomerDeletionAudit {self.customer_id} by {self.deleted_by_user_id}>'

    def to_dict(self):
        """Convertir auditoría a diccionario"""
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'customer_data': self.customer_data,
            'deleted_by_user_id': self.deleted_by_user_id,
            'deleted_by_name': self.deleted_by.full_name if self.deleted_by else None,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None,
            'reason': self.reason
        }

    @classmethod
    def create_audit_record(cls, customer, user_id, reason=None):
        """
        Crear registro de auditoría para cliente eliminado

        Args:
            customer: Instancia del cliente a eliminar
            user_id: ID del usuario que elimina
            reason: Razón opcional de eliminación

        Returns:
            CustomerDeletionAudit: Registro de auditoría creado
        """
        # Crear snapshot del cliente
        customer_snapshot = customer.to_dict()

        audit_record = cls(
            customer_id=customer.id,
            customer_data=customer_snapshot,
            deleted_by_user_id=user_id,
            reason=reason
        )

        return audit_record
