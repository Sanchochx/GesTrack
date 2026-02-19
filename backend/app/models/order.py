"""
Modelos de Pedido
US-ORD-001: Crear Pedido
"""
from app import db
from datetime import datetime, date
import uuid


class Order(db.Model):
    """Modelo de Pedido"""

    __tablename__ = 'orders'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # CA-5: Número de pedido único (ORD-YYYYMMDD-XXXX)
    order_number = db.Column(db.String(20), unique=True, nullable=False, index=True)

    # Foreign Keys
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=False)
    created_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # Estado
    status = db.Column(db.String(50), nullable=False, default='Pendiente')
    payment_status = db.Column(db.String(50), nullable=False, default='Pendiente')

    # CA-6: Totales
    subtotal = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    tax_percentage = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    tax_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    shipping_cost = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    discount_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    discount_justification = db.Column(db.String(500), nullable=True)
    total = db.Column(db.Numeric(12, 2), nullable=False, default=0)

    # Notas
    notes = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    customer = db.relationship('Customer', backref=db.backref('orders', lazy='dynamic'))
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    items = db.relationship('OrderItem', backref='order', lazy='joined', cascade='all, delete-orphan')
    status_history = db.relationship('OrderStatusHistory', backref='order', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Order {self.order_number}>'

    def to_dict(self):
        """Convertir pedido a diccionario"""
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer_id': self.customer_id,
            'customer': {
                'id': self.customer.id,
                'full_name': self.customer.full_name,
                'email': self.customer.email,
                'phone': self.customer.phone,
            } if self.customer else None,
            'created_by_id': self.created_by_id,
            'created_by_name': self.created_by.full_name if self.created_by else None,
            'status': self.status,
            'payment_status': self.payment_status,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'tax_percentage': float(self.tax_percentage) if self.tax_percentage else 0.0,
            'tax_amount': float(self.tax_amount) if self.tax_amount else 0.0,
            'shipping_cost': float(self.shipping_cost) if self.shipping_cost else 0.0,
            'discount_amount': float(self.discount_amount) if self.discount_amount else 0.0,
            'discount_justification': self.discount_justification,
            'total': float(self.total) if self.total else 0.0,
            'notes': self.notes,
            'items': [item.to_dict() for item in self.items],
            'items_count': len(self.items),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def generate_order_number():
        """
        CA-5: Genera número de pedido único con formato ORD-YYYYMMDD-XXXX
        """
        today = date.today()
        date_str = today.strftime('%Y%m%d')
        prefix = f'ORD-{date_str}-'

        # Buscar el último pedido del día
        last_order = Order.query.filter(
            Order.order_number.like(f'{prefix}%')
        ).order_by(Order.order_number.desc()).first()

        if last_order:
            last_seq = int(last_order.order_number.split('-')[-1])
            new_seq = last_seq + 1
        else:
            new_seq = 1

        return f'{prefix}{new_seq:04d}'


class OrderItem(db.Model):
    """Modelo de Item de Pedido"""

    __tablename__ = 'order_items'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)

    # Datos del item
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)

    # Snapshot del producto al momento del pedido
    product_name = db.Column(db.String(200), nullable=False)
    product_sku = db.Column(db.String(50), nullable=False)

    # Relaciones
    product = db.relationship('Product', backref=db.backref('order_items', lazy='dynamic'))

    def __repr__(self):
        return f'<OrderItem {self.product_name} x{self.quantity}>'

    def to_dict(self):
        """Convertir item a diccionario"""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price else 0.0,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'product_name': self.product_name,
            'product_sku': self.product_sku,
        }


class OrderStatusHistory(db.Model):
    """Modelo de Historial de Estado de Pedido"""

    __tablename__ = 'order_status_history'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    changed_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # Datos
    status = db.Column(db.String(50), nullable=False)
    notes = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    changed_by = db.relationship('User', foreign_keys=[changed_by_id])

    def __repr__(self):
        return f'<OrderStatusHistory {self.status}>'

    def to_dict(self):
        """Convertir historial a diccionario"""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'status': self.status,
            'changed_by_id': self.changed_by_id,
            'changed_by_name': self.changed_by.full_name if self.changed_by else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
