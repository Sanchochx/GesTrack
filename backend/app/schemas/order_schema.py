"""
Esquemas de validación para Pedido
US-ORD-001: Crear Pedido
"""
from marshmallow import Schema, fields, validates, validates_schema, ValidationError


class OrderItemCreateSchema(Schema):
    """Schema para un item del pedido"""

    product_id = fields.Str(required=True, error_messages={
        'required': 'El producto es requerido'
    })
    quantity = fields.Int(required=True, error_messages={
        'required': 'La cantidad es requerida'
    })
    unit_price = fields.Decimal(required=True, places=2, error_messages={
        'required': 'El precio unitario es requerido'
    })

    @validates('quantity')
    def validate_quantity(self, value):
        if value is None or value < 1:
            raise ValidationError('La cantidad debe ser al menos 1')

    @validates('unit_price')
    def validate_unit_price(self, value):
        if value is None or value <= 0:
            raise ValidationError('El precio unitario debe ser mayor a 0')


class OrderCreateSchema(Schema):
    """Schema para crear un pedido"""

    customer_id = fields.Str(required=True, error_messages={
        'required': 'El cliente es requerido'
    })
    items = fields.List(
        fields.Nested(OrderItemCreateSchema),
        required=True,
        error_messages={'required': 'Los items son requeridos'}
    )
    tax_percentage = fields.Decimal(places=2, load_default=0)
    shipping_cost = fields.Decimal(places=2, load_default=0)
    discount_amount = fields.Decimal(places=2, load_default=0)
    discount_justification = fields.Str(required=False, allow_none=True, load_default=None)
    notes = fields.Str(required=False, allow_none=True, load_default=None)

    @validates('items')
    def validate_items(self, value):
        if not value or len(value) < 1:
            raise ValidationError('El pedido debe tener al menos un producto')

    @validates('tax_percentage')
    def validate_tax_percentage(self, value):
        if value is not None and value < 0:
            raise ValidationError('El porcentaje de impuesto no puede ser negativo')

    @validates('shipping_cost')
    def validate_shipping_cost(self, value):
        if value is not None and value < 0:
            raise ValidationError('El costo de envío no puede ser negativo')

    @validates('discount_amount')
    def validate_discount_amount(self, value):
        if value is not None and value < 0:
            raise ValidationError('El descuento no puede ser negativo')

    @validates('notes')
    def validate_notes(self, value):
        if value and len(value) > 500:
            raise ValidationError('Las notas no pueden exceder 500 caracteres')

    @validates_schema
    def validate_discount_justification(self, data, **kwargs):
        """CA-7: Descuento >20% requiere justificación"""
        items = data.get('items', [])
        discount = float(data.get('discount_amount', 0) or 0)

        if discount > 0 and items:
            subtotal = sum(
                float(item.get('quantity', 0)) * float(item.get('unit_price', 0))
                for item in items
            )
            if subtotal > 0:
                discount_pct = (discount / subtotal) * 100
                if discount_pct > 20:
                    justification = data.get('discount_justification')
                    if not justification or not justification.strip():
                        raise ValidationError(
                            'Se requiere justificación para descuentos mayores al 20%',
                            field_name='discount_justification'
                        )


class OrderResponseSchema(Schema):
    """Schema para respuestas de pedido"""

    id = fields.Str()
    order_number = fields.Str()
    customer_id = fields.Str()
    status = fields.Str()
    payment_status = fields.Str()
    subtotal = fields.Decimal(places=2, as_string=True)
    tax_percentage = fields.Decimal(places=2, as_string=True)
    tax_amount = fields.Decimal(places=2, as_string=True)
    shipping_cost = fields.Decimal(places=2, as_string=True)
    discount_amount = fields.Decimal(places=2, as_string=True)
    total = fields.Decimal(places=2, as_string=True)
    notes = fields.Str(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


# Instancias de esquemas para uso en rutas
order_create_schema = OrderCreateSchema()
order_response_schema = OrderResponseSchema()
