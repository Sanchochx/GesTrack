"""
Rutas API para gestión de Productos
Endpoints para CRUD completo de productos (US-PROD-001)
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.product import Product
from app.models.category import Category
from app.models.inventory_movement import InventoryMovement
from app.schemas.product_schema import (
    product_create_schema,
    product_update_schema,
    product_response_schema,
    products_response_schema
)
from app.utils.decorators import require_role
from app.utils.image_handler import (
    save_product_image,
    get_default_product_image,
    delete_product_image
)
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from werkzeug.datastructures import FileStorage

products_bp = Blueprint('products', __name__, url_prefix='/api/products')


@products_bp.route('', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def create_product():
    """
    POST /api/products
    US-PROD-001: Crear producto nuevo

    Criterios de Aceptación implementados:
    - CA-1: Formulario con todos los campos requeridos
    - CA-2: Validación de SKU único
    - CA-3: Validación de precios positivos
    - CA-4: Cálculo de margen de ganancia
    - CA-5: Upload y validación de imagen
    - CA-6: Registro automático de movimiento de inventario inicial
    - CA-7: Confirmación y respuesta con datos del producto
    - CA-8: Manejo de errores

    Body (multipart/form-data):
        - name: Nombre del producto (requerido)
        - sku: SKU único (requerido)
        - description: Descripción (opcional)
        - cost_price: Precio de costo (requerido)
        - sale_price: Precio de venta (requerido)
        - initial_stock: Stock inicial (requerido)
        - reorder_point: Punto de reorden (opcional, default 10)
        - category_id: ID de categoría (requerido)
        - image: Archivo de imagen (opcional)
    """
    try:
        # Obtener usuario actual
        current_user_id = get_jwt_identity()

        # Obtener datos del formulario
        form_data = request.form.to_dict()

        # Convertir tipos de datos
        if 'cost_price' in form_data:
            form_data['cost_price'] = float(form_data['cost_price'])
        if 'sale_price' in form_data:
            form_data['sale_price'] = float(form_data['sale_price'])
        if 'initial_stock' in form_data:
            form_data['initial_stock'] = int(form_data['initial_stock'])
        if 'reorder_point' in form_data:
            form_data['reorder_point'] = int(form_data['reorder_point'])

        # CA-1 & CA-3: Validar datos con schema
        validated_data = product_create_schema.load(form_data)

        # CA-2: Validar que el SKU sea único
        if not Product.validate_sku_unique(validated_data['sku']):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'DUPLICATE_SKU',
                    'message': 'Este SKU ya está registrado',
                    'field': 'sku'
                }
            }), 400

        # Validar que la categoría exista
        category = Category.query.get(validated_data['category_id'])
        if not category:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'CATEGORY_NOT_FOUND',
                    'message': 'La categoría especificada no existe',
                    'field': 'category_id'
                }
            }), 400

        # CA-5: Procesar imagen si se envió
        image_url = None
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file and image_file.filename:
                success, result = save_product_image(
                    image_file,
                    validated_data['sku'],
                    current_app.config['UPLOAD_FOLDER']
                )
                if success:
                    image_url = result
                else:
                    # Error al guardar imagen
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 'IMAGE_UPLOAD_ERROR',
                            'message': result,
                            'field': 'image'
                        }
                    }), 400

        # Si no hay imagen, usar imagen por defecto
        if not image_url:
            image_url = get_default_product_image()

        # Crear nuevo producto
        new_product = Product(
            sku=validated_data['sku'].strip(),
            name=validated_data['name'].strip(),
            description=validated_data.get('description', '').strip() if validated_data.get('description') else None,
            cost_price=validated_data['cost_price'],
            sale_price=validated_data['sale_price'],
            stock_quantity=validated_data['initial_stock'],
            min_stock_level=validated_data.get('reorder_point', 10),
            category_id=validated_data['category_id'],
            image_url=image_url,
            is_active=True
        )

        db.session.add(new_product)
        db.session.flush()  # Para obtener el ID del producto

        # CA-6: Crear movimiento de inventario inicial
        initial_movement = InventoryMovement.create_initial_stock_movement(
            product=new_product,
            user_id=current_user_id,
            initial_stock=validated_data['initial_stock']
        )
        db.session.add(initial_movement)

        # Commit de ambos registros
        db.session.commit()

        # CA-4 & CA-7: Preparar respuesta con margen calculado
        product_data = new_product.to_dict()
        product_data['profit_margin'] = new_product.calculate_profit_margin()
        product_data['category'] = {
            'id': category.id,
            'name': category.name,
            'color': category.color,
            'icon': category.icon
        }

        return jsonify({
            'success': True,
            'data': product_data,
            'message': 'Producto creado correctamente'
        }), 201

    except ValidationError as e:
        # CA-8: Errores de validación
        return jsonify({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Error de validación',
                'details': e.messages
            }
        }), 400

    except IntegrityError:
        # CA-8: Error de integridad (ej: SKU duplicado a nivel BD)
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'DUPLICATE_SKU',
                'message': 'Este SKU ya está registrado'
            }
        }), 400

    except Exception as e:
        # CA-8: Error general del servidor
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al crear producto',
                'details': str(e)
            }
        }), 500


@products_bp.route('/validate-sku/<sku>', methods=['GET'])
@jwt_required()
def validate_sku(sku):
    """
    GET /api/products/validate-sku/:sku
    CA-2: Validar si un SKU es único (para validación en tiempo real)

    Returns:
        - is_available: bool indicando si el SKU está disponible
    """
    try:
        is_available = Product.validate_sku_unique(sku)

        return jsonify({
            'success': True,
            'data': {
                'sku': sku,
                'is_available': is_available
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al validar SKU',
                'details': str(e)
            }
        }), 500


@products_bp.route('', methods=['GET'])
@jwt_required()
def get_products():
    """
    GET /api/products
    Listar todos los productos con filtros y búsqueda

    Query params:
        - search: Buscar por nombre o SKU
        - category_id: Filtrar por categoría
        - min_stock: Filtrar productos con stock bajo
        - sort_by: Campo para ordenar (name, sku, created_at)
        - order: Orden (asc, desc)
    """
    try:
        # Parámetros de consulta
        search = request.args.get('search', '').strip()
        category_id = request.args.get('category_id')
        min_stock = request.args.get('min_stock', type=bool, default=False)
        sort_by = request.args.get('sort_by', 'created_at')
        order = request.args.get('order', 'desc')

        # Query base
        query = Product.query.filter(Product.is_active == True)

        # Aplicar búsqueda
        if search:
            query = query.filter(
                db.or_(
                    Product.name.ilike(f'%{search}%'),
                    Product.sku.ilike(f'%{search}%')
                )
            )

        # Filtrar por categoría
        if category_id:
            query = query.filter(Product.category_id == category_id)

        # Filtrar productos con stock bajo
        if min_stock:
            query = query.filter(Product.stock_quantity <= Product.min_stock_level)

        # Ordenamiento
        if sort_by == 'name':
            query = query.order_by(Product.name.desc() if order == 'desc' else Product.name.asc())
        elif sort_by == 'sku':
            query = query.order_by(Product.sku.desc() if order == 'desc' else Product.sku.asc())
        else:  # created_at
            query = query.order_by(Product.created_at.desc() if order == 'desc' else Product.created_at.asc())

        # Ejecutar query
        products = query.all()

        # Convertir a diccionarios con información adicional
        products_data = []
        for product in products:
            product_dict = product.to_dict()
            product_dict['profit_margin'] = product.calculate_profit_margin()
            if product.category:
                product_dict['category'] = {
                    'id': product.category.id,
                    'name': product.category.name,
                    'color': product.category.color,
                    'icon': product.category.icon
                }
            products_data.append(product_dict)

        return jsonify({
            'success': True,
            'data': products_data,
            'total': len(products_data)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al obtener productos',
                'details': str(e)
            }
        }), 500


@products_bp.route('/<product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    """
    GET /api/products/:id
    CA-7: Obtener detalles de un producto específico
    """
    try:
        product = Product.query.get(product_id)

        if not product:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Producto no encontrado'
                }
            }), 404

        # Preparar respuesta con datos completos
        product_data = product.to_dict()
        product_data['profit_margin'] = product.calculate_profit_margin()
        if product.category:
            product_data['category'] = {
                'id': product.category.id,
                'name': product.category.name,
                'color': product.category.color,
                'icon': product.category.icon
            }

        return jsonify({
            'success': True,
            'data': product_data
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al obtener producto',
                'details': str(e)
            }
        }), 500
