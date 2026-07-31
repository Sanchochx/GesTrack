"""
Modelo de Producto-Proveedor
US-SUPP-014: Productos por Proveedor
"""
from app import db
from datetime import datetime
import uuid


class SupplierProduct(db.Model):
    """Vínculo entre un proveedor y un producto que provee"""

    __tablename__ = 'supplier_products'
    __table_args__ = (
        db.UniqueConstraint('supplier_id', 'product_id', name='uq_supplier_products_supplier_product'),
    )

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    supplier_id = db.Column(db.String(36), db.ForeignKey('suppliers.id'), nullable=False, index=True)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False, index=True)

    # CA-3: Precio preferencial acordado con el proveedor para este producto
    preferential_price = db.Column(db.Numeric(10, 2), nullable=True)
    # CA-5: Proveedor preferido para este producto (único por producto)
    is_preferred = db.Column(db.Boolean, nullable=False, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    supplier = db.relationship('Supplier', backref=db.backref('supplier_products', lazy='dynamic', cascade='all, delete-orphan'))
    product = db.relationship('Product', backref=db.backref('supplier_products', lazy='dynamic'))

    def __repr__(self):
        return f'<SupplierProduct supplier={self.supplier_id} product={self.product_id}>'

    def to_dict(self, last_purchase_price=None):
        """Convierte el vínculo a diccionario, con datos del producto incluidos"""
        return {
            'id': self.id,
            'supplier_id': self.supplier_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_sku': self.product.sku if self.product else None,
            'product_cost_price': float(self.product.cost_price) if self.product and self.product.cost_price else None,
            'preferential_price': float(self.preferential_price) if self.preferential_price is not None else None,
            'is_preferred': self.is_preferred,
            'last_purchase_price': last_purchase_price,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
