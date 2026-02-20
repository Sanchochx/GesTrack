"""
Modelo de Movimiento de Inventario
Registra todos los cambios en el stock de productos
"""
from app import db
from datetime import datetime
import uuid


class InventoryMovement(db.Model):
    """
    Modelo para registrar movimientos de inventario (CA-6)

    Tipos de movimientos:
    - Stock Inicial: Cuando se crea un producto
    - Entrada: Compra o reposición
    - Salida: Venta o consumo
    - Ajuste: Corrección manual
    - Devolución: Retorno de producto
    """

    __tablename__ = 'inventory_movements'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # Datos del movimiento
    movement_type = db.Column(db.String(50), nullable=False)  # Stock Inicial, Entrada, Salida, Ajuste, Devolución
    quantity = db.Column(db.Integer, nullable=False)  # Cantidad (positivo o negativo)
    previous_stock = db.Column(db.Integer, nullable=False)  # Stock antes del movimiento
    new_stock = db.Column(db.Integer, nullable=False)  # Stock después del movimiento

    # Información adicional
    reason = db.Column(db.String(500), nullable=True)  # Razón del movimiento
    reference = db.Column(db.String(100), nullable=True)  # Referencia (ej: número de factura)
    notes = db.Column(db.Text, nullable=True)  # Notas adicionales

    # US-INV-008 CA-8: Vinculación a pedido (para trazabilidad de reservas)
    related_order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    product = db.relationship('Product', backref=db.backref('inventory_movements', lazy='dynamic'))
    user = db.relationship('User', backref=db.backref('inventory_movements', lazy='dynamic'))

    def __repr__(self):
        return f'<InventoryMovement {self.movement_type} - Product: {self.product_id} - Qty: {self.quantity}>'

    def to_dict(self):
        """Convertir movimiento a diccionario"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'user_id': self.user_id,
            'movement_type': self.movement_type,
            'quantity': self.quantity,
            'previous_stock': self.previous_stock,
            'new_stock': self.new_stock,
            'reason': self.reason,
            'reference': self.reference,
            'notes': self.notes,
            'related_order_id': self.related_order_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @staticmethod
    def create_initial_stock_movement(product, user_id, initial_stock):
        """
        CA-6: Crear movimiento de stock inicial

        Args:
            product: Instancia del producto
            user_id: ID del usuario que crea el producto
            initial_stock: Cantidad inicial de stock

        Returns:
            InventoryMovement: Instancia del movimiento creado
        """
        movement = InventoryMovement(
            product_id=product.id,
            user_id=user_id,
            movement_type='Stock Inicial',
            quantity=initial_stock,
            previous_stock=0,
            new_stock=initial_stock,
            reason='Registro inicial del producto',
            reference=f'PROD-{product.sku}'
        )
        return movement

    @staticmethod
    def create_movement(product, user_id, movement_type, quantity, reason=None, reference=None, notes=None):
        """
        Crear un movimiento de inventario genérico

        Args:
            product: Instancia del producto
            user_id: ID del usuario
            movement_type: Tipo de movimiento
            quantity: Cantidad del movimiento (positivo o negativo)
            reason: Razón del movimiento
            reference: Referencia externa
            notes: Notas adicionales

        Returns:
            InventoryMovement: Instancia del movimiento creado
        """
        previous_stock = product.stock_quantity
        new_stock = previous_stock + quantity

        movement = InventoryMovement(
            product_id=product.id,
            user_id=user_id,
            movement_type=movement_type,
            quantity=quantity,
            previous_stock=previous_stock,
            new_stock=new_stock,
            reason=reason,
            reference=reference,
            notes=notes
        )
        return movement
