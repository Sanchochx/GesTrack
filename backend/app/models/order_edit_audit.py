"""
Modelo de Auditoría de Edición de Pedidos
US-ORD-008 CA-10: Registro de auditoría para ediciones de pedidos
"""
from app import db
from datetime import datetime
import uuid


class OrderEditAudit(db.Model):
    """Modelo de Auditoría de Edición de Pedidos"""

    __tablename__ = 'order_edit_audits'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    edited_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # CA-10: Diff de campos y productos modificados
    changes = db.Column(db.JSON, nullable=False)
    edit_reason = db.Column(db.Text, nullable=True)

    # Timestamps
    edited_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    order = db.relationship('Order', backref=db.backref('edit_audits', lazy='dynamic', cascade='all, delete-orphan'))
    edited_by = db.relationship('User', foreign_keys=[edited_by_id])

    def __repr__(self):
        return f'<OrderEditAudit {self.order_id} by {self.edited_by_id}>'

    def to_dict(self):
        """Convertir auditoría a diccionario"""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'edited_by_id': self.edited_by_id,
            'edited_by_name': self.edited_by.full_name if self.edited_by else None,
            'changes': self.changes,
            'edit_reason': self.edit_reason,
            'edited_at': self.edited_at.isoformat() if self.edited_at else None,
        }
