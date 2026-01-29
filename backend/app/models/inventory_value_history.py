"""
Modelo de Historial de Valor de Inventario

US-INV-005 CA-4: Almacena snapshots del valor del inventario para graficar evolución temporal
"""
from app import db
from datetime import datetime
import uuid


class InventoryValueHistory(db.Model):
    """
    Modelo para almacenar el historial del valor total del inventario

    Se registra automáticamente:
    - Al final de cada día (job programado)
    - Después de cada cambio significativo en stock o precios
    """

    __tablename__ = 'inventory_value_history'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Fecha y hora del snapshot
    snapshot_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Valores calculados
    total_value = db.Column(db.Numeric(12, 2), nullable=False, default=0.0)  # Valor total del inventario
    total_products = db.Column(db.Integer, nullable=False, default=0)  # Número de productos únicos con stock
    total_quantity = db.Column(db.Integer, nullable=False, default=0)  # Cantidad total de unidades

    # Métricas adicionales
    categories_count = db.Column(db.Integer, nullable=False, default=0)  # Número de categorías con stock

    # Metadatos
    trigger_reason = db.Column(db.String(100), nullable=True)  # 'scheduled', 'significant_change', 'manual'

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f'<InventoryValueHistory {self.snapshot_date} - ${self.total_value}>'

    def to_dict(self):
        """Convertir a diccionario"""
        return {
            'id': self.id,
            'snapshot_date': self.snapshot_date.isoformat() if self.snapshot_date else None,
            'total_value': float(self.total_value) if self.total_value else 0.0,
            'total_products': self.total_products,
            'total_quantity': self.total_quantity,
            'categories_count': self.categories_count,
            'trigger_reason': self.trigger_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
