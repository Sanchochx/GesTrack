"""
Rutas API para gestión de Categorías
Endpoints para CRUD completo de categorías de productos.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.category import Category
from app.schemas.category_schema import (
    category_create_schema,
    category_update_schema,
    category_response_schema,
    categories_response_schema
)
from app.utils.decorators import require_role
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

categories_bp = Blueprint('categories', __name__, url_prefix='/api/categories')


@categories_bp.route('', methods=['GET'])
@jwt_required()
def get_categories():
    """
    GET /api/categories
    Lista todas las categorías con opción de búsqueda y ordenamiento

    Query params:
        - search: Buscar por nombre (opcional)
        - sort_by: Campo para ordenar (name, product_count) default: name
        - order: Orden (asc, desc) default: asc
        - filter: Filtrar por cantidad de productos (all, with_products, without_products)
    """
    try:
        # Parámetros de consulta
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'name')
        order = request.args.get('order', 'asc')
        filter_by = request.args.get('filter', 'all')

        # Query base
        query = Category.query

        # Aplicar búsqueda
        if search:
            query = query.filter(Category.name.ilike(f'%{search}%'))

        # Obtener resultados
        categories = query.all()

        # Convertir a diccionarios con contador de productos
        categories_data = [cat.to_dict(include_product_count=True) for cat in categories]

        # Aplicar filtro por cantidad de productos
        if filter_by == 'with_products':
            categories_data = [cat for cat in categories_data if cat['product_count'] > 0]
        elif filter_by == 'without_products':
            categories_data = [cat for cat in categories_data if cat['product_count'] == 0]

        # Ordenamiento
        if sort_by == 'name':
            categories_data.sort(
                key=lambda x: x['name'].lower(),
                reverse=(order == 'desc')
            )
        elif sort_by == 'product_count':
            categories_data.sort(
                key=lambda x: x['product_count'],
                reverse=(order == 'desc')
            )

        return jsonify({
            'success': True,
            'data': categories_data,
            'total': len(categories_data)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al obtener categorías',
                'details': str(e)
            }
        }), 500


@categories_bp.route('', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def create_category():
    """
    POST /api/categories
    Crea una nueva categoría

    Body:
        - name: Nombre de la categoría (requerido, único)
        - description: Descripción (opcional)
        - color: Color en formato hex (opcional)
        - icon: Nombre del icono (opcional)
    """
    try:
        # Validar datos de entrada
        data = category_create_schema.load(request.json)

        # Validar unicidad del nombre (case-insensitive)
        if not Category.validate_name_unique(data['name']):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'DUPLICATE_NAME',
                    'message': 'Esta categoría ya existe',
                    'field': 'name'
                }
            }), 400

        # Crear nueva categoría
        new_category = Category(
            name=data['name'].strip(),
            description=data.get('description', '').strip() if data.get('description') else None,
            color=data.get('color'),
            icon=data.get('icon')
        )

        db.session.add(new_category)
        db.session.commit()

        # Retornar categoría creada
        return jsonify({
            'success': True,
            'data': new_category.to_dict(include_product_count=True),
            'message': 'Categoría creada correctamente'
        }), 201

    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Error de validación',
                'details': e.messages
            }
        }), 400

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'DUPLICATE_NAME',
                'message': 'Esta categoría ya existe'
            }
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al crear categoría',
                'details': str(e)
            }
        }), 500


@categories_bp.route('/<category_id>', methods=['GET'])
@jwt_required()
def get_category(category_id):
    """
    GET /api/categories/:id
    Obtiene una categoría específica por ID
    """
    try:
        category = Category.query.get(category_id)

        if not category:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Categoría no encontrada'
                }
            }), 404

        return jsonify({
            'success': True,
            'data': category.to_dict(include_product_count=True)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al obtener categoría',
                'details': str(e)
            }
        }), 500


@categories_bp.route('/<category_id>', methods=['PUT'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def update_category(category_id):
    """
    PUT /api/categories/:id
    Actualiza una categoría existente
    """
    try:
        category = Category.query.get(category_id)

        if not category:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Categoría no encontrada'
                }
            }), 404

        # Validar datos de entrada
        data = category_update_schema.load(request.json)

        # Si se actualiza el nombre, validar unicidad
        if 'name' in data and data['name']:
            if not Category.validate_name_unique(data['name'], exclude_id=category_id):
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'DUPLICATE_NAME',
                        'message': 'Este nombre ya está en uso',
                        'field': 'name'
                    }
                }), 400

            category.name = data['name'].strip()

        # Actualizar otros campos
        if 'description' in data:
            category.description = data['description'].strip() if data['description'] else None

        if 'color' in data:
            category.color = data['color']

        if 'icon' in data:
            category.icon = data['icon']

        db.session.commit()

        return jsonify({
            'success': True,
            'data': category.to_dict(include_product_count=True),
            'message': 'Categoría actualizada correctamente'
        }), 200

    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Error de validación',
                'details': e.messages
            }
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al actualizar categoría',
                'details': str(e)
            }
        }), 500


@categories_bp.route('/<category_id>', methods=['DELETE'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def delete_category(category_id):
    """
    DELETE /api/categories/:id
    Elimina una categoría si no tiene productos asignados
    """
    try:
        category = Category.query.get(category_id)

        if not category:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Categoría no encontrada'
                }
            }), 404

        # Verificar si es categoría por defecto
        if category.is_default:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'CANNOT_DELETE_DEFAULT',
                    'message': 'No se puede eliminar la categoría por defecto'
                }
            }), 400

        # Verificar si tiene productos asignados
        product_count = category.products.count()
        if product_count > 0:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'HAS_PRODUCTS',
                    'message': f'No se puede eliminar esta categoría porque tiene {product_count} productos asignados',
                    'product_count': product_count
                }
            }), 400

        # Eliminar categoría
        db.session.delete(category)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Categoría eliminada correctamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al eliminar categoría',
                'details': str(e)
            }
        }), 500
