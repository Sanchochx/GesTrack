"""
Rutas API para gestión de Clientes - Facturación Electrónica Colombia (DIAN)
US-CUST-001: Registrar Nuevo Cliente
US-CUST-002: Listar Clientes
US-CUST-006: Eliminar Cliente
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.customer import Customer
from app.models.customer_deletion_audit import CustomerDeletionAudit
from app.schemas.customer_schema import (
    customer_create_schema,
    customer_response_schema,
    customers_response_schema
)
from app.utils.decorators import require_role
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, case
from datetime import datetime

ALLOWED_SORT_FIELDS = ['nombre_razon_social', 'correo', 'numero_documento', 'municipio_ciudad', 'created_at']

customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')


@customers_bp.route('', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas', 'Gerente de Almacén'])
def create_customer():
    """
    POST /api/customers
    Crea un nuevo cliente con campos para facturación electrónica colombiana

    Body:
        - tipo_documento: Tipo de documento (CC, NIT, CE, PAS, TI) - requerido
        - numero_documento: Número de documento - requerido, único
        - nombre_razon_social: Nombre o razón social - requerido
        - tipo_contribuyente: Persona Natural / Persona Jurídica - requerido
        - correo: Correo electrónico - requerido, único
        - telefono_movil: Teléfono - opcional
        - pais: País - opcional (default: Colombia)
        - departamento: Departamento - opcional
        - municipio_ciudad: Municipio/Ciudad - opcional
        - direccion: Dirección - opcional
        - regimen_fiscal: R-99-PN / R-48 - opcional
        - responsabilidad_tributaria: código DIAN - opcional
        - notes: Notas - opcional
    """
    try:
        data = customer_create_schema.load(request.json)

        # Validar unicidad del número de documento
        if not Customer.validate_numero_documento_unique(data['numero_documento']):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'DUPLICATE_DOCUMENTO',
                    'message': 'Este número de documento ya está registrado',
                    'field': 'numero_documento'
                }
            }), 400

        # Validar unicidad del correo
        if not Customer.validate_correo_unique(data['correo']):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'DUPLICATE_CORREO',
                    'message': 'Este correo ya está registrado',
                    'field': 'correo'
                }
            }), 400

        new_customer = Customer(
            tipo_documento=data['tipo_documento'],
            numero_documento=data['numero_documento'].strip(),
            nombre_razon_social=data['nombre_razon_social'].strip(),
            tipo_contribuyente=data['tipo_contribuyente'],
            correo=data['correo'].strip().lower(),
            telefono_movil=data.get('telefono_movil', '').strip() if data.get('telefono_movil') else None,
            pais=data.get('pais', 'Colombia').strip(),
            departamento=data.get('departamento', '').strip() if data.get('departamento') else None,
            municipio_ciudad=data.get('municipio_ciudad', '').strip() if data.get('municipio_ciudad') else None,
            direccion=data.get('direccion', '').strip() if data.get('direccion') else None,
            regimen_fiscal=data.get('regimen_fiscal') or None,
            responsabilidad_tributaria=data.get('responsabilidad_tributaria') or None,
            notes=data.get('notes', '').strip() if data.get('notes') else None,
        )

        db.session.add(new_customer)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': new_customer.to_dict(),
            'message': f'Cliente {new_customer.nombre_razon_social} registrado correctamente'
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
                'code': 'DUPLICATE_DOCUMENTO',
                'message': 'Este número de documento o correo ya está registrado'
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


@customers_bp.route('/check-documento', methods=['GET'])
@jwt_required()
def check_documento():
    """
    GET /api/customers/check-documento?numero_documento=...
    Validar que el número de documento no esté registrado

    Query params:
        - numero_documento: Número a verificar
        - exclude_id: ID de cliente a excluir (para edición)
    """
    try:
        numero_documento = request.args.get('numero_documento', '').strip()
        exclude_id = request.args.get('exclude_id', None)

        if not numero_documento:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'El número de documento es requerido'
                }
            }), 400

        is_available = Customer.validate_numero_documento_unique(numero_documento, exclude_id=exclude_id)

        result = {
            'success': True,
            'data': {
                'numero_documento': numero_documento,
                'available': is_available
            }
        }

        if not is_available:
            existing = Customer.query.filter(Customer.numero_documento == numero_documento).first()
            if existing:
                result['data']['existing_customer'] = {
                    'id': existing.id,
                    'nombre_razon_social': existing.nombre_razon_social
                }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al verificar número de documento',
                'details': str(e)
            }
        }), 500


@customers_bp.route('/check-correo', methods=['GET'])
@jwt_required()
def check_correo():
    """
    GET /api/customers/check-correo?correo=...
    Validar que el correo no esté registrado

    Query params:
        - correo: Correo a verificar
        - exclude_id: ID de cliente a excluir (para edición)
    """
    try:
        correo = request.args.get('correo', '').strip()
        exclude_id = request.args.get('exclude_id', None)

        if not correo:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'El correo es requerido'
                }
            }), 400

        is_available = Customer.validate_correo_unique(correo, exclude_id=exclude_id)

        result = {
            'success': True,
            'data': {
                'correo': correo,
                'available': is_available
            }
        }

        if not is_available:
            existing = Customer.query.filter(db.func.lower(Customer.correo) == correo.lower()).first()
            if existing:
                result['data']['existing_customer'] = {
                    'id': existing.id,
                    'nombre_razon_social': existing.nombre_razon_social
                }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al verificar correo',
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
        - search: Buscar por nombre, correo, número de documento o teléfono
        - is_active: Filtrar por estado (true/false)
        - sort_by: Campo para ordenar (default: nombre_razon_social)
        - order: Orden (asc, desc) default: asc
    """
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', '').strip()
        is_active = request.args.get('is_active', None)
        sort_by = request.args.get('sort_by', 'nombre_razon_social')
        order = request.args.get('order', 'asc')

        if sort_by not in ALLOWED_SORT_FIELDS:
            sort_by = 'nombre_razon_social'

        query = Customer.query

        if search:
            search_filter = f'%{search}%'
            query = query.filter(
                db.or_(
                    Customer.nombre_razon_social.ilike(search_filter),
                    Customer.correo.ilike(search_filter),
                    Customer.numero_documento.ilike(search_filter),
                    Customer.telefono_movil.ilike(search_filter),
                )
            )

        stats_query = query.with_entities(
            func.count(Customer.id).label('total'),
            func.count(case((Customer.is_active == True, 1))).label('active'),
            func.count(case((Customer.is_active == False, 1))).label('inactive'),
        ).first()

        statistics = {
            'total': stats_query.total if stats_query else 0,
            'active': stats_query.active if stats_query else 0,
            'inactive': stats_query.inactive if stats_query else 0,
            'vip': 0,
        }

        if is_active is not None:
            query = query.filter(Customer.is_active == (is_active.lower() == 'true'))

        sort_column = getattr(Customer, sort_by, Customer.nombre_razon_social)
        if order == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        customers = pagination.items

        return jsonify({
            'success': True,
            'data': [c.to_dict() for c in customers],
            'statistics': statistics,
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


@customers_bp.route('/<customer_id>', methods=['PUT'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas', 'Gerente de Almacén'])
def update_customer(customer_id):
    """
    PUT /api/customers/:id
    US-CUST-005: Actualizar información del cliente
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

        data = customer_create_schema.load(request.json)

        # Validar unicidad número de documento (excluyendo el propio)
        new_numero = data['numero_documento'].strip()
        if new_numero != customer.numero_documento:
            if not Customer.validate_numero_documento_unique(new_numero, exclude_id=customer_id):
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'DUPLICATE_DOCUMENTO',
                        'message': 'Este número de documento ya está registrado por otro cliente',
                        'field': 'numero_documento'
                    }
                }), 400

        # Validar unicidad correo (excluyendo el propio)
        new_correo = data['correo'].strip().lower()
        if new_correo != customer.correo.lower():
            if not Customer.validate_correo_unique(new_correo, exclude_id=customer_id):
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'DUPLICATE_CORREO',
                        'message': 'Este correo ya está registrado por otro cliente',
                        'field': 'correo'
                    }
                }), 400

        # Detectar cambios
        changes = []
        if data['nombre_razon_social'].strip() != customer.nombre_razon_social:
            changes.append('nombre_razon_social')
        if new_correo != customer.correo.lower():
            changes.append('correo')
        if new_numero != customer.numero_documento:
            changes.append('numero_documento')

        # Actualizar campos
        customer.tipo_documento = data['tipo_documento']
        customer.numero_documento = new_numero
        customer.nombre_razon_social = data['nombre_razon_social'].strip()
        customer.tipo_contribuyente = data['tipo_contribuyente']
        customer.correo = new_correo
        customer.telefono_movil = data.get('telefono_movil', '').strip() if data.get('telefono_movil') else None
        customer.pais = data.get('pais', 'Colombia').strip()
        customer.departamento = data.get('departamento', '').strip() if data.get('departamento') else None
        customer.municipio_ciudad = data.get('municipio_ciudad', '').strip() if data.get('municipio_ciudad') else None
        customer.direccion = data.get('direccion', '').strip() if data.get('direccion') else None
        customer.regimen_fiscal = data.get('regimen_fiscal') or None
        customer.responsabilidad_tributaria = data.get('responsabilidad_tributaria') or None
        customer.notes = data.get('notes', '').strip() if data.get('notes') else None
        customer.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'success': True,
            'data': customer.to_dict(),
            'message': f'Cliente {customer.nombre_razon_social} actualizado correctamente',
            'changes': changes
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

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'DUPLICATE_DOCUMENTO',
                'message': 'Este número de documento o correo ya está registrado por otro cliente'
            }
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al actualizar cliente',
                'details': str(e)
            }
        }), 500


@customers_bp.route('/<customer_id>/toggle-active', methods=['PATCH'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas'])
def toggle_active(customer_id):
    """
    PATCH /api/customers/:id/toggle-active
    US-CUST-002 CA-8: Activar/Inactivar cliente
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

        customer.is_active = not customer.is_active
        customer.updated_at = datetime.utcnow()
        db.session.commit()

        status_text = 'activado' if customer.is_active else 'inactivado'
        return jsonify({
            'success': True,
            'data': customer.to_dict(),
            'message': f'Cliente {customer.nombre_razon_social} {status_text} correctamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al cambiar estado del cliente',
                'details': str(e)
            }
        }), 500


@customers_bp.route('/<customer_id>', methods=['DELETE'])
@jwt_required()
@require_role(['Admin'])
def delete_customer(customer_id):
    """
    DELETE /api/customers/:id
    US-CUST-006: Eliminar cliente permanentemente

    CA-1: Solo Admin puede eliminar
    CA-2: No se puede eliminar si tiene pedidos asociados
    """
    try:
        current_user_id = get_jwt_identity()
        customer = Customer.query.get(customer_id)

        if not customer:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Cliente no encontrado'
                }
            }), 404

        orders_count = customer.to_dict().get('order_count', 0)
        if orders_count > 0:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'HAS_ORDERS',
                    'message': 'No se puede eliminar este cliente porque tiene pedidos asociados',
                    'orders_count': orders_count,
                    'suggestion': 'En su lugar, puedes inactivar el cliente'
                }
            }), 409

        data = request.get_json(silent=True) or {}
        reason = data.get('reason', '').strip() if data.get('reason') else None

        audit_record = CustomerDeletionAudit.create_audit_record(
            customer=customer,
            user_id=current_user_id,
            reason=reason
        )
        db.session.add(audit_record)

        customer_name = customer.nombre_razon_social
        customer_correo = customer.correo

        db.session.delete(customer)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Cliente {customer_name} eliminado permanentemente',
            'data': {
                'customer_id': customer_id,
                'customer_name': customer_name,
                'customer_correo': customer_correo,
                'audit_id': audit_record.id
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al eliminar cliente',
                'details': str(e)
            }
        }), 500


@customers_bp.route('/<customer_id>/can-delete', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def can_delete_customer(customer_id):
    """
    GET /api/customers/:id/can-delete
    US-CUST-006 CA-9: Verificar si un cliente puede ser eliminado
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

        orders_count = customer.to_dict().get('order_count', 0)
        can_delete = orders_count == 0

        return jsonify({
            'success': True,
            'data': {
                'customer_id': customer_id,
                'customer_name': customer.nombre_razon_social,
                'can_delete': can_delete,
                'orders_count': orders_count,
                'reason': None if can_delete else 'Este cliente tiene pedidos asociados y no puede ser eliminado',
                'suggestion': None if can_delete else 'Puedes inactivar el cliente en su lugar'
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al verificar eliminación',
                'details': str(e)
            }
        }), 500
