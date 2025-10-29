"""
Esquemas de validación para Producto
Valida campos de entrada/salida para API de productos
"""
from marshmallow import Schema, fields, validates, ValidationError, validates_schema
from decimal import Decimal
import re


class ProductCreateSchema(Schema):
    """Schema para crear un producto nuevo (CA-1)"""

    # CA-1: Campos requeridos
    name = fields.Str(required=True, error_messages={
        'required': 'El nombre es requerido'
    })
    sku = fields.Str(required=True, error_messages={
        'required': 'El SKU es requerido'
    })
    cost_price = fields.Decimal(required=True, places=2, error_messages={
        'required': 'El precio de costo es requerido'
    })
    sale_price = fields.Decimal(required=True, places=2, error_messages={
        'required': 'El precio de venta es requerido'
    })
    initial_stock = fields.Int(required=True, error_messages={
        'required': 'El stock inicial es requerido'
    })
    category_id = fields.Str(required=True, error_messages={
        'required': 'La categoría es requerida'
    })

    # CA-1: Campos opcionales
    description = fields.Str(required=False, allow_none=True)
    reorder_point = fields.Int(required=False, missing=10)  # Default 10
    image = fields.Str(required=False, allow_none=True)  # Image filename after upload

    @validates('name')
    def validate_name(self, value):
        """CA-1: Validar nombre (max 200 caracteres)"""
        if not value or not value.strip():
            raise ValidationError('El nombre no puede estar vacío')
        if len(value) > 200:
            raise ValidationError('El nombre no puede exceder 200 caracteres')

    @validates('sku')
    def validate_sku(self, value):
        """CA-1 & CA-2: Validar SKU (max 50 caracteres, alfanumérico)"""
        if not value or not value.strip():
            raise ValidationError('El SKU no puede estar vacío')

        # CA-1: Max 50 caracteres
        if len(value) > 50:
            raise ValidationError('El SKU no puede exceder 50 caracteres')

        # CA-1: Solo alfanumérico (permitir guiones y guiones bajos)
        if not re.match(r'^[A-Za-z0-9_-]+$', value):
            raise ValidationError('El SKU solo puede contener letras, números, guiones y guiones bajos')

    @validates('description')
    def validate_description(self, value):
        """CA-1: Validar descripción (max 1000 caracteres)"""
        if value and len(value) > 1000:
            raise ValidationError('La descripción no puede exceder 1000 caracteres')

    @validates('cost_price')
    def validate_cost_price(self, value):
        """CA-3: Validar precio de costo (positivo, mayor a 0)"""
        if value is None:
            raise ValidationError('El precio de costo es requerido')
        if value <= 0:
            raise ValidationError('El precio de costo debe ser mayor a 0')

    @validates('sale_price')
    def validate_sale_price(self, value):
        """CA-3: Validar precio de venta (positivo, mayor a 0)"""
        if value is None:
            raise ValidationError('El precio de venta es requerido')
        if value <= 0:
            raise ValidationError('El precio de venta debe ser mayor a 0')

    @validates('initial_stock')
    def validate_initial_stock(self, value):
        """CA-1: Validar stock inicial (>=0)"""
        if value is None:
            raise ValidationError('El stock inicial es requerido')
        if value < 0:
            raise ValidationError('El stock inicial no puede ser negativo')

    @validates('reorder_point')
    def validate_reorder_point(self, value):
        """CA-1: Validar punto de reorden (opcional, >=0)"""
        if value is not None and value < 0:
            raise ValidationError('El punto de reorden no puede ser negativo')

    @validates_schema
    def validate_prices(self, data, **kwargs):
        """CA-3: Validar que precio de venta >= precio de costo (advertencia, no error)"""
        # Esta validación se maneja en el frontend con warning
        # Backend solo valida que ambos sean positivos
        pass


class ProductUpdateSchema(Schema):
    """Schema para actualizar un producto existente"""

    # Todos los campos son opcionales en actualización
    name = fields.Str(required=False)
    sku = fields.Str(required=False)
    description = fields.Str(required=False, allow_none=True)
    cost_price = fields.Decimal(required=False, places=2)
    sale_price = fields.Decimal(required=False, places=2)
    stock_quantity = fields.Int(required=False)
    min_stock_level = fields.Int(required=False)
    category_id = fields.Str(required=False)
    image_url = fields.Str(required=False, allow_none=True)
    is_active = fields.Bool(required=False)

    @validates('name')
    def validate_name(self, value):
        """Validar nombre si se proporciona"""
        if value is not None:
            if not value.strip():
                raise ValidationError('El nombre no puede estar vacío')
            if len(value) > 200:
                raise ValidationError('El nombre no puede exceder 200 caracteres')

    @validates('sku')
    def validate_sku(self, value):
        """Validar SKU si se proporciona"""
        if value is not None:
            if not value.strip():
                raise ValidationError('El SKU no puede estar vacío')
            if len(value) > 50:
                raise ValidationError('El SKU no puede exceder 50 caracteres')
            if not re.match(r'^[A-Za-z0-9_-]+$', value):
                raise ValidationError('El SKU solo puede contener letras, números, guiones y guiones bajos')

    @validates('description')
    def validate_description(self, value):
        """Validar descripción si se proporciona"""
        if value is not None and len(value) > 1000:
            raise ValidationError('La descripción no puede exceder 1000 caracteres')

    @validates('cost_price')
    def validate_cost_price(self, value):
        """Validar precio de costo si se proporciona"""
        if value is not None and value <= 0:
            raise ValidationError('El precio de costo debe ser mayor a 0')

    @validates('sale_price')
    def validate_sale_price(self, value):
        """Validar precio de venta si se proporciona"""
        if value is not None and value <= 0:
            raise ValidationError('El precio de venta debe ser mayor a 0')

    @validates('stock_quantity')
    def validate_stock_quantity(self, value):
        """Validar cantidad de stock si se proporciona"""
        if value is not None and value < 0:
            raise ValidationError('La cantidad de stock no puede ser negativa')

    @validates('min_stock_level')
    def validate_min_stock_level(self, value):
        """Validar nivel mínimo de stock si se proporciona"""
        if value is not None and value < 0:
            raise ValidationError('El nivel mínimo de stock no puede ser negativo')


class ProductResponseSchema(Schema):
    """Schema para respuestas de producto (incluye campos calculados)"""

    id = fields.Str()
    sku = fields.Str()
    name = fields.Str()
    description = fields.Str(allow_none=True)
    cost_price = fields.Decimal(places=2, as_string=True)
    sale_price = fields.Decimal(places=2, as_string=True)
    stock_quantity = fields.Int()
    min_stock_level = fields.Int()
    category_id = fields.Str()
    image_url = fields.Str(allow_none=True)
    is_active = fields.Bool()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    # CA-4: Campo calculado - margen de ganancia
    profit_margin = fields.Method('calculate_profit_margin')

    # Relaciones
    category = fields.Method('get_category_info')

    def calculate_profit_margin(self, obj):
        """CA-4: Calcular margen de ganancia"""
        if obj.cost_price and obj.sale_price and obj.cost_price > 0:
            margin = ((obj.sale_price - obj.cost_price) / obj.cost_price) * 100
            return float(round(margin, 2))
        return 0.0

    def get_category_info(self, obj):
        """Incluir información de categoría"""
        if obj.category:
            return {
                'id': obj.category.id,
                'name': obj.category.name,
                'color': obj.category.color,
                'icon': obj.category.icon
            }
        return None


# Instancias de esquemas para uso en rutas
product_create_schema = ProductCreateSchema()
product_update_schema = ProductUpdateSchema()
product_response_schema = ProductResponseSchema()
products_response_schema = ProductResponseSchema(many=True)
