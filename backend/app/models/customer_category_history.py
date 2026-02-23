"""
CustomerCategoryHistory - Historial de cambios de categoría de clientes
US-CUST-011 CA-8
"""
from app import db
from datetime import datetime
import uuid


class CustomerCategoryHistory(db.Model):
    """Registra los cambios de categoría de un cliente para auditoría."""
    __tablename__ = 'customer_category_history'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = db.Column(
        db.String(36),
        db.ForeignKey('customers.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    old_category = db.Column(db.String(20), nullable=True)   # None si es primer cálculo
    new_category = db.Column(db.String(20), nullable=False)

    # Pedido que disparó el cambio (puede ser None si fue recálculo manual)
    order_id = db.Column(db.String(36), nullable=True)

    # Monto total gastado al momento del cambio
    total_spent = db.Column(db.Numeric(12, 2), nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relación con Customer
    customer = db.relationship('Customer', backref=db.backref('category_history', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'old_category': self.old_category,
            'new_category': self.new_category,
            'order_id': self.order_id,
            'total_spent': float(self.total_spent) if self.total_spent else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
