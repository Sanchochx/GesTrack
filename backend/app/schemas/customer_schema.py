"""
Esquemas de validación para Cliente - Facturación Electrónica Colombia (DIAN)
US-CUST-001: Registrar Nuevo Cliente
"""
from marshmallow import Schema, fields, validates, ValidationError
import re

TIPOS_DOCUMENTO = ['CC', 'NIT', 'CE', 'PAS', 'TI']
TIPOS_CONTRIBUYENTE = ['Persona Natural', 'Persona Jurídica']
REGIMENES_FISCALES = ['R-99-PN', 'R-48']
RESPONSABILIDADES_TRIBUTARIAS = ['O-13', 'O-15', 'O-23', 'O-47', 'R-99-PN', 'ZZ-No aplica']


class CustomerCreateSchema(Schema):
    """Schema para crear un cliente nuevo"""

    # Requeridos
    nombre_razon_social = fields.Str(required=True, error_messages={
        'required': 'El nombre o razón social es requerido'
    })
    correo = fields.Email(required=True, error_messages={
        'required': 'El correo electrónico es requerido',
        'invalid': 'Formato de correo inválido'
    })
    tipo_documento = fields.Str(required=True, error_messages={
        'required': 'El tipo de documento es requerido'
    })
    numero_documento = fields.Str(required=True, error_messages={
        'required': 'El número de documento es requerido'
    })
    tipo_contribuyente = fields.Str(required=True, error_messages={
        'required': 'El tipo de contribuyente es requerido'
    })

    # Opcionales
    telefono_movil = fields.Str(required=False, allow_none=True, load_default=None)
    direccion = fields.Str(required=False, allow_none=True, load_default=None)
    municipio_ciudad = fields.Str(required=False, allow_none=True, load_default=None)
    departamento = fields.Str(required=False, allow_none=True, load_default=None)
    pais = fields.Str(required=False, load_default='Colombia')
    regimen_fiscal = fields.Str(required=False, allow_none=True, load_default=None)
    responsabilidad_tributaria = fields.Str(required=False, allow_none=True, load_default=None)
    notes = fields.Str(required=False, allow_none=True, load_default=None)

    @validates('nombre_razon_social')
    def validate_nombre_razon_social(self, value):
        if not value or not value.strip():
            raise ValidationError('El nombre o razón social no puede estar vacío')
        if len(value) > 200:
            raise ValidationError('El nombre no puede exceder 200 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\.\-\,\&\']+$', value.strip()):
            raise ValidationError('El nombre solo puede contener letras, números, espacios y caracteres especiales')

    @validates('correo')
    def validate_correo(self, value):
        if not value or not value.strip():
            raise ValidationError('El correo no puede estar vacío')
        if len(value) > 100:
            raise ValidationError('El correo no puede exceder 100 caracteres')

    @validates('tipo_documento')
    def validate_tipo_documento(self, value):
        if value not in TIPOS_DOCUMENTO:
            raise ValidationError(f'Tipo de documento inválido. Opciones: {", ".join(TIPOS_DOCUMENTO)}')

    @validates('numero_documento')
    def validate_numero_documento(self, value):
        if not value or not value.strip():
            raise ValidationError('El número de documento no puede estar vacío')
        if len(value) > 20:
            raise ValidationError('El número de documento no puede exceder 20 caracteres')
        if not re.match(r'^[\d\-]+$', value.strip()):
            raise ValidationError('El número de documento solo puede contener dígitos y guión (-)')

    @validates('tipo_contribuyente')
    def validate_tipo_contribuyente(self, value):
        if value not in TIPOS_CONTRIBUYENTE:
            raise ValidationError(f'Tipo de contribuyente inválido. Opciones: {", ".join(TIPOS_CONTRIBUYENTE)}')

    @validates('regimen_fiscal')
    def validate_regimen_fiscal(self, value):
        if value and value not in REGIMENES_FISCALES:
            raise ValidationError(f'Régimen fiscal inválido. Opciones: {", ".join(REGIMENES_FISCALES)}')

    @validates('responsabilidad_tributaria')
    def validate_responsabilidad_tributaria(self, value):
        if value and value not in RESPONSABILIDADES_TRIBUTARIAS:
            raise ValidationError(f'Responsabilidad tributaria inválida. Opciones: {", ".join(RESPONSABILIDADES_TRIBUTARIAS)}')

    @validates('telefono_movil')
    def validate_telefono_movil(self, value):
        if value and value.strip():
            if len(value) > 20:
                raise ValidationError('El teléfono no puede exceder 20 caracteres')
            if not re.match(r'^[\d\s\-\+]+$', value.strip()):
                raise ValidationError('El teléfono solo puede contener números, guiones, espacios y +')

    @validates('direccion')
    def validate_direccion(self, value):
        if value and len(value) > 300:
            raise ValidationError('La dirección no puede exceder 300 caracteres')

    @validates('municipio_ciudad')
    def validate_municipio_ciudad(self, value):
        if value and len(value) > 100:
            raise ValidationError('El municipio/ciudad no puede exceder 100 caracteres')

    @validates('departamento')
    def validate_departamento(self, value):
        if value and len(value) > 100:
            raise ValidationError('El departamento no puede exceder 100 caracteres')

    @validates('pais')
    def validate_pais(self, value):
        if value and len(value) > 100:
            raise ValidationError('El país no puede exceder 100 caracteres')

    @validates('notes')
    def validate_notes(self, value):
        if value and len(value) > 500:
            raise ValidationError('Las notas no pueden exceder 500 caracteres')


class CustomerUpdateSchema(Schema):
    """Schema para actualizar un cliente existente"""

    class Meta:
        unknown = 'exclude'

    nombre_razon_social = fields.Str(required=False)
    correo = fields.Email(required=False)
    tipo_documento = fields.Str(required=False)
    numero_documento = fields.Str(required=False)
    tipo_contribuyente = fields.Str(required=False)
    regimen_fiscal = fields.Str(required=False, allow_none=True)
    responsabilidad_tributaria = fields.Str(required=False, allow_none=True)
    telefono_movil = fields.Str(required=False, allow_none=True)
    direccion = fields.Str(required=False, allow_none=True)
    municipio_ciudad = fields.Str(required=False, allow_none=True)
    departamento = fields.Str(required=False, allow_none=True)
    pais = fields.Str(required=False)
    notes = fields.Str(required=False, allow_none=True)
    is_active = fields.Bool(required=False)

    @validates('nombre_razon_social')
    def validate_nombre_razon_social(self, value):
        if value is not None:
            if not value.strip():
                raise ValidationError('El nombre o razón social no puede estar vacío')
            if len(value) > 200:
                raise ValidationError('El nombre no puede exceder 200 caracteres')
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\.\-\,\&\']+$', value.strip()):
                raise ValidationError('El nombre solo puede contener letras, números, espacios y caracteres especiales')

    @validates('correo')
    def validate_correo(self, value):
        if value is not None:
            if not value.strip():
                raise ValidationError('El correo no puede estar vacío')
            if len(value) > 100:
                raise ValidationError('El correo no puede exceder 100 caracteres')

    @validates('tipo_documento')
    def validate_tipo_documento(self, value):
        if value is not None and value not in TIPOS_DOCUMENTO:
            raise ValidationError(f'Tipo de documento inválido. Opciones: {", ".join(TIPOS_DOCUMENTO)}')

    @validates('numero_documento')
    def validate_numero_documento(self, value):
        if value is not None:
            if not value.strip():
                raise ValidationError('El número de documento no puede estar vacío')
            if len(value) > 20:
                raise ValidationError('El número de documento no puede exceder 20 caracteres')
            if not re.match(r'^[\d\-]+$', value.strip()):
                raise ValidationError('El número de documento solo puede contener dígitos y guión (-)')

    @validates('tipo_contribuyente')
    def validate_tipo_contribuyente(self, value):
        if value is not None and value not in TIPOS_CONTRIBUYENTE:
            raise ValidationError(f'Tipo de contribuyente inválido. Opciones: {", ".join(TIPOS_CONTRIBUYENTE)}')

    @validates('regimen_fiscal')
    def validate_regimen_fiscal(self, value):
        if value and value not in REGIMENES_FISCALES:
            raise ValidationError(f'Régimen fiscal inválido. Opciones: {", ".join(REGIMENES_FISCALES)}')

    @validates('responsabilidad_tributaria')
    def validate_responsabilidad_tributaria(self, value):
        if value and value not in RESPONSABILIDADES_TRIBUTARIAS:
            raise ValidationError(f'Responsabilidad tributaria inválida. Opciones: {", ".join(RESPONSABILIDADES_TRIBUTARIAS)}')

    @validates('telefono_movil')
    def validate_telefono_movil(self, value):
        if value and value.strip():
            if len(value) > 20:
                raise ValidationError('El teléfono no puede exceder 20 caracteres')
            if not re.match(r'^[\d\s\-\+]+$', value.strip()):
                raise ValidationError('El teléfono solo puede contener números, guiones, espacios y +')

    @validates('notes')
    def validate_notes(self, value):
        if value and len(value) > 500:
            raise ValidationError('Las notas no pueden exceder 500 caracteres')


class CustomerResponseSchema(Schema):
    """Schema para respuestas de cliente"""

    id = fields.Str()
    tipo_documento = fields.Str()
    numero_documento = fields.Str()
    nombre_razon_social = fields.Str()
    tipo_contribuyente = fields.Str()
    regimen_fiscal = fields.Str(allow_none=True)
    responsabilidad_tributaria = fields.Str(allow_none=True)
    pais = fields.Str()
    departamento = fields.Str(allow_none=True)
    municipio_ciudad = fields.Str(allow_none=True)
    direccion = fields.Str(allow_none=True)
    telefono_movil = fields.Str(allow_none=True)
    correo = fields.Str()
    notes = fields.Str(allow_none=True)
    is_active = fields.Bool()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


# Instancias de esquemas para uso en rutas
customer_create_schema = CustomerCreateSchema()
customer_update_schema = CustomerUpdateSchema()
customer_response_schema = CustomerResponseSchema()
customers_response_schema = CustomerResponseSchema(many=True)
