"""
Esquemas de validación para Proveedor
US-SUPP-001: Registrar Proveedor
"""
from marshmallow import Schema, fields, validates, ValidationError
import re

URL_REGEX = re.compile(
    r'^(https?://)?([\w\-]+\.)+[\w\-]{2,}(/[^\s]*)?$', re.IGNORECASE
)


class SupplierCreateSchema(Schema):
    """Schema para registrar un proveedor nuevo"""

    # Requeridos
    company_name = fields.Str(required=True, error_messages={
        'required': 'El nombre de la empresa es requerido'
    })
    contact_name = fields.Str(required=True, error_messages={
        'required': 'El nombre de contacto es requerido'
    })
    email = fields.Email(required=True, error_messages={
        'required': 'El correo electrónico es requerido',
        'invalid': 'Formato de correo inválido'
    })
    phone = fields.Str(required=True, error_messages={
        'required': 'El teléfono es requerido'
    })

    # Opcionales
    address = fields.Str(required=False, allow_none=True, load_default=None)
    website = fields.Str(required=False, allow_none=True, load_default=None)
    category_ids = fields.List(fields.Str(), required=False, load_default=list)
    payment_bank = fields.Str(required=False, allow_none=True, load_default=None)
    payment_account = fields.Str(required=False, allow_none=True, load_default=None)
    payment_terms = fields.Str(required=False, allow_none=True, load_default=None)

    @validates('company_name')
    def validate_company_name(self, value):
        if not value or not value.strip():
            raise ValidationError('El nombre de la empresa no puede estar vacío')
        if len(value) > 200:
            raise ValidationError('El nombre de la empresa no puede exceder 200 caracteres')

    @validates('contact_name')
    def validate_contact_name(self, value):
        if not value or not value.strip():
            raise ValidationError('El nombre de contacto no puede estar vacío')
        if len(value) > 200:
            raise ValidationError('El nombre de contacto no puede exceder 200 caracteres')

    @validates('email')
    def validate_email(self, value):
        if not value or not value.strip():
            raise ValidationError('El correo no puede estar vacío')
        if len(value) > 120:
            raise ValidationError('El correo no puede exceder 120 caracteres')

    @validates('phone')
    def validate_phone(self, value):
        if not value or not value.strip():
            raise ValidationError('El teléfono no puede estar vacío')
        if len(value) > 20:
            raise ValidationError('El teléfono no puede exceder 20 caracteres')
        if not re.match(r'^[\d\s\-\+\(\)]+$', value.strip()):
            raise ValidationError('El teléfono solo puede contener números, espacios, guiones, paréntesis y +')

    @validates('address')
    def validate_address(self, value):
        if value and len(value) > 300:
            raise ValidationError('La dirección no puede exceder 300 caracteres')

    @validates('website')
    def validate_website(self, value):
        if value and value.strip():
            if len(value) > 300:
                raise ValidationError('El sitio web no puede exceder 300 caracteres')
            if not URL_REGEX.match(value.strip()):
                raise ValidationError('Formato de sitio web inválido')

    @validates('payment_bank')
    def validate_payment_bank(self, value):
        if value and len(value) > 100:
            raise ValidationError('El banco no puede exceder 100 caracteres')

    @validates('payment_account')
    def validate_payment_account(self, value):
        if value and len(value) > 50:
            raise ValidationError('El número de cuenta no puede exceder 50 caracteres')

    @validates('payment_terms')
    def validate_payment_terms(self, value):
        if value and len(value) > 200:
            raise ValidationError('Las condiciones de pago no pueden exceder 200 caracteres')


class SupplierResponseSchema(Schema):
    """Schema para respuestas de proveedor"""

    id = fields.Str()
    company_name = fields.Str()
    contact_name = fields.Str()
    email = fields.Str()
    phone = fields.Str()
    address = fields.Str(allow_none=True)
    website = fields.Str(allow_none=True)
    payment_bank = fields.Str(allow_none=True)
    payment_account = fields.Str(allow_none=True)
    payment_terms = fields.Str(allow_none=True)
    categories = fields.List(fields.Dict())
    is_active = fields.Bool()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


# Instancias de esquemas para uso en rutas
supplier_create_schema = SupplierCreateSchema()
supplier_response_schema = SupplierResponseSchema()
suppliers_response_schema = SupplierResponseSchema(many=True)
