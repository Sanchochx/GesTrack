"""
Modelo de Pago de Pedido
US-ORD-004: Estado de Pago del Pedido
"""
from app import db
from datetime import datetime, date
import uuid


class Payment(db.Model):
    """Modelo de Pago asociado a un pedido"""

    __tablename__ = 'payments'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    order_id = db.Column(
        db.String(36),
        db.ForeignKey('orders.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    created_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)

    # CA-4: Datos del pago
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)  # Efectivo | Tarjeta Débito | Tarjeta Crédito | Transferencia | Otro
    payment_date = db.Column(db.Date, nullable=False, default=date.today)
    notes = db.Column(db.String(200), nullable=True)

    # Soft delete (CA-4: para correcciones)
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    order = db.relationship('Order', back_populates='payments')
    created_by = db.relationship('User', foreign_keys=[created_by_id])

    def __repr__(self):
        return f'<Payment {self.id} ${self.amount}>'

    def to_dict(self):
        """Convertir pago a diccionario"""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'amount': float(self.amount) if self.amount else 0.0,
            'payment_method': self.payment_method,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'notes': self.notes,
            'created_by_id': self.created_by_id,
            'created_by_name': self.created_by.full_name if self.created_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
