"""
Esquemas de validación para Cliente
US-CUST-001: Registrar Nuevo Cliente
"""
from marshmallow import Schema, fields, validates, ValidationError
import re


class CustomerCreateSchema(Schema):
    """Schema para crear un cliente nuevo"""

    # CA-2: Información Personal
    full_name = fields.Str(required=True, error_messages={
        'required': 'El nombre completo es requerido'
    })
    email = fields.Email(required=True, error_messages={
        'required': 'El email es requerido',
        'invalid': 'Formato de email inválido'
    })
    phone = fields.Str(required=True, error_messages={
        'required': 'El teléfono es requerido'
    })
    secondary_phone = fields.Str(required=False, allow_none=True, load_default=None)

    # CA-3: Dirección Completa
    address_street = fields.Str(required=True, error_messages={
        'required': 'La dirección es requerida'
    })
    address_city = fields.Str(required=True, error_messages={
        'required': 'La ciudad es requerida'
    })
    address_postal_code = fields.Str(required=True, error_messages={
        'required': 'El código postal es requerido'
    })
    address_country = fields.Str(required=False, load_default='México')

    # CA-4: Información Adicional
    notes = fields.Str(required=False, allow_none=True, load_default=None)

    @validates('full_name')
    def validate_full_name(self, value):
        """CA-2: Validar nombre completo"""
        if not value or not value.strip():
            raise ValidationError('El nombre completo no puede estar vacío')
        if len(value) > 200:
            raise ValidationError('El nombre no puede exceder 200 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.\-]+$', value.strip()):
            raise ValidationError('El nombre solo puede contener letras y espacios')

    @validates('email')
    def validate_email(self, value):
        """CA-2: Validar formato de email"""
        if not value or not value.strip():
            raise ValidationError('El email no puede estar vacío')
        if len(value) > 100:
            raise ValidationError('El email no puede exceder 100 caracteres')

    @validates('phone')
    def validate_phone(self, value):
        """CA-2: Validar teléfono principal"""
        if not value or not value.strip():
            raise ValidationError('El teléfono no puede estar vacío')
        if len(value) > 20:
            raise ValidationError('El teléfono no puede exceder 20 caracteres')
        if not re.match(r'^[\d\s\-\(\)\+]+$', value.strip()):
            raise ValidationError('El teléfono solo puede contener números, guiones, paréntesis y espacios')

    @validates('secondary_phone')
    def validate_secondary_phone(self, value):
        """CA-2: Validar teléfono secundario (opcional)"""
        if value and value.strip():
            if len(value) > 20:
                raise ValidationError('El teléfono secundario no puede exceder 20 caracteres')
            if not re.match(r'^[\d\s\-\(\)\+]+$', value.strip()):
                raise ValidationError('El teléfono solo puede contener números, guiones, paréntesis y espacios')

    @validates('address_street')
    def validate_address_street(self, value):
        """CA-3: Validar dirección"""
        if not value or not value.strip():
            raise ValidationError('La dirección no puede estar vacía')
        if len(value) > 300:
            raise ValidationError('La dirección no puede exceder 300 caracteres')

    @validates('address_city')
    def validate_address_city(self, value):
        """CA-3: Validar ciudad"""
        if not value or not value.strip():
            raise ValidationError('La ciudad no puede estar vacía')
        if len(value) > 100:
            raise ValidationError('La ciudad no puede exceder 100 caracteres')

    @validates('address_postal_code')
    def validate_address_postal_code(self, value):
        """CA-3: Validar código postal"""
        if not value or not value.strip():
            raise ValidationError('El código postal no puede estar vacío')
        if len(value) > 20:
            raise ValidationError('El código postal no puede exceder 20 caracteres')
        if not re.match(r'^[\d\-\s]+$', value.strip()):
            raise ValidationError('El código postal solo puede contener números y guiones')

    @validates('address_country')
    def validate_address_country(self, value):
        """CA-3: Validar país"""
        if value and len(value) > 100:
            raise ValidationError('El país no puede exceder 100 caracteres')

    @validates('notes')
    def validate_notes(self, value):
        """CA-4: Validar notas"""
        if value and len(value) > 500:
            raise ValidationError('Las notas no pueden exceder 500 caracteres')


class CustomerUpdateSchema(Schema):
    """Schema para actualizar un cliente existente"""

    class Meta:
        unknown = 'exclude'

    full_name = fields.Str(required=False)
    email = fields.Email(required=False)
    phone = fields.Str(required=False)
    secondary_phone = fields.Str(required=False, allow_none=True)
    address_street = fields.Str(required=False)
    address_city = fields.Str(required=False)
    address_postal_code = fields.Str(required=False)
    address_country = fields.Str(required=False)
    notes = fields.Str(required=False, allow_none=True)
    is_active = fields.Bool(required=False)

    @validates('full_name')
    def validate_full_name(self, value):
        if value is not None:
            if not value.strip():
                raise ValidationError('El nombre completo no puede estar vacío')
            if len(value) > 200:
                raise ValidationError('El nombre no puede exceder 200 caracteres')
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.\-]+$', value.strip()):
                raise ValidationError('El nombre solo puede contener letras y espacios')

    @validates('email')
    def validate_email(self, value):
        if value is not None:
            if not value.strip():
                raise ValidationError('El email no puede estar vacío')
            if len(value) > 100:
                raise ValidationError('El email no puede exceder 100 caracteres')

    @validates('phone')
    def validate_phone(self, value):
        if value is not None:
            if not value.strip():
                raise ValidationError('El teléfono no puede estar vacío')
            if len(value) > 20:
                raise ValidationError('El teléfono no puede exceder 20 caracteres')
            if not re.match(r'^[\d\s\-\(\)\+]+$', value.strip()):
                raise ValidationError('El teléfono solo puede contener números, guiones, paréntesis y espacios')

    @validates('secondary_phone')
    def validate_secondary_phone(self, value):
        if value and value.strip():
            if len(value) > 20:
                raise ValidationError('El teléfono secundario no puede exceder 20 caracteres')
            if not re.match(r'^[\d\s\-\(\)\+]+$', value.strip()):
                raise ValidationError('El teléfono solo puede contener números, guiones, paréntesis y espacios')

    @validates('address_street')
    def validate_address_street(self, value):
        if value is not None:
            if not value.strip():
                raise ValidationError('La dirección no puede estar vacía')
            if len(value) > 300:
                raise ValidationError('La dirección no puede exceder 300 caracteres')

    @validates('address_city')
    def validate_address_city(self, value):
        if value is not None:
            if not value.strip():
                raise ValidationError('La ciudad no puede estar vacía')
            if len(value) > 100:
                raise ValidationError('La ciudad no puede exceder 100 caracteres')

    @validates('address_postal_code')
    def validate_address_postal_code(self, value):
        if value is not None:
            if not value.strip():
                raise ValidationError('El código postal no puede estar vacío')
            if len(value) > 20:
                raise ValidationError('El código postal no puede exceder 20 caracteres')

    @validates('notes')
    def validate_notes(self, value):
        if value and len(value) > 500:
            raise ValidationError('Las notas no pueden exceder 500 caracteres')


class CustomerResponseSchema(Schema):
    """Schema para respuestas de cliente"""

    id = fields.Str()
    full_name = fields.Str()
    email = fields.Str()
    phone = fields.Str()
    secondary_phone = fields.Str(allow_none=True)
    address_street = fields.Str()
    address_city = fields.Str()
    address_postal_code = fields.Str()
    address_country = fields.Str()
    notes = fields.Str(allow_none=True)
    is_active = fields.Bool()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


# Instancias de esquemas para uso en rutas
customer_create_schema = CustomerCreateSchema()
customer_update_schema = CustomerUpdateSchema()
customer_response_schema = CustomerResponseSchema()
customers_response_schema = CustomerResponseSchema(many=True)
