"""
Modelo de Alerta de Inventario
US-INV-004 CA-7: Sistema de alertas de punto de reorden
"""
from app import db
from datetime import datetime
import uuid


class InventoryAlert(db.Model):
    """
    Modelo para gestionar alertas de inventario

    Tipos de alertas:
    - reorder_point: Stock alcanzó el punto de reorden
    - critical_stock: Stock crítico (implementación futura)
    - out_of_stock: Sin stock (implementación futura)
    """

    __tablename__ = 'inventory_alerts'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False, index=True)

    # Información de la alerta
    alert_type = db.Column(db.String(50), nullable=False, index=True)
    current_stock = db.Column(db.Integer, nullable=False)
    reorder_point = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Relaciones
    product = db.relationship('Product', backref='inventory_alerts')

    def __repr__(self):
        return f'<InventoryAlert {self.alert_type} for product_id={self.product_id}>'

    def to_dict(self):
        """Convertir alerta a diccionario"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_sku': self.product.sku if self.product else None,
            'alert_type': self.alert_type,
            'current_stock': self.current_stock,
            'reorder_point': self.reorder_point,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
        }

    @staticmethod
    def get_active_alerts():
        """Obtener todas las alertas activas"""
        return InventoryAlert.query.filter_by(is_active=True).all()

    @staticmethod
    def get_active_alerts_for_product(product_id):
        """Obtener alertas activas para un producto específico"""
        return InventoryAlert.query.filter_by(
            product_id=product_id,
            is_active=True
        ).all()

    @staticmethod
    def resolve_alerts_for_product(product_id, alert_type='reorder_point'):
        """Resolver alertas de un producto"""
        alerts = InventoryAlert.query.filter_by(
            product_id=product_id,
            alert_type=alert_type,
            is_active=True
        ).all()

        for alert in alerts:
            alert.is_active = False
            alert.resolved_at = datetime.utcnow()

        db.session.commit()
        return len(alerts)
