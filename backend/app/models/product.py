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

    # Foreign Keys
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=False)

    # Opcionales
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    category = db.relationship('Category', back_populates='products')

    def __repr__(self):
        return f'<Product {self.name} ({self.sku})>'
