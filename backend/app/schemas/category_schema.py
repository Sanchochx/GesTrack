"""
Schemas de validación para Categorías
Maneja validación y serialización de datos de categorías.
"""
from marshmallow import Schema, fields, validates, ValidationError, validate


class CategorySchema(Schema):
    """Schema para crear y actualizar categorías"""

    id = fields.String(dump_only=True)
    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=100, error="El nombre debe tener entre 1 y 100 caracteres")
    )
    description = fields.String(
        allow_none=True,
        validate=validate.Length(max=500, error="La descripción no debe superar 500 caracteres")
    )
    color = fields.String(
        allow_none=True,
        validate=validate.Regexp(
            r'^#[0-9A-Fa-f]{6}$',
            error="El color debe estar en formato hexadecimal (#RRGGBB)"
        )
    )
    icon = fields.String(
        allow_none=True,
        validate=validate.Length(max=50, error="El icono no debe superar 50 caracteres")
    )
    is_default = fields.Boolean(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    product_count = fields.Integer(dump_only=True)

    @validates('name')
    def validate_name(self, value):
        """Valida que el nombre no esté vacío después de strip"""
        if not value or not value.strip():
            raise ValidationError("El nombre no puede estar vacío")

        # Validar que no contenga solo espacios
        if len(value.strip()) == 0:
            raise ValidationError("El nombre no puede contener solo espacios")

        return value.strip()


class CategoryCreateSchema(CategorySchema):
    """Schema específico para creación de categorías"""

    class Meta:
        fields = ('name', 'description', 'color', 'icon')


class CategoryUpdateSchema(CategorySchema):
    """Schema específico para actualización de categorías"""

    name = fields.String(
        allow_none=True,
        validate=validate.Length(min=1, max=100, error="El nombre debe tener entre 1 y 100 caracteres")
    )

    class Meta:
        fields = ('name', 'description', 'color', 'icon')


class CategoryResponseSchema(CategorySchema):
    """Schema para respuestas que incluyen datos completos"""

    class Meta:
        fields = ('id', 'name', 'description', 'color', 'icon', 'is_default', 'created_at', 'product_count')


# Instancias de schemas
category_create_schema = CategoryCreateSchema()
category_update_schema = CategoryUpdateSchema()
category_response_schema = CategoryResponseSchema()
categories_response_schema = CategoryResponseSchema(many=True)
