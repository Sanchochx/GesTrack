"""
Modelo de Categoría de Productos
Representa las categorías para organizar el catálogo de productos.
"""
from app import db
from datetime import datetime
import uuid


class Category(db.Model):
    """Modelo de Categoría de Productos"""

    __tablename__ = 'categories'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Campos básicos
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)

    # Personalización visual (opcional)
    color = db.Column(db.String(7), nullable=True)  # Hex color: #RRGGBB
    icon = db.Column(db.String(50), nullable=True)  # Nombre del icono

    # Flags de sistema
    is_default = db.Column(db.Boolean, default=False)  # Categoría por defecto no eliminable

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    products = db.relationship('Product', back_populates='category', lazy='dynamic')

    def __repr__(self):
        return f'<Category {self.name}>'

    def to_dict(self, include_product_count=False):
        """Convierte el modelo a diccionario"""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'icon': self.icon,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_product_count:
            data['product_count'] = self.products.count()

        return data

    @staticmethod
    def validate_name_unique(name, exclude_id=None):
        """
        Valida que el nombre de categoría sea único (case-insensitive)

        Args:
            name: Nombre a validar
            exclude_id: ID a excluir de la búsqueda (útil para edición)

        Returns:
            True si es único, False si ya existe
        """
        query = Category.query.filter(db.func.lower(Category.name) == name.lower())

        if exclude_id:
            query = query.filter(Category.id != exclude_id)

        return query.first() is None
