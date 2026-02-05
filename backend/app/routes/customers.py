"""
Rutas API para gestión de Clientes
US-CUST-001: Registrar Nuevo Cliente
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.customer import Customer
from app.schemas.customer_schema import (
    customer_create_schema,
    customer_response_schema,
    customers_response_schema
)
from app.utils.decorators import require_role
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')


@customers_bp.route('', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas', 'Gerente de Almacén'])
def create_customer():
    """
    POST /api/customers
    CA-9: Crea un nuevo cliente

    Body:
        - full_name: Nombre completo (requerido)
        - email: Email (requerido, único)
        - phone: Teléfono principal (requerido)
        - secondary_phone: Teléfono secundario (opcional)
        - address_street: Dirección (requerido)
        - address_city: Ciudad (requerido)
        - address_postal_code: Código postal (requerido)
        - address_country: País (opcional, default: México)
        - notes: Notas (opcional)
    """
    try:
        # Validar datos de entrada
        data = customer_create_schema.load(request.json)

        # CA-5: Validar unicidad del email
        if not Customer.validate_email_unique(data['email']):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'DUPLICATE_EMAIL',
                    'message': 'Este email ya está registrado',
                    'field': 'email'
                }
            }), 400

        # Crear nuevo cliente (CA-6: timestamp automático, CA-7: estado activo)
        new_customer = Customer(
            full_name=data['full_name'].strip(),
            email=data['email'].strip().lower(),
            phone=data['phone'].strip(),
            secondary_phone=data.get('secondary_phone', '').strip() if data.get('secondary_phone') else None,
            address_street=data['address_street'].strip(),
            address_city=data['address_city'].strip(),
            address_postal_code=data['address_postal_code'].strip(),
            address_country=data.get('address_country', 'México').strip(),
            notes=data.get('notes', '').strip() if data.get('notes') else None,
        )

        db.session.add(new_customer)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': new_customer.to_dict(),
            'message': f'Cliente {new_customer.full_name} registrado correctamente'
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
                'code': 'DUPLICATE_EMAIL',
                'message': 'Este email ya está registrado'
            }
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al registrar cliente',
                'details': str(e)
            }
        }), 500


@customers_bp.route('/check-email', methods=['GET'])
@jwt_required()
def check_email():
    """
    GET /api/customers/check-email?email=...
    CA-5: Validar que el email no esté registrado

    Query params:
        - email: Email a verificar
        - exclude_id: ID de cliente a excluir (para edición)
    """
    try:
        email = request.args.get('email', '').strip()
        exclude_id = request.args.get('exclude_id', None)

        if not email:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'El email es requerido'
                }
            }), 400

        is_available = Customer.validate_email_unique(email, exclude_id=exclude_id)

        result = {
            'success': True,
            'data': {
                'email': email,
                'available': is_available
            }
        }

        # Si el email ya existe, incluir info del cliente existente
        if not is_available:
            existing = Customer.query.filter(db.func.lower(Customer.email) == email.lower()).first()
            if existing:
                result['data']['existing_customer'] = {
                    'id': existing.id,
                    'full_name': existing.full_name
                }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al verificar email',
                'details': str(e)
            }
        }), 500


@customers_bp.route('', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas', 'Gerente de Almacén'])
def get_customers():
    """
    GET /api/customers
    Lista clientes con paginación, búsqueda y filtros

    Query params:
        - page: Número de página (default: 1)
        - limit: Resultados por página (default: 20)
        - search: Buscar por nombre, email o teléfono
        - is_active: Filtrar por estado (true/false)
        - sort_by: Campo para ordenar (full_name, email, created_at) default: full_name
        - order: Orden (asc, desc) default: asc
    """
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', '').strip()
        is_active = request.args.get('is_active', None)
        sort_by = request.args.get('sort_by', 'full_name')
        order = request.args.get('order', 'asc')

        query = Customer.query

        # Filtro por estado activo
        if is_active is not None:
            query = query.filter(Customer.is_active == (is_active.lower() == 'true'))

        # Búsqueda
        if search:
            search_filter = f'%{search}%'
            query = query.filter(
                db.or_(
                    Customer.full_name.ilike(search_filter),
                    Customer.email.ilike(search_filter),
                    Customer.phone.ilike(search_filter),
                )
            )

        # Ordenamiento
        sort_column = getattr(Customer, sort_by, Customer.full_name)
        if order == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Paginación
        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        customers = pagination.items

        return jsonify({
            'success': True,
            'data': [c.to_dict() for c in customers],
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al obtener clientes',
                'details': str(e)
            }
        }), 500


@customers_bp.route('/<customer_id>', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas', 'Gerente de Almacén'])
def get_customer(customer_id):
    """
    GET /api/customers/:id
    Obtiene un cliente específico por ID
    """
    try:
        customer = Customer.query.get(customer_id)

        if not customer:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Cliente no encontrado'
                }
            }), 404

        return jsonify({
            'success': True,
            'data': customer.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al obtener cliente',
                'details': str(e)
            }
        }), 500
