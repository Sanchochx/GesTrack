"""Esquemas de validación para Notas de Cliente
US-CUST-009: Notas del Cliente
"""
from marshmallow import Schema, fields, validates, ValidationError


class CustomerNoteCreateSchema(Schema):
    """Schema para crear una nota de cliente"""
    content = fields.Str(required=True, error_messages={'required': 'El contenido de la nota es requerido'})
    is_important = fields.Bool(required=False, load_default=False)

    @validates('content')
    def validate_content(self, value):
        if not value or not value.strip():
            raise ValidationError('El contenido de la nota no puede estar vacío')
        if len(value) > 500:
            raise ValidationError('La nota no puede exceder 500 caracteres')


class CustomerNoteUpdateSchema(Schema):
    """Schema para actualizar una nota de cliente (todos los campos opcionales)"""
    content = fields.Str(required=False)
    is_important = fields.Bool(required=False)

    @validates('content')
    def validate_content(self, value):
        if value is not None:
            if not value.strip():
                raise ValidationError('El contenido de la nota no puede estar vacío')
            if len(value) > 500:
                raise ValidationError('La nota no puede exceder 500 caracteres')


customer_note_create_schema = CustomerNoteCreateSchema()
customer_note_update_schema = CustomerNoteUpdateSchema()
