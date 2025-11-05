"""
Modelo de Producto
(Implementación básica - se completará en US-PROD-001)
"""
from app import db
from datetime import datetime
import uuid


class Product(db.Model):
    """Modelo de Producto"""

    __tablename__ = 'products'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Campos básicos
    sku = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Precios
    cost_price = db.Column(db.Numeric(10, 2), nullable=False)
    sale_price = db.Column(db.Numeric(10, 2), nullable=False)

    # Stock
    stock_quantity = db.Column(db.Integer, nullable=False, default=0)
    min_stock_level = db.Column(db.Integer, nullable=False, default=10)
    reorder_point = db.Column(db.Integer, nullable=False, default=10)  # US-PROD-008 CA-1: Punto de reorden

    # Foreign Keys
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=False)

    # Opcionales
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)  # US-PROD-006 CA-9: Soft delete

    # Relaciones
    category = db.relationship('Category', back_populates='products')

    def __repr__(self):
        return f'<Product {self.name} ({self.sku})>'

    def to_dict(self):
        """Convertir producto a diccionario"""
        return {
            'id': self.id,
            'sku': self.sku,
            'name': self.name,
            'description': self.description,
            'cost_price': float(self.cost_price) if self.cost_price else 0.0,
            'sale_price': float(self.sale_price) if self.sale_price else 0.0,
            'stock_quantity': self.stock_quantity,
            'min_stock_level': self.min_stock_level,
            'reorder_point': self.reorder_point,  # US-PROD-008 CA-1
            'category_id': self.category_id,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None
        }

    @staticmethod
    def validate_sku_unique(sku, exclude_id=None):
        """
        CA-2: Validar que el SKU sea único

        Args:
            sku: SKU a validar
            exclude_id: ID de producto a excluir (para actualizaciones)

        Returns:
            bool: True si el SKU es único, False si ya existe
        """
        query = Product.query.filter(Product.sku == sku)

        if exclude_id:
            query = query.filter(Product.id != exclude_id)

        return query.first() is None

    def calculate_profit_margin(self):
        """
        CA-4: Calcular margen de ganancia

        Returns:
            float: Margen de ganancia en porcentaje
        """
        if self.cost_price and self.sale_price and self.cost_price > 0:
            margin = ((self.sale_price - self.cost_price) / self.cost_price) * 100
            return float(round(margin, 2))
        return 0.0

    def is_low_stock(self):
        """
        US-PROD-008 CA-2: Verificar si el producto tiene stock bajo

        Un producto tiene stock bajo cuando:
        stock_actual <= punto_de_reorden AND stock_actual > 0

        Returns:
            bool: True si el stock está bajo, False en caso contrario
        """
        return self.stock_quantity <= self.reorder_point and self.stock_quantity > 0

    def is_out_of_stock(self):
        """
        US-PROD-008 CA-2: Verificar si el producto no tiene stock

        Returns:
            bool: True si no hay stock, False en caso contrario
        """
        return self.stock_quantity == 0

    def get_stock_status(self):
        """
        US-PROD-008 CA-2: Obtener el estado del stock del producto

        Returns:
            str: 'out_of_stock', 'low_stock', o 'normal'
        """
        if self.is_out_of_stock():
            return 'out_of_stock'
        elif self.is_low_stock():
            return 'low_stock'
        else:
            return 'normal'
