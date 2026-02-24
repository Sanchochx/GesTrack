"""
Schemas de validación para Pagos de Pedidos
US-ORD-004: Estado de Pago del Pedido
"""
from marshmallow import Schema, fields, validate
from datetime import date
from decimal import Decimal


class PaymentCreateSchema(Schema):
    """Schema para crear un pago"""

    # CA-7: Monto positivo, mayor que 0.01
    amount = fields.Decimal(
        required=True,
        places=2,
        validate=validate.Range(min=Decimal('0.01'), error='El monto debe ser mayor a $0'),
    )

    # CA-2: Método de pago (dropdown)
    payment_method = fields.String(
        required=True,
        validate=validate.OneOf(
            ['Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'Transferencia', 'Otro'],
            error='Método de pago inválido. Opciones: Efectivo, Tarjeta Débito, Tarjeta Crédito, Transferencia, Otro',
        ),
    )

    # CA-2: Fecha del pago (por defecto hoy)
    payment_date = fields.Date(load_default=None)

    # CA-2: Notas opcionales (max 200 caracteres)
    notes = fields.String(
        validate=validate.Length(max=200, error='Las notas no pueden superar 200 caracteres'),
        load_default=None,
        allow_none=True,
    )


payment_create_schema = PaymentCreateSchema()
