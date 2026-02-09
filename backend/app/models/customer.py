"""
Modelo de Cliente
US-CUST-001: Registrar Nuevo Cliente
"""
from app import db
from datetime import datetime
import uuid


class Customer(db.Model):
    """Modelo de Cliente"""

    __tablename__ = 'customers'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # CA-2: Información Personal
    full_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    secondary_phone = db.Column(db.String(20), nullable=True)

    # CA-3: Dirección Completa
    address_street = db.Column(db.String(300), nullable=False)
    address_city = db.Column(db.String(100), nullable=False)
    address_postal_code = db.Column(db.String(20), nullable=False)
    address_country = db.Column(db.String(100), nullable=False, default='México')

    # CA-4: Información Adicional
    notes = db.Column(db.Text, nullable=True)

    # CA-7: Estado Inicial
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # CA-6: Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Customer {self.full_name} ({self.email})>'

    def to_dict(self):
        """Convertir cliente a diccionario"""
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'secondary_phone': self.secondary_phone,
            'address_street': self.address_street,
            'address_city': self.address_city,
            'address_postal_code': self.address_postal_code,
            'address_country': self.address_country,
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Placeholder purchase fields (will be computed from Orders in Epic 04)
            'total_purchases': 0.0,
            'last_purchase_date': None,
            'order_count': 0,
            'customer_category': 'Regular',
        }

    @staticmethod
    def validate_email_unique(email, exclude_id=None):
        """
        CA-5: Validar que el email sea único

        Args:
            email: Email a validar
            exclude_id: ID de cliente a excluir (para actualizaciones)

        Returns:
            bool: True si el email es único, False si ya existe
        """
        query = Customer.query.filter(db.func.lower(Customer.email) == email.lower())

        if exclude_id:
            query = query.filter(Customer.id != exclude_id)

        return query.first() is None
