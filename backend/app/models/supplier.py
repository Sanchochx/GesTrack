"""
Modelo de Proveedor
US-SUPP-001: Registrar Proveedor
"""
from app import db
from datetime import datetime
import uuid


# Tabla de asociación: categorías de productos que provee un proveedor
supplier_categories = db.Table(
    'supplier_categories',
    db.Column('supplier_id', db.String(36), db.ForeignKey('suppliers.id'), primary_key=True),
    db.Column('category_id', db.String(36), db.ForeignKey('categories.id'), primary_key=True),
)


class Supplier(db.Model):
    """Modelo de Proveedor"""

    __tablename__ = 'suppliers'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Datos de contacto
    company_name = db.Column(db.String(200), nullable=False, index=True)
    contact_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True, index=True)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=True)
    website = db.Column(db.String(300), nullable=True)

    # Información de pago (opcional)
    payment_bank = db.Column(db.String(100), nullable=True)
    payment_account = db.Column(db.String(50), nullable=True)
    payment_terms = db.Column(db.String(200), nullable=True)

    # Estado
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)

    # Timestamps (registration_date == created_at, capturada automáticamente)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    categories = db.relationship('Category', secondary=supplier_categories, lazy='subquery')

    def __repr__(self):
        return f'<Supplier {self.company_name}>'

    def to_dict(self):
        """Convierte el modelo a diccionario"""
        return {
            'id': self.id,
            'company_name': self.company_name,
            'contact_name': self.contact_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'website': self.website,
            'payment_bank': self.payment_bank,
            'payment_account': self.payment_account,
            'payment_terms': self.payment_terms,
            'categories': [category.to_dict() for category in self.categories],
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def validate_email_unique(email, exclude_id=None):
        """
        Valida que el email sea único (case-insensitive)

        Args:
            email: Email a validar
            exclude_id: ID de proveedor a excluir (para actualizaciones)

        Returns:
            bool: True si el email es único, False si ya existe
        """
        query = Supplier.query.filter(db.func.lower(Supplier.email) == email.lower())
        if exclude_id:
            query = query.filter(Supplier.id != exclude_id)
        return query.first() is None
