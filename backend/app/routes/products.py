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
from sqlalchemy import func, case
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
    US-PROD-002: Listar productos con paginación, ordenamiento y estadísticas

    Criterios de Aceptación implementados:
    - CA-1: Estructura de tabla con todas las columnas
    - CA-2: Paginación del lado del servidor
    - CA-3: Indicadores de stock bajo
    - CA-4: Ordenamiento por múltiples columnas
    - CA-6: Contador total y estadísticas

    Query params:
        - page: Número de página (default: 1)
        - limit: Productos por página (default: 20, opciones: 10, 20, 50, 100)
        - sort: Campo para ordenar (name, sku, category, sale_price, stock_quantity)
        - order: Orden (asc, desc) - default: asc
        - search: Buscar por nombre o SKU (opcional)
        - category_id: Filtrar por categoría (opcional)
        - low_stock_only: Filtrar solo productos con stock bajo (opcional)
    """
    try:
        # CA-2: Parámetros de paginación
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)

        # Validar límite (solo permitir valores específicos)
        if limit not in [10, 20, 50, 100]:
            limit = 20

        # CA-4: Parámetros de ordenamiento
        sort_field = request.args.get('sort', 'name')  # Default: Nombre A-Z
        order = request.args.get('order', 'asc')

        # Filtros opcionales
        search = request.args.get('search', '').strip()
        category_id = request.args.get('category_id')
        low_stock_only = request.args.get('low_stock_only', 'false').lower() == 'true'

        # Query base - productos activos
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

        # CA-3: Filtrar productos con stock bajo
        if low_stock_only:
            query = query.filter(Product.stock_quantity <= Product.min_stock_level)

        # CA-6: Calcular estadísticas ANTES de aplicar paginación
        # OPTIMIZADO: Usar queries agregadas SQL en lugar de cargar todos en memoria
        total_products = query.count()

        # Estadísticas de stock usando SQL agregadas (más eficiente)
        stock_stats = db.session.query(
            func.count(case((Product.stock_quantity > Product.min_stock_level, 1))).label('normal_stock'),
            func.count(case(
                ((Product.stock_quantity > 0) & (Product.stock_quantity <= Product.min_stock_level), 1)
            )).label('low_stock'),
            func.count(case((Product.stock_quantity == 0, 1))).label('out_of_stock')
        ).filter(Product.is_active == True)

        # Aplicar los mismos filtros que la query principal
        if search:
            stock_stats = stock_stats.filter(
                (Product.name.ilike(f'%{search}%')) | (Product.sku.ilike(f'%{search}%'))
            )
        if category_id:
            stock_stats = stock_stats.filter(Product.category_id == category_id)
        if low_stock_only:
            stock_stats = stock_stats.filter(Product.stock_quantity <= Product.min_stock_level)

        stock_counts = stock_stats.first()

        stats = {
            'total': total_products,
            'normal_stock': stock_counts.normal_stock or 0,
            'low_stock': stock_counts.low_stock or 0,
            'out_of_stock': stock_counts.out_of_stock or 0
        }

        # CA-4: Aplicar ordenamiento
        # Join con Category para poder ordenar por nombre de categoría
        query = query.outerjoin(Category)

        if sort_field == 'name':
            query = query.order_by(Product.name.desc() if order == 'desc' else Product.name.asc())
        elif sort_field == 'sku':
            query = query.order_by(Product.sku.desc() if order == 'desc' else Product.sku.asc())
        elif sort_field == 'category':
            query = query.order_by(Category.name.desc() if order == 'desc' else Category.name.asc())
        elif sort_field == 'sale_price':
            query = query.order_by(Product.sale_price.desc() if order == 'desc' else Product.sale_price.asc())
        elif sort_field == 'stock_quantity':
            query = query.order_by(Product.stock_quantity.desc() if order == 'desc' else Product.stock_quantity.asc())
        else:
            # Default: ordenar por nombre
            query = query.order_by(Product.name.asc())

        # CA-2: Aplicar paginación
        pagination = query.paginate(
            page=page,
            per_page=limit,
            error_out=False
        )

        # CA-1 & CA-3: Convertir productos a diccionarios con info completa
        products_data = []
        for product in pagination.items:
            product_dict = product.to_dict()

            # CA-4: Margen de ganancia
            product_dict['profit_margin'] = product.calculate_profit_margin()

            # CA-1: Información de categoría
            if product.category:
                product_dict['category'] = {
                    'id': product.category.id,
                    'name': product.category.name,
                    'color': product.category.color,
                    'icon': product.category.icon
                }
            else:
                product_dict['category'] = None

            # CA-3: Indicadores de stock bajo
            product_dict['stock_status'] = {
                'is_low_stock': product.stock_quantity <= product.min_stock_level and product.stock_quantity > 0,
                'is_out_of_stock': product.stock_quantity == 0,
                'reorder_units': max(0, product.min_stock_level - product.stock_quantity) if product.stock_quantity <= product.min_stock_level else 0
            }

            products_data.append(product_dict)

        # CA-2 & CA-6: Respuesta con paginación y estadísticas
        return jsonify({
            'success': True,
            'data': products_data,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_prev': pagination.has_prev,
                'has_next': pagination.has_next,
                'prev_page': pagination.prev_num if pagination.has_prev else None,
                'next_page': pagination.next_num if pagination.has_next else None
            },
            'statistics': stats
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
