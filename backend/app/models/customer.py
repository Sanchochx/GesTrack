"""
Modelo de Cliente - Facturación Electrónica Colombia (DIAN)
US-CUST-001: Registrar Nuevo Cliente
"""
from app import db
from datetime import datetime
import uuid


class Customer(db.Model):
    """Modelo de Cliente adaptado para facturación electrónica colombiana"""

    __tablename__ = 'customers'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Identificación tributaria (DIAN)
    tipo_documento = db.Column(db.String(10), nullable=False)       # CC, NIT, CE, PAS, TI
    numero_documento = db.Column(db.String(20), nullable=False, unique=True, index=True)
    nombre_razon_social = db.Column(db.String(200), nullable=False)
    tipo_contribuyente = db.Column(db.String(30), nullable=False)   # Persona Natural / Persona Jurídica

    # Información fiscal (opcional)
    regimen_fiscal = db.Column(db.String(20), nullable=True)            # R-99-PN, R-48
    responsabilidad_tributaria = db.Column(db.String(20), nullable=True)  # O-13, O-15, O-23, O-47, R-99-PN, ZZ-No aplica

    # Ubicación
    pais = db.Column(db.String(100), nullable=False, default='Colombia')
    departamento = db.Column(db.String(100), nullable=True)
    municipio_ciudad = db.Column(db.String(100), nullable=True)
    direccion = db.Column(db.String(300), nullable=True)

    # Contacto
    telefono_movil = db.Column(db.String(20), nullable=True)
    correo = db.Column(db.String(100), nullable=False, unique=True, index=True)

    # Información adicional
    notes = db.Column(db.Text, nullable=True)

    # Estado
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Customer {self.nombre_razon_social} ({self.numero_documento})>'

    def to_dict(self):
        """Convertir cliente a diccionario"""
        return {
            'id': self.id,
            'tipo_documento': self.tipo_documento,
            'numero_documento': self.numero_documento,
            'nombre_razon_social': self.nombre_razon_social,
            'tipo_contribuyente': self.tipo_contribuyente,
            'regimen_fiscal': self.regimen_fiscal,
            'responsabilidad_tributaria': self.responsabilidad_tributaria,
            'pais': self.pais,
            'departamento': self.departamento,
            'municipio_ciudad': self.municipio_ciudad,
            'direccion': self.direccion,
            'telefono_movil': self.telefono_movil,
            'correo': self.correo,
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
    def validate_correo_unique(correo, exclude_id=None):
        """
        Validar que el correo sea único

        Args:
            correo: Correo a validar
            exclude_id: ID de cliente a excluir (para actualizaciones)

        Returns:
            bool: True si el correo es único, False si ya existe
        """
        query = Customer.query.filter(db.func.lower(Customer.correo) == correo.lower())
        if exclude_id:
            query = query.filter(Customer.id != exclude_id)
        return query.first() is None

    @staticmethod
    def validate_numero_documento_unique(numero_documento, exclude_id=None):
        """
        Validar que el número de documento sea único

        Args:
            numero_documento: Número de documento a validar
            exclude_id: ID de cliente a excluir (para actualizaciones)

        Returns:
            bool: True si el número es único, False si ya existe
        """
        query = Customer.query.filter(Customer.numero_documento == numero_documento)
        if exclude_id:
            query = query.filter(Customer.id != exclude_id)
        return query.first() is None
