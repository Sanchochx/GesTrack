"""
Modelo de Orden de Compra
US-SUPP-005: Crear Orden de Compra
US-SUPP-007: Gestionar Estados de Orden de Compra
US-SUPP-008: Recibir Mercancía (Actualizar Inventario)
US-SUPP-010: Editar Orden de Compra
"""
from app import db
from datetime import datetime, date
import uuid


class PurchaseOrder(db.Model):
    """Modelo de Orden de Compra a Proveedor"""

    __tablename__ = 'purchase_orders'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # CA-7: Número de orden único (PO-YYYYMMDD-XXXX)
    order_number = db.Column(db.String(20), unique=True, nullable=False, index=True)

    # Foreign Keys
    supplier_id = db.Column(db.String(36), db.ForeignKey('suppliers.id'), nullable=False)
    created_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # CA-8: Estado inicial "Pendiente"
    status = db.Column(db.String(50), nullable=False, default='Pendiente')

    # CA-10: Fecha estimada de entrega
    expected_delivery_date = db.Column(db.Date, nullable=True)

    # US-SUPP-008 CA-7: Fecha de recepción de mercancía
    received_at = db.Column(db.DateTime, nullable=True)

    # US-SUPP-011: Cancelación de la orden de compra
    cancelled_at = db.Column(db.DateTime, nullable=True)
    cancelled_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    cancellation_reason = db.Column(db.String(500), nullable=True)

    # CA-4/CA-5/CA-6: Totales
    subtotal = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    shipping_cost = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    total = db.Column(db.Numeric(12, 2), nullable=False, default=0)

    # Timestamps (CA-9: fecha de creación == order_date, capturada automáticamente)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    supplier = db.relationship('Supplier', backref=db.backref('purchase_orders', lazy='dynamic'))
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    cancelled_by = db.relationship('User', foreign_keys=[cancelled_by_id])
    items = db.relationship('PurchaseOrderItem', backref='purchase_order', lazy='joined', cascade='all, delete-orphan')
    status_history = db.relationship('PurchaseOrderStatusHistory', backref='purchase_order', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<PurchaseOrder {self.order_number}>'

    def to_dict(self):
        """Convertir orden de compra a diccionario"""
        return {
            'id': self.id,
            'order_number': self.order_number,
            'supplier_id': self.supplier_id,
            'supplier': {
                'id': self.supplier.id,
                'company_name': self.supplier.company_name,
                'contact_name': self.supplier.contact_name,
                'email': self.supplier.email,
                'phone': self.supplier.phone,
            } if self.supplier else None,
            'created_by_id': self.created_by_id,
            'created_by_name': self.created_by.full_name if self.created_by else None,
            'status': self.status,
            'expected_delivery_date': self.expected_delivery_date.isoformat() if self.expected_delivery_date else None,
            'received_at': self.received_at.isoformat() if self.received_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'cancelled_by_name': self.cancelled_by.full_name if self.cancelled_by else None,
            'cancellation_reason': self.cancellation_reason,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'shipping_cost': float(self.shipping_cost) if self.shipping_cost else 0.0,
            'total': float(self.total) if self.total else 0.0,
            'items': [item.to_dict() for item in self.items],
            'items_count': len(self.items),
            'status_history': [
                h.to_dict() for h in self.status_history.order_by(PurchaseOrderStatusHistory.created_at.desc())
            ],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def generate_order_number():
        """
        CA-7: Genera número de orden único con formato PO-YYYYMMDD-XXXX
        """
        today = date.today()
        date_str = today.strftime('%Y%m%d')
        prefix = f'PO-{date_str}-'

        last_order = PurchaseOrder.query.filter(
            PurchaseOrder.order_number.like(f'{prefix}%')
        ).order_by(PurchaseOrder.order_number.desc()).first()

        if last_order:
            last_seq = int(last_order.order_number.split('-')[-1])
            new_seq = last_seq + 1
        else:
            new_seq = 1

        return f'{prefix}{new_seq:04d}'


class PurchaseOrderItem(db.Model):
    """Modelo de Item de Orden de Compra"""

    __tablename__ = 'purchase_order_items'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    purchase_order_id = db.Column(db.String(36), db.ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)

    # CA-2/CA-3: Datos del item
    quantity_ordered = db.Column(db.Integer, nullable=False)
    unit_cost = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)

    # Snapshot del producto al momento de la orden
    product_name = db.Column(db.String(200), nullable=False)
    product_sku = db.Column(db.String(50), nullable=False)

    # US-SUPP-008: Recepción de mercancía
    quantity_received = db.Column(db.Integer, nullable=True)
    # CA-4: Razón de discrepancia (Faltante, Sobrante, Daño) cuando quantity_received != quantity_ordered
    discrepancy_reason = db.Column(db.String(50), nullable=True)
    discrepancy_notes = db.Column(db.Text, nullable=True)

    # Relaciones
    product = db.relationship('Product', backref=db.backref('purchase_order_items', lazy='dynamic'))

    def __repr__(self):
        return f'<PurchaseOrderItem {self.product_name} x{self.quantity_ordered}>'

    def to_dict(self):
        """Convertir item a diccionario"""
        return {
            'id': self.id,
            'purchase_order_id': self.purchase_order_id,
            'product_id': self.product_id,
            'quantity_ordered': self.quantity_ordered,
            'unit_cost': float(self.unit_cost) if self.unit_cost else 0.0,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'product_name': self.product_name,
            'product_sku': self.product_sku,
            'quantity_received': self.quantity_received,
            'discrepancy_reason': self.discrepancy_reason,
            'discrepancy_notes': self.discrepancy_notes,
        }


class PurchaseOrderStatusHistory(db.Model):
    """Modelo de Historial de Estado de Orden de Compra (US-SUPP-007)"""

    __tablename__ = 'purchase_order_status_history'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    purchase_order_id = db.Column(db.String(36), db.ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False)
    changed_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # Datos
    previous_status = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), nullable=False)
    notes = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    changed_by = db.relationship('User', foreign_keys=[changed_by_id])

    def __repr__(self):
        return f'<PurchaseOrderStatusHistory {self.status}>'

    def to_dict(self):
        """Convertir historial a diccionario"""
        return {
            'id': self.id,
            'purchase_order_id': self.purchase_order_id,
            'previous_status': self.previous_status,
            'status': self.status,
            'changed_by_id': self.changed_by_id,
            'changed_by_name': self.changed_by.full_name if self.changed_by else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PurchaseOrderEditAudit(db.Model):
    """Modelo de Auditoría de Edición de Orden de Compra (US-SUPP-010 CA-5)"""

    __tablename__ = 'purchase_order_edit_audits'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    purchase_order_id = db.Column(db.String(36), db.ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False, index=True)
    edited_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # CA-5: Diff de campos y productos modificados
    changes = db.Column(db.JSON, nullable=False)

    # Timestamps
    edited_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    purchase_order = db.relationship('PurchaseOrder', backref=db.backref('edit_audits', lazy='dynamic', cascade='all, delete-orphan'))
    edited_by = db.relationship('User', foreign_keys=[edited_by_id])

    def __repr__(self):
        return f'<PurchaseOrderEditAudit {self.purchase_order_id} by {self.edited_by_id}>'

    def to_dict(self):
        """Convertir auditoría a diccionario"""
        return {
            'id': self.id,
            'purchase_order_id': self.purchase_order_id,
            'edited_by_id': self.edited_by_id,
            'edited_by_name': self.edited_by.full_name if self.edited_by else None,
            'changes': self.changes,
            'edited_at': self.edited_at.isoformat() if self.edited_at else None,
        }
