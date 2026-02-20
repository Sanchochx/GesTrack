"""
Rutas API para gestión de Productos
Endpoints para CRUD completo de productos (US-PROD-001)
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.product import Product
from app.models.category import Category
from app.models.inventory_movement import InventoryMovement
from app.models.product_deletion_audit import ProductDeletionAudit
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
            min_stock_level=10,  # Default min stock level
            reorder_point=validated_data.get('reorder_point', 10),  # US-PROD-008 CA-1
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
    US-PROD-003: Buscar y filtrar productos

    Criterios de Aceptación implementados:
    - CA-1: Estructura de tabla con todas las columnas
    - CA-2: Paginación del lado del servidor
    - CA-3: Indicadores de stock bajo
    - CA-4: Ordenamiento por múltiples columnas
    - CA-6: Contador total y estadísticas
    - US-PROD-003 CA-4: Filtro por estado de stock

    Query params:
        - page: Número de página (default: 1)
        - limit: Productos por página (default: 20, opciones: 10, 20, 50, 100)
        - sort: Campo para ordenar (name, sku, category, sale_price, stock_quantity)
        - order: Orden (asc, desc) - default: asc
        - search: Buscar por nombre o SKU (opcional)
        - category_id: Filtrar por categoría (opcional)
        - stock_status: Estado de stock (all, normal, low, out) (opcional)
        - low_stock_only: [DEPRECATED] Filtrar solo productos con stock bajo (opcional)
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
        stock_status = request.args.get('stock_status', '').strip().lower()  # US-PROD-003

        # Query base - productos activos y no eliminados (US-PROD-006 CA-9)
        query = Product.query.filter(
            Product.is_active == True,
            Product.deleted_at == None
        )

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

        # US-PROD-003 CA-4: Filtrar por estado de stock
        if stock_status == 'normal':
            query = query.filter(Product.stock_quantity > Product.min_stock_level)
        elif stock_status == 'low':
            query = query.filter(
                Product.stock_quantity <= Product.min_stock_level,
                Product.stock_quantity > 0
            )
        elif stock_status == 'out':
            query = query.filter(Product.stock_quantity == 0)
        # CA-3: Mantener compatibilidad con low_stock_only (legacy)
        elif low_stock_only:
            query = query.filter(Product.stock_quantity <= Product.min_stock_level)

        # CA-6: Calcular estadísticas ANTES de aplicar paginación
        # OPTIMIZADO: Usar queries agregadas SQL en lugar de cargar todos en memoria
        total_products = query.count()

        # Estadísticas de stock usando SQL agregadas (más eficiente)
        # US-PROD-006 CA-9: Excluir productos eliminados
        stock_stats = db.session.query(
            func.count(case((Product.stock_quantity > Product.min_stock_level, 1))).label('normal_stock'),
            func.count(case(
                ((Product.stock_quantity > 0) & (Product.stock_quantity <= Product.min_stock_level), 1)
            )).label('low_stock'),
            func.count(case((Product.stock_quantity == 0, 1))).label('out_of_stock')
        ).filter(
            Product.is_active == True,
            Product.deleted_at == None
        )

        # Aplicar los mismos filtros que la query principal
        if search:
            stock_stats = stock_stats.filter(
                (Product.name.ilike(f'%{search}%')) | (Product.sku.ilike(f'%{search}%'))
            )
        if category_id:
            stock_stats = stock_stats.filter(Product.category_id == category_id)

        # US-PROD-003: Aplicar filtro de stock status
        if stock_status == 'normal':
            stock_stats = stock_stats.filter(Product.stock_quantity > Product.min_stock_level)
        elif stock_status == 'low':
            stock_stats = stock_stats.filter(
                Product.stock_quantity <= Product.min_stock_level,
                Product.stock_quantity > 0
            )
        elif stock_status == 'out':
            stock_stats = stock_stats.filter(Product.stock_quantity == 0)
        elif low_stock_only:
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


@products_bp.route('/low-stock', methods=['GET'])
@jwt_required()
def get_low_stock_products():
    """
    GET /api/products/low-stock
    US-PROD-008 CA-2 & CA-4: Obtener productos con stock bajo

    Query params:
        - page: Número de página (default: 1)
        - per_page: Elementos por página (default: 20)
        - sort_by: Campo para ordenar (default: stock_quantity)
        - order: Orden ascendente/descendente (asc/desc, default: asc)

    Returns:
        Lista de productos donde stock_quantity <= reorder_point
        Ordenados por stock más bajo primero (productos sin stock al inicio)
    """
    try:
        # Parámetros de paginación
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        sort_by = request.args.get('sort_by', 'stock_quantity', type=str)
        order = request.args.get('order', 'asc', type=str)

        # US-PROD-008 CA-2: Query para productos con stock bajo
        # stock_quantity <= reorder_point AND stock_quantity > 0 OR stock_quantity = 0
        query = Product.query.filter(
            Product.is_active == True,
            Product.deleted_at == None,
            Product.stock_quantity <= Product.reorder_point
        )

        # Ordenamiento
        if hasattr(Product, sort_by):
            order_column = getattr(Product, sort_by)
            if order == 'desc':
                query = query.order_by(order_column.desc())
            else:
                query = query.order_by(order_column.asc())
        else:
            # Default: ordenar por stock, productos sin stock primero
            query = query.order_by(Product.stock_quantity.asc())

        # Paginación
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        products = pagination.items

        # Serializar productos con información adicional
        products_data = []
        for product in products:
            product_dict = product.to_dict()
            product_dict['profit_margin'] = product.calculate_profit_margin()
            product_dict['stock_status'] = product.get_stock_status()

            # CA-4: Información adicional para vista de stock bajo
            product_dict['difference'] = product.reorder_point - product.stock_quantity

            # Información de categoría
            if product.category:
                product_dict['category'] = {
                    'id': product.category.id,
                    'name': product.category.name,
                    'color': product.category.color,
                    'icon': product.category.icon
                }

            products_data.append(product_dict)

        # Estadísticas adicionales
        total_low_stock = query.count()
        out_of_stock_count = Product.query.filter(
            Product.is_active == True,
            Product.deleted_at == None,
            Product.stock_quantity == 0
        ).count()

        return jsonify({
            'success': True,
            'data': products_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            },
            'stats': {
                'total_low_stock': total_low_stock,
                'out_of_stock': out_of_stock_count
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al obtener productos con stock bajo',
                'details': str(e)
            }
        }), 500


@products_bp.route('/<product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    """
    GET /api/products/:id
    US-PROD-004: Obtener detalles completos de un producto específico

    Incluye:
    - Información básica del producto
    - Información de categoría
    - Margen de ganancia calculado
    - Estado de stock y alertas
    - Últimos 5 movimientos de inventario
    - Productos similares (misma categoría)
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

        # CA-2: Cálculo de margen de ganancia
        product_data['profit_margin'] = product.calculate_profit_margin()
        product_data['profit_per_unit'] = float(product.sale_price) - float(product.cost_price) if product.sale_price and product.cost_price else 0.0

        # CA-1: Información de categoría completa
        if product.category:
            product_data['category'] = {
                'id': product.category.id,
                'name': product.category.name,
                'color': product.category.color,
                'icon': product.category.icon
            }
        else:
            product_data['category'] = None

        # CA-3 & CA-4: Estado de stock e indicadores de alerta
        stock_percentage = 0
        if product.min_stock_level and product.min_stock_level > 0:
            stock_percentage = min(100, (product.stock_quantity / product.min_stock_level * 100))

        product_data['stock_status'] = {
            'is_low_stock': product.stock_quantity <= product.min_stock_level and product.stock_quantity > 0,
            'is_out_of_stock': product.stock_quantity == 0,
            'is_normal': product.stock_quantity > product.min_stock_level,
            'reorder_units': max(0, product.min_stock_level - product.stock_quantity) if product.stock_quantity <= product.min_stock_level else 0,
            'stock_percentage': stock_percentage
        }

        # CA-7: Últimos 5 movimientos de inventario
        recent_movements = InventoryMovement.query.filter_by(
            product_id=product_id
        ).order_by(
            InventoryMovement.created_at.desc()
        ).limit(5).all()

        product_data['recent_movements'] = [
            {
                'id': mov.id,
                'movement_type': mov.movement_type,
                'quantity': mov.quantity,
                'previous_stock': mov.previous_stock,
                'new_stock': mov.new_stock,
                'reason': mov.reason,
                'reference': mov.reference,
                'notes': mov.notes,
                'created_at': mov.created_at.isoformat() if mov.created_at else None,
                'user_id': mov.user_id
            }
            for mov in recent_movements
        ]

        # CA-7: Productos similares (misma categoría, máximo 5)
        similar_products = Product.query.filter(
            Product.category_id == product.category_id,
            Product.id != product.id,
            Product.is_active == True
        ).order_by(
            Product.name.asc()
        ).limit(5).all()

        product_data['similar_products'] = [
            {
                'id': p.id,
                'name': p.name,
                'sku': p.sku,
                'sale_price': float(p.sale_price) if p.sale_price else 0.0,
                'stock_quantity': p.stock_quantity,
                'image_url': p.image_url
            }
            for p in similar_products
        ]

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


@products_bp.route('/<product_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def update_product(product_id):
    """
    PUT/PATCH /api/products/:id
    US-PROD-005: Editar producto existente

    Criterios de Aceptación implementados:
    - CA-2: SKU no es editable
    - CA-3: Validación de todos los campos editables
    - CA-4: Validación de precios (advertencia si venta < costo)
    - CA-5: Recálculo automático de margen
    - CA-6: Actualización de imagen opcional
    - CA-7: Detección de cambios importantes
    - CA-8: Registro de auditoría (updated_at, user_id)
    - CA-10: Manejo de errores completo

    Body (multipart/form-data):
        - name: Nombre del producto
        - description: Descripción
        - cost_price: Precio de costo
        - sale_price: Precio de venta
        - min_stock_level: Punto de reorden
        - category_id: ID de categoría
        - image: Archivo de imagen (opcional)
        - force_price_below_cost: Confirmación si precio venta < costo (opcional)
    """
    try:
        # Obtener usuario actual
        current_user_id = get_jwt_identity()

        # Buscar producto existente
        product = Product.query.get(product_id)

        if not product:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Producto no encontrado'
                }
            }), 404

        # Verificar que el producto esté activo
        if not product.is_active:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'PRODUCT_INACTIVE',
                    'message': 'No se puede editar un producto inactivo'
                }
            }), 400

        # Guardar valores originales para comparación (CA-7)
        original_values = {
            'cost_price': float(product.cost_price) if product.cost_price else 0.0,
            'sale_price': float(product.sale_price) if product.sale_price else 0.0,
            'category_id': product.category_id,
            'image_url': product.image_url
        }

        # Obtener datos del formulario
        form_data = request.form.to_dict()

        # Convertir tipos de datos
        if 'cost_price' in form_data:
            form_data['cost_price'] = float(form_data['cost_price'])
        if 'sale_price' in form_data:
            form_data['sale_price'] = float(form_data['sale_price'])
        if 'min_stock_level' in form_data:
            form_data['min_stock_level'] = int(form_data['min_stock_level'])
        if 'reorder_point' in form_data:  # US-PROD-008 CA-1
            form_data['reorder_point'] = int(form_data['reorder_point'])

        # CA-3: Validar datos con schema (excluye SKU y stock_quantity)
        validated_data = product_update_schema.load(form_data)

        # CA-4: Validar precios - advertencia si precio de venta < costo
        force_price_below_cost = request.form.get('force_price_below_cost', 'false').lower() == 'true'

        # Convertir a float para comparación consistente
        new_cost_price = float(validated_data.get('cost_price', product.cost_price))
        new_sale_price = float(validated_data.get('sale_price', product.sale_price))

        if new_sale_price < new_cost_price and not force_price_below_cost:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'PRICE_WARNING',
                    'message': 'El precio de venta es menor al costo. Esto generará pérdidas.',
                    'details': {
                        'requires_confirmation': True,
                        'cost_price': new_cost_price,
                        'sale_price': new_sale_price,
                        'loss_per_unit': new_cost_price - new_sale_price
                    }
                }
            }), 400

        # Validar que la categoría exista si se está cambiando
        if 'category_id' in validated_data:
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

        # CA-6: Procesar imagen si se envió una nueva
        new_image_url = None
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file and image_file.filename:
                # Guardar nueva imagen
                success, result = save_product_image(
                    image_file,
                    product.sku,  # Usar SKU existente
                    current_app.config['UPLOAD_FOLDER']
                )
                if success:
                    new_image_url = result
                    # Eliminar imagen anterior si existe y no es la default
                    if product.image_url and product.image_url != get_default_product_image():
                        delete_product_image(product.image_url, current_app.config['UPLOAD_FOLDER'])
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

        # CA-7: Detectar cambios importantes para metadata
        significant_changes = []

        if 'cost_price' in validated_data:
            new_cost = float(validated_data['cost_price'])
            old_cost = original_values['cost_price']
            price_change = abs((new_cost - old_cost) / old_cost * 100) if old_cost > 0 else 0
            if price_change >= 20:
                significant_changes.append({
                    'field': 'cost_price',
                    'old_value': old_cost,
                    'new_value': new_cost,
                    'change_percent': round(price_change, 2)
                })

        if 'sale_price' in validated_data:
            new_sale = float(validated_data['sale_price'])
            old_sale = original_values['sale_price']
            price_change = abs((new_sale - old_sale) / old_sale * 100) if old_sale > 0 else 0
            if price_change >= 20:
                significant_changes.append({
                    'field': 'sale_price',
                    'old_value': old_sale,
                    'new_value': new_sale,
                    'change_percent': round(price_change, 2)
                })

        if 'category_id' in validated_data and validated_data['category_id'] != original_values['category_id']:
            significant_changes.append({
                'field': 'category_id',
                'old_value': original_values['category_id'],
                'new_value': validated_data['category_id']
            })

        # Actualizar campos del producto
        if 'name' in validated_data:
            product.name = validated_data['name'].strip()
        if 'description' in validated_data:
            product.description = validated_data['description'].strip() if validated_data['description'] else None
        if 'cost_price' in validated_data:
            product.cost_price = validated_data['cost_price']
        if 'sale_price' in validated_data:
            product.sale_price = validated_data['sale_price']
        if 'min_stock_level' in validated_data:
            product.min_stock_level = validated_data['min_stock_level']
        if 'reorder_point' in validated_data:  # US-PROD-008 CA-1
            product.reorder_point = validated_data['reorder_point']
        if 'category_id' in validated_data:
            product.category_id = validated_data['category_id']
        if new_image_url:
            product.image_url = new_image_url

        # CA-8: updated_at se actualiza automáticamente por onupdate en el modelo
        # Guardamos el user_id en la sesión para auditoría (se puede implementar campo adicional)

        db.session.commit()

        # Preparar respuesta con datos actualizados
        product_data = product.to_dict()

        # CA-5: Incluir margen recalculado
        product_data['profit_margin'] = product.calculate_profit_margin()
        product_data['profit_per_unit'] = float(product.sale_price) - float(product.cost_price) if product.sale_price and product.cost_price else 0.0

        # Información de categoría
        if product.category:
            product_data['category'] = {
                'id': product.category.id,
                'name': product.category.name,
                'color': product.category.color,
                'icon': product.category.icon
            }

        # Incluir cambios significativos en la respuesta
        if significant_changes:
            product_data['significant_changes'] = significant_changes

        return jsonify({
            'success': True,
            'data': product_data,
            'message': 'Producto actualizado correctamente'
        }), 200

    except ValidationError as e:
        # CA-10: Errores de validación
        return jsonify({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Error de validación',
                'details': e.messages
            }
        }), 400

    except Exception as e:
        # CA-10: Error general del servidor
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al actualizar producto',
                'details': str(e)
            }
        }), 500


@products_bp.route('/<product_id>', methods=['DELETE'])
@jwt_required()
@require_role(['Admin'])  # US-PROD-006 CA-1: Solo Admin puede eliminar
def delete_product(product_id):
    """
    DELETE /api/products/:id
    US-PROD-006: Eliminar producto (soft delete)

    Criterios de Aceptación implementados:
    - CA-1: Solo Admin puede eliminar productos
    - CA-3: Validación de pedidos asociados (preparado para cuando existan modelos)
    - CA-4: Validación de stock existente
    - CA-5: Registro en tabla de auditoría
    - CA-6: Eliminación de imagen del servidor
    - CA-9: Soft delete con deleted_at
    - CA-7 & CA-8: Mensajes y manejo de errores

    Body (JSON opcional):
        - reason: Razón de eliminación (opcional)
        - force_with_stock: Confirmar eliminación con stock (booleano)
    """
    try:
        # Obtener usuario actual
        current_user_id = get_jwt_identity()

        # Buscar producto
        product = Product.query.get(product_id)

        if not product:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Producto no encontrado'
                }
            }), 404

        # Verificar si ya está eliminado
        if product.deleted_at is not None:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'ALREADY_DELETED',
                    'message': 'Este producto ya ha sido eliminado'
                }
            }), 400

        # Obtener datos del body (JSON)
        data = request.get_json() or {}
        reason = data.get('reason', None)
        force_with_stock = data.get('force_with_stock', False)

        # CA-3: Validar pedidos asociados
        # TODO: Cuando se implementen los modelos Order y PurchaseOrder, agregar validación aquí
        # Por ahora, dejamos preparada la estructura para futuras validaciones
        has_orders = False  # Placeholder - cuando existan modelos, verificar aquí

        if has_orders:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'HAS_ASSOCIATED_ORDERS',
                    'message': 'No se puede eliminar este producto porque tiene pedidos asociados',
                    'details': {
                        'purchase_orders_count': 0,  # Placeholder
                        'sales_orders_count': 0,  # Placeholder
                        'suggestion': 'Puedes marcarlo como inactivo en su lugar'
                    }
                }
            }), 400

        # CA-4: Validar stock existente
        if product.stock_quantity > 0 and not force_with_stock:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'HAS_STOCK',
                    'message': f'Este producto tiene {product.stock_quantity} unidades en stock',
                    'details': {
                        'requires_confirmation': True,
                        'stock_quantity': product.stock_quantity
                    }
                }
            }), 400

        # CA-5: Crear registro de auditoría
        audit_record = ProductDeletionAudit.create_audit_record(
            product=product,
            user_id=current_user_id,
            reason=reason
        )
        db.session.add(audit_record)

        # CA-9: Soft delete - marcar como eliminado
        product.deleted_at = datetime.utcnow()
        product.is_active = False

        # CA-6: Eliminar imagen del servidor (si no es la default)
        if product.image_url and product.image_url != get_default_product_image():
            try:
                delete_product_image(product.image_url, current_app.config['UPLOAD_FOLDER'])
            except Exception as img_error:
                # Log del error pero no falla la eliminación
                current_app.logger.warning(f'Error al eliminar imagen: {str(img_error)}')

        # Commit de cambios
        db.session.commit()

        # CA-7: Respuesta exitosa
        return jsonify({
            'success': True,
            'message': 'Producto eliminado correctamente',
            'data': {
                'product_id': product_id,
                'deleted_at': product.deleted_at.isoformat(),
                'audit_id': audit_record.id
            }
        }), 200

    except Exception as e:
        # CA-8: Manejo de errores
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al eliminar producto',
                'details': str(e)
            }
        }), 500


@products_bp.route('/<product_id>/image', methods=['DELETE'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def delete_product_image_endpoint(product_id):
    """
    DELETE /api/products/<product_id>/image
    US-PROD-009 CA-9: Eliminar imagen de un producto

    El producto mantiene sus datos pero la imagen se elimina
    y se reemplaza por la imagen por defecto

    Returns:
        - 200: Imagen eliminada exitosamente
        - 404: Producto no encontrado
        - 400: El producto no tiene imagen o ya usa la imagen por defecto
        - 500: Error del servidor
    """
    try:
        # Buscar el producto
        product = Product.query.filter_by(
            id=product_id,
            is_active=True,
            deleted_at=None
        ).first()

        if not product:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'PRODUCT_NOT_FOUND',
                    'message': 'Producto no encontrado'
                }
            }), 404

        # Verificar si tiene imagen personalizada
        default_image = get_default_product_image()
        if not product.image_url or product.image_url == default_image:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NO_CUSTOM_IMAGE',
                    'message': 'El producto no tiene una imagen personalizada para eliminar'
                }
            }), 400

        # Guardar URL de imagen anterior para eliminar el archivo
        old_image_url = product.image_url

        # Actualizar producto con imagen por defecto
        product.image_url = default_image

        # Eliminar archivo físico del servidor
        try:
            delete_product_image(old_image_url, current_app.config['UPLOAD_FOLDER'])
        except Exception as img_error:
            # Log del error pero continuar
            current_app.logger.warning(f'Error al eliminar archivo de imagen: {str(img_error)}')

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Imagen eliminada correctamente',
            'data': {
                'product_id': product_id,
                'image_url': product.image_url
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al eliminar imagen',
                'details': str(e)
            }
        }), 500
