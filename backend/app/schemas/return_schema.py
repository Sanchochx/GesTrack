"""
Schemas de validación para Devoluciones de Pedidos
US-ORD-011: Procesamiento de Devoluciones
"""
from marshmallow import Schema, fields, validate, validates, validates_schema, ValidationError


RETURN_REASONS = [
    'Producto defectuoso/dañado',
    'Producto incorrecto (error en pedido)',
    'Cliente cambió de opinión',
    'Producto no cumple expectativas',
    'Duplicado',
    'Otro',
]

RETURN_STATUSES = ['Pendiente', 'Aprobada', 'Rechazada']

REFUND_METHODS = ['Reembolso', 'Nota de Crédito', 'Intercambio']


class ReturnItemSchema(Schema):
    """CA-3: Item seleccionado para devolución"""

    product_id = fields.Str(required=True, error_messages={
        'required': 'El producto es requerido'
    })
    quantity = fields.Int(required=True, error_messages={
        'required': 'La cantidad a devolver es requerida'
    })
    item_reason = fields.Str(required=False, allow_none=True, load_default=None)

    @validates('quantity')
    def validate_quantity(self, value):
        if value is None or value < 1:
            raise ValidationError('La cantidad a devolver debe ser al menos 1')


class ReturnCreateSchema(Schema):
    """CA-2/CA-3/CA-4: Schema para crear una devolución"""

    items = fields.List(
        fields.Nested(ReturnItemSchema),
        required=True,
        error_messages={'required': 'Debe seleccionar al menos un producto a devolver'}
    )
    reason = fields.Str(required=True, error_messages={
        'required': 'El motivo de la devolución es requerido'
    })
    reason_detail = fields.Str(required=False, allow_none=True, load_default=None)
    notes = fields.Str(required=False, allow_none=True, load_default=None)

    @validates('items')
    def validate_items(self, value):
        if not value or len(value) < 1:
            raise ValidationError('Debe seleccionar al menos un producto a devolver')

    @validates('reason')
    def validate_reason(self, value):
        if value not in RETURN_REASONS:
            raise ValidationError('Motivo de devolución inválido')

    @validates('notes')
    def validate_notes(self, value):
        if value and len(value) > 500:
            raise ValidationError('Las notas no pueden exceder 500 caracteres')

    @validates_schema
    def validate_reason_detail(self, data, **kwargs):
        """CA-4: Si el motivo es 'Otro', se requiere detalle (max 300 caracteres)"""
        if data.get('reason') == 'Otro':
            detail = data.get('reason_detail')
            if not detail or not detail.strip():
                raise ValidationError(
                    'Debe especificar el motivo de la devolución',
                    field_name='reason_detail'
                )
            if len(detail) > 300:
                raise ValidationError(
                    'El motivo no puede exceder 300 caracteres',
                    field_name='reason_detail'
                )


class ReturnStatusUpdateSchema(Schema):
    """CA-8/CA-9: Schema para cambiar el estado de una devolución"""

    status = fields.Str(required=True, error_messages={
        'required': 'El nuevo estado es requerido'
    })
    refund_method = fields.Str(required=False, allow_none=True, load_default=None)
    refund_reference = fields.Str(required=False, allow_none=True, load_default=None)

    @validates('status')
    def validate_status(self, value):
        if value not in ('Aprobada', 'Rechazada'):
            raise ValidationError('Estado inválido. Solo se permite "Aprobada" o "Rechazada"')

    @validates_schema
    def validate_refund_method(self, data, **kwargs):
        """CA-9: Al aprobar, se requiere método de compensación"""
        if data.get('status') == 'Aprobada':
            method = data.get('refund_method')
            if not method or method not in REFUND_METHODS:
                raise ValidationError(
                    'Debe seleccionar un método de compensación válido: '
                    f'{", ".join(REFUND_METHODS)}',
                    field_name='refund_method'
                )


return_create_schema = ReturnCreateSchema()
return_status_update_schema = ReturnStatusUpdateSchema()
