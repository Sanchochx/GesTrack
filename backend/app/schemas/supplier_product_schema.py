"""
Esquemas de validación para Producto-Proveedor
US-SUPP-014: Productos por Proveedor
"""
from marshmallow import Schema, fields, validates, ValidationError


class SupplierProductLinkSchema(Schema):
    """Schema para vincular/actualizar un producto a un proveedor"""

    product_id = fields.Str(required=True, error_messages={
        'required': 'El producto es requerido'
    })
    preferential_price = fields.Decimal(required=False, allow_none=True, places=2, load_default=None)
    is_preferred = fields.Bool(required=False, load_default=False)

    @validates('preferential_price')
    def validate_preferential_price(self, value):
        if value is not None and value < 0:
            raise ValidationError('El precio preferencial no puede ser negativo')


class SupplierProductUpdateSchema(Schema):
    """Schema para actualizar el vínculo producto-proveedor (sin cambiar el producto)"""

    preferential_price = fields.Decimal(required=False, allow_none=True, places=2, load_default=None)
    is_preferred = fields.Bool(required=False, load_default=False)

    @validates('preferential_price')
    def validate_preferential_price(self, value):
        if value is not None and value < 0:
            raise ValidationError('El precio preferencial no puede ser negativo')


supplier_product_link_schema = SupplierProductLinkSchema()
supplier_product_update_schema = SupplierProductUpdateSchema()
