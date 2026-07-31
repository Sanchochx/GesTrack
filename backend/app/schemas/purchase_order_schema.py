"""
Esquemas de validación para Orden de Compra
US-SUPP-005: Crear Orden de Compra
US-SUPP-008: Recibir Mercancía (Actualizar Inventario)
US-SUPP-010: Editar Orden de Compra
"""
from marshmallow import Schema, fields, validates, validates_schema, ValidationError
from datetime import date


class PurchaseOrderItemCreateSchema(Schema):
    """Schema para un item de la orden de compra"""

    product_id = fields.Str(required=True, error_messages={
        'required': 'El producto es requerido'
    })
    quantity_ordered = fields.Int(required=True, error_messages={
        'required': 'La cantidad solicitada es requerida'
    })
    unit_cost = fields.Decimal(required=True, places=2, error_messages={
        'required': 'El precio de compra es requerido'
    })

    @validates('quantity_ordered')
    def validate_quantity_ordered(self, value):
        if value is None or value < 1:
            raise ValidationError('La cantidad solicitada debe ser al menos 1')

    @validates('unit_cost')
    def validate_unit_cost(self, value):
        if value is None or value <= 0:
            raise ValidationError('El precio de compra debe ser mayor a 0')


class PurchaseOrderCreateSchema(Schema):
    """Schema para crear una orden de compra"""

    supplier_id = fields.Str(required=True, error_messages={
        'required': 'El proveedor es requerido'
    })
    items = fields.List(
        fields.Nested(PurchaseOrderItemCreateSchema),
        required=True,
        error_messages={'required': 'Los items son requeridos'}
    )
    shipping_cost = fields.Decimal(places=2, load_default=0)
    expected_delivery_date = fields.Date(required=False, allow_none=True, load_default=None)

    @validates('items')
    def validate_items(self, value):
        if not value or len(value) < 1:
            raise ValidationError('La orden debe tener al menos un producto')

    @validates('shipping_cost')
    def validate_shipping_cost(self, value):
        if value is not None and value < 0:
            raise ValidationError('El costo de envío no puede ser negativo')

    @validates_schema
    def validate_expected_delivery_date(self, data, **kwargs):
        expected_date = data.get('expected_delivery_date')
        if expected_date and expected_date < date.today():
            raise ValidationError(
                'La fecha estimada de entrega no puede ser anterior a hoy',
                field_name='expected_delivery_date'
            )


DISCREPANCY_REASONS = ['Faltante', 'Sobrante', 'Daño']


class PurchaseOrderReceiveItemSchema(Schema):
    """US-SUPP-008 CA-3/CA-4: Schema para la recepción de un item de la orden"""

    item_id = fields.Str(required=True, error_messages={
        'required': 'El item de la orden es requerido'
    })
    quantity_received = fields.Int(required=True, error_messages={
        'required': 'La cantidad recibida es requerida'
    })
    discrepancy_reason = fields.Str(required=False, allow_none=True, load_default=None)
    discrepancy_notes = fields.Str(required=False, allow_none=True, load_default=None)

    @validates('quantity_received')
    def validate_quantity_received(self, value):
        if value is None or value < 0:
            raise ValidationError('La cantidad recibida no puede ser negativa')

    @validates('discrepancy_reason')
    def validate_discrepancy_reason(self, value):
        if value and value not in DISCREPANCY_REASONS:
            raise ValidationError(f'Razón inválida. Valores permitidos: {", ".join(DISCREPANCY_REASONS)}')


class PurchaseOrderReceiveSchema(Schema):
    """US-SUPP-008: Schema para registrar la recepción de mercancía"""

    items = fields.List(
        fields.Nested(PurchaseOrderReceiveItemSchema),
        required=True,
        error_messages={'required': 'Los items recibidos son requeridos'}
    )

    @validates('items')
    def validate_items(self, value):
        if not value or len(value) < 1:
            raise ValidationError('Debe reportar la recepción de al menos un item')


class PurchaseOrderUpdateSchema(Schema):
    """US-SUPP-010: Schema para editar una orden de compra existente"""

    supplier_id = fields.Str(required=True, error_messages={
        'required': 'El proveedor es requerido'
    })
    items = fields.List(
        fields.Nested(PurchaseOrderItemCreateSchema),
        required=True,
        error_messages={'required': 'Los items son requeridos'}
    )
    shipping_cost = fields.Decimal(places=2, load_default=0)
    expected_delivery_date = fields.Date(required=False, allow_none=True, load_default=None)

    @validates('items')
    def validate_items(self, value):
        if not value or len(value) < 1:
            raise ValidationError('La orden debe tener al menos un producto')

    @validates('shipping_cost')
    def validate_shipping_cost(self, value):
        if value is not None and value < 0:
            raise ValidationError('El costo de envío no puede ser negativo')

    @validates_schema
    def validate_expected_delivery_date(self, data, **kwargs):
        expected_date = data.get('expected_delivery_date')
        if expected_date and expected_date < date.today():
            raise ValidationError(
                'La fecha estimada de entrega no puede ser anterior a hoy',
                field_name='expected_delivery_date'
            )


class PurchaseOrderCancelSchema(Schema):
    """US-SUPP-011: Schema para cancelar una orden de compra"""

    reason = fields.Str(required=True, error_messages={
        'required': 'El motivo de cancelación es requerido'
    })

    @validates('reason')
    def validate_reason(self, value):
        if not value or not value.strip():
            raise ValidationError('El motivo de cancelación es requerido')
        if len(value.strip()) > 500:
            raise ValidationError('El motivo de cancelación no puede exceder 500 caracteres')


# Instancias de esquemas para uso en rutas
purchase_order_create_schema = PurchaseOrderCreateSchema()
purchase_order_receive_schema = PurchaseOrderReceiveSchema()
purchase_order_update_schema = PurchaseOrderUpdateSchema()
purchase_order_cancel_schema = PurchaseOrderCancelSchema()
