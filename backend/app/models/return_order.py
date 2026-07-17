"""
Modelos de Devolución de Pedido
US-ORD-011: Procesamiento de Devoluciones
"""
from app import db
from datetime import datetime, date
import uuid


class Return(db.Model):
    """Modelo de Devolución (CA-6)"""

    __tablename__ = 'returns'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # CA-10/CA-11: Identificador legible (RET-YYYYMMDD-XXXX)
    return_number = db.Column(db.String(20), unique=True, nullable=False, index=True)

    # Foreign Keys
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False, index=True)
    created_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    approved_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)

    # CA-4: Motivo de la devolución
    reason = db.Column(db.String(100), nullable=False)
    reason_detail = db.Column(db.String(300), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    # CA-5: Monto de la devolución
    total_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)

    # CA-8: Estado de la devolución
    status = db.Column(db.String(20), nullable=False, default='Pendiente')

    # CA-9: Compensación al cliente
    refund_method = db.Column(db.String(20), nullable=True)
    refund_reference = db.Column(db.String(200), nullable=True)

    # Timestamps
    return_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    order = db.relationship('Order', backref=db.backref('returns', lazy='dynamic'))
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    approved_by = db.relationship('User', foreign_keys=[approved_by_id])
    items = db.relationship('ReturnItem', backref='return_order', lazy='joined', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Return {self.return_number}>'

    def to_dict(self, include_order=False):
        """Convertir devolución a diccionario"""
        data = {
            'id': self.id,
            'return_number': self.return_number,
            'order_id': self.order_id,
            'created_by_id': self.created_by_id,
            'created_by_name': self.created_by.full_name if self.created_by else None,
            'approved_by_id': self.approved_by_id,
            'approved_by_name': self.approved_by.full_name if self.approved_by else None,
            'reason': self.reason,
            'reason_detail': self.reason_detail,
            'notes': self.notes,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'status': self.status,
            'refund_method': self.refund_method,
            'refund_reference': self.refund_reference,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_order and self.order:
            data['order_number'] = self.order.order_number
            data['customer_name'] = self.order.customer.nombre_razon_social if self.order.customer else None
            data['customer_id'] = self.order.customer_id
        return data

    @staticmethod
    def generate_return_number():
        """CA-6: Genera identificador único con formato RET-YYYYMMDD-XXXX"""
        today = date.today()
        date_str = today.strftime('%Y%m%d')
        prefix = f'RET-{date_str}-'

        last_return = Return.query.filter(
            Return.return_number.like(f'{prefix}%')
        ).order_by(Return.return_number.desc()).first()

        if last_return:
            last_seq = int(last_return.return_number.split('-')[-1])
            new_seq = last_seq + 1
        else:
            new_seq = 1

        return f'{prefix}{new_seq:04d}'


class ReturnItem(db.Model):
    """Modelo de Ítem de Devolución"""

    __tablename__ = 'return_items'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    return_id = db.Column(db.String(36), db.ForeignKey('returns.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)

    # Datos del item devuelto
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)
    item_reason = db.Column(db.String(300), nullable=True)

    # Snapshot del producto al momento de la devolución
    product_name = db.Column(db.String(200), nullable=False)
    product_sku = db.Column(db.String(50), nullable=False)

    # Relaciones
    product = db.relationship('Product', backref=db.backref('return_items', lazy='dynamic'))

    def __repr__(self):
        return f'<ReturnItem {self.product_name} x{self.quantity}>'

    def to_dict(self):
        """Convertir item a diccionario"""
        return {
            'id': self.id,
            'return_id': self.return_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price else 0.0,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'item_reason': self.item_reason,
            'product_name': self.product_name,
            'product_sku': self.product_sku,
        }
