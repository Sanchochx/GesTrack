"""
Esquemas de validación para Pedido
US-ORD-001: Crear Pedido
"""
from marshmallow import Schema, fields, validates, validates_schema, ValidationError
from decimal import Decimal
from app.utils.constants import DISCOUNT_REASONS, DISCOUNT_AUTHORIZATION_THRESHOLD

DISCOUNT_TYPES = ('percentage', 'fixed')


def _validate_discount_fields(data):
    """
    US-ORD-014: Validaciones compartidas de descuento para creación/edición de pedidos.
    CA-1/CA-2/CA-3: tipo y rango del valor. CA-6: motivo requerido. CA-11: no exceder subtotal.
    """
    items = data.get('items', [])
    discount_value = data.get('discount_value')
    discount_value = Decimal(str(discount_value)) if discount_value is not None else Decimal('0')

    if discount_value <= 0:
        return

    discount_type = data.get('discount_type')
    if discount_type not in DISCOUNT_TYPES:
        raise ValidationError(
            'Debe indicar el tipo de descuento (percentage o fixed)',
            field_name='discount_type'
        )

    if discount_type == 'percentage':
        if discount_value > 100:
            raise ValidationError('El porcentaje de descuento no puede exceder 100', field_name='discount_value')
    else:
        subtotal = sum(
            Decimal(str(item.get('quantity', 0))) * Decimal(str(item.get('unit_price', 0)))
            for item in items
        )
        if subtotal > 0 and discount_value > subtotal:
            raise ValidationError(
                'El descuento no puede ser mayor al subtotal',
                field_name='discount_value'
            )

    # CA-6: Motivo del descuento requerido
    reason = data.get('discount_reason')
    if not reason:
        raise ValidationError('El motivo del descuento es requerido', field_name='discount_reason')
    if reason not in DISCOUNT_REASONS:
        raise ValidationError('Motivo de descuento inválido', field_name='discount_reason')
    if reason == 'Otro':
        detail = data.get('discount_reason_detail')
        if not detail or not detail.strip():
            raise ValidationError(
                'Debe especificar el motivo del descuento',
                field_name='discount_reason_detail'
            )
        if len(detail) > 200:
            raise ValidationError(
                'El motivo no puede exceder 200 caracteres',
                field_name='discount_reason_detail'
            )


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
    # US-ORD-014: Descuento a nivel de pedido (reemplaza el antiguo discount_amount de entrada)
    discount_type = fields.Str(required=False, allow_none=True, load_default=None)
    discount_value = fields.Decimal(places=2, load_default=0)
    discount_reason = fields.Str(required=False, allow_none=True, load_default=None)
    discount_reason_detail = fields.Str(required=False, allow_none=True, load_default=None)
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

    @validates('discount_value')
    def validate_discount_value(self, value):
        if value is not None and value < 0:
            raise ValidationError('El descuento no puede ser negativo')

    @validates('notes')
    def validate_notes(self, value):
        if value and len(value) > 500:
            raise ValidationError('Las notas no pueden exceder 500 caracteres')

    @validates_schema
    def validate_discount(self, data, **kwargs):
        _validate_discount_fields(data)


class OrderUpdateSchema(Schema):
    """
    US-ORD-008: Schema para editar un pedido existente.

    CA-3: customer_id opcional (cambio de cliente)
    CA-4/CA-5/CA-6: items representa el estado final deseado del pedido
    CA-7: price_justification requerido si algún precio cambia >10%
    CA-10: expected_updated_at para bloqueo optimista, edit_reason opcional
    """

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
    # US-ORD-014: Descuento a nivel de pedido
    discount_type = fields.Str(required=False, allow_none=True, load_default=None)
    discount_value = fields.Decimal(places=2, load_default=0)
    discount_reason = fields.Str(required=False, allow_none=True, load_default=None)
    discount_reason_detail = fields.Str(required=False, allow_none=True, load_default=None)
    price_justification = fields.Str(required=False, allow_none=True, load_default=None)
    notes = fields.Str(required=False, allow_none=True, load_default=None)
    edit_reason = fields.Str(required=False, allow_none=True, load_default=None)
    expected_updated_at = fields.Str(required=False, allow_none=True, load_default=None)

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

    @validates('discount_value')
    def validate_discount_value(self, value):
        if value is not None and value < 0:
            raise ValidationError('El descuento no puede ser negativo')

    @validates('notes')
    def validate_notes(self, value):
        if value and len(value) > 500:
            raise ValidationError('Las notas no pueden exceder 500 caracteres')

    @validates_schema
    def validate_discount(self, data, **kwargs):
        """CA-10: Si se modifica el descuento, se requiere motivo (igual que en creación)"""
        _validate_discount_fields(data)


CANCELLATION_REASONS = [
    'Cliente solicitó cancelación',
    'Producto no disponible',
    'Error en el pedido',
    'Duplicado',
    'Cliente no contactable',
    'Otro',
]


class OrderCancelSchema(Schema):
    """
    US-ORD-009 CA-3: Schema para cancelar un pedido.

    Si cancellation_reason es "Otro", cancellation_reason_detail es requerido (max 200 chars).
    """

    cancellation_reason = fields.Str(required=True, error_messages={
        'required': 'El motivo de cancelación es requerido'
    })
    cancellation_reason_detail = fields.Str(required=False, allow_none=True, load_default=None)

    @validates('cancellation_reason')
    def validate_cancellation_reason(self, value):
        if value not in CANCELLATION_REASONS:
            raise ValidationError('Motivo de cancelación inválido')

    @validates_schema
    def validate_other_reason(self, data, **kwargs):
        if data.get('cancellation_reason') == 'Otro':
            detail = data.get('cancellation_reason_detail')
            if not detail or not detail.strip():
                raise ValidationError(
                    'Debe especificar el motivo de cancelación',
                    field_name='cancellation_reason_detail'
                )
            if len(detail) > 200:
                raise ValidationError(
                    'El motivo no puede exceder 200 caracteres',
                    field_name='cancellation_reason_detail'
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
    discount_type = fields.Str(allow_none=True)
    discount_value = fields.Decimal(places=2, as_string=True, allow_none=True)
    discount_reason = fields.Str(allow_none=True)
    discount_authorized_by_id = fields.Str(allow_none=True)
    total = fields.Decimal(places=2, as_string=True)
    notes = fields.Str(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


# Instancias de esquemas para uso en rutas
order_create_schema = OrderCreateSchema()
order_update_schema = OrderUpdateSchema()
order_cancel_schema = OrderCancelSchema()
order_response_schema = OrderResponseSchema()
