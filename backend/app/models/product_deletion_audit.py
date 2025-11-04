"""
Modelo de Auditoría de Eliminación de Productos
US-PROD-006 CA-5: Registro de auditoría para eliminaciones
"""
from app import db
from datetime import datetime
import uuid


class ProductDeletionAudit(db.Model):
    """Modelo de Auditoría de Eliminación de Productos"""

    __tablename__ = 'product_deletion_audits'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Información del producto eliminado
    product_id = db.Column(db.String(36), nullable=False, index=True)
    product_data = db.Column(db.JSON, nullable=False)  # Snapshot completo del producto

    # Información de auditoría
    deleted_by_user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    deleted_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    reason = db.Column(db.Text, nullable=True)  # Razón opcional de eliminación

    # Relaciones
    deleted_by = db.relationship('User', foreign_keys=[deleted_by_user_id])

    def __repr__(self):
        return f'<ProductDeletionAudit {self.product_id} by {self.deleted_by_user_id}>'

    def to_dict(self):
        """Convertir auditoría a diccionario"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_data': self.product_data,
            'deleted_by_user_id': self.deleted_by_user_id,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None,
            'reason': self.reason
        }

    @classmethod
    def create_audit_record(cls, product, user_id, reason=None):
        """
        Crear registro de auditoría para producto eliminado

        Args:
            product: Instancia del producto a eliminar
            user_id: ID del usuario que elimina
            reason: Razón opcional de eliminación

        Returns:
            ProductDeletionAudit: Registro de auditoría creado
        """
        # Crear snapshot del producto incluyendo relaciones
        product_snapshot = product.to_dict()

        # Agregar información de categoría si existe
        if product.category:
            product_snapshot['category'] = {
                'id': product.category.id,
                'name': product.category.name,
                'color': product.category.color,
                'icon': product.category.icon
            }

        # Agregar margen de ganancia
        product_snapshot['profit_margin'] = product.calculate_profit_margin()

        audit_record = cls(
            product_id=product.id,
            product_data=product_snapshot,
            deleted_by_user_id=user_id,
            reason=reason
        )

        return audit_record
