"""
Rutas API para gestión de Proveedores
US-SUPP-001: Registrar Proveedor
US-SUPP-002: Listar Proveedores
US-SUPP-003: Ver Perfil del Proveedor
US-SUPP-004: Editar Proveedor
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.schemas.supplier_schema import (
    supplier_create_schema,
    supplier_update_schema,
    supplier_response_schema,
)
from app.services.supplier_service import SupplierService
from app.utils.decorators import require_role
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from app import db

suppliers_bp = Blueprint('suppliers', __name__, url_prefix='/api/suppliers')


@suppliers_bp.route('', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def list_suppliers():
    """
    GET /api/suppliers
    Lista proveedores paginados y ordenados

    Query params:
        - page: número de página (default 1)
        - per_page: proveedores por página (default 20)
        - sort_by: 'company_name' o 'created_at' (default 'company_name')
        - order: 'asc' o 'desc' (default 'asc')
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        sort_by = request.args.get('sort_by', 'company_name')
        order = request.args.get('order', 'asc')

        pagination = SupplierService.list_suppliers(
            page=page, per_page=per_page, sort_by=sort_by, order=order
        )

        suppliers_data = []
        for supplier in pagination.items:
            data = supplier_response_schema.dump(supplier)
            # CA-1/CA-4: Órdenes de compra activas/pendientes — placeholder hasta
            # implementar el modelo PurchaseOrder (US-SUPP-005 en adelante)
            data['active_orders_count'] = 0
            data['has_pending_orders'] = False
            suppliers_data.append(data)

        return jsonify({
            'success': True,
            'data': suppliers_data,
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
                'code': 'INTERNAL_ERROR',
                'message': str(e)
            }
        }), 500


@suppliers_bp.route('/<supplier_id>', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def get_supplier(supplier_id):
    """
    GET /api/suppliers/:id
    Obtiene el perfil detallado de un proveedor

    - Información de contacto, pago y categorías que provee
    - Métricas de órdenes de compra y últimas 5 órdenes
      (placeholder hasta implementar el modelo PurchaseOrder — US-SUPP-005)
    """
    try:
        supplier = SupplierService.get_supplier_by_id(supplier_id)
        if not supplier:
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Proveedor no encontrado'}
            }), 404

        data = supplier_response_schema.dump(supplier)
        # CA: métricas y órdenes recientes — placeholder hasta implementar
        # el modelo PurchaseOrder (US-SUPP-005 en adelante)
        data['total_orders'] = 0
        data['total_purchases'] = 0
        data['last_order_date'] = None
        data['recent_orders'] = []

        return jsonify({'success': True, 'data': data}), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': str(e)
            }
        }), 500


@suppliers_bp.route('', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def create_supplier():
    """
    POST /api/suppliers
    Registra un nuevo proveedor

    Body:
        - company_name: Nombre de la empresa - requerido
        - contact_name: Nombre de contacto - requerido
        - email: Correo electrónico - requerido, único
        - phone: Teléfono - requerido
        - address: Dirección - opcional
        - website: Sitio web - opcional
        - category_ids: Lista de IDs de categorías que provee - opcional
        - payment_bank: Banco - opcional
        - payment_account: Cuenta - opcional
        - payment_terms: Condiciones de pago - opcional
    """
    try:
        data = supplier_create_schema.load(request.json)
        supplier = SupplierService.create_supplier(data)

        return jsonify({
            'success': True,
            'data': supplier_response_schema.dump(supplier),
            'message': f'Proveedor {supplier.company_name} registrado correctamente'
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

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'DUPLICATE_EMAIL',
                'message': str(e),
                'field': 'email'
            }
        }), 400

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'DUPLICATE_EMAIL',
                'message': 'Este correo ya está registrado',
                'field': 'email'
            }
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': str(e)
            }
        }), 500


@suppliers_bp.route('/<supplier_id>', methods=['PUT'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def update_supplier(supplier_id):
    """
    PUT /api/suppliers/:id
    Actualiza los datos de un proveedor existente

    Body: mismos campos que POST /api/suppliers, todos opcionales
    """
    try:
        data = supplier_update_schema.load(request.json)
        supplier = SupplierService.update_supplier(supplier_id, data)

        if not supplier:
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Proveedor no encontrado'}
            }), 404

        return jsonify({
            'success': True,
            'data': supplier_response_schema.dump(supplier),
            'message': f'Proveedor {supplier.company_name} actualizado correctamente'
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

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'DUPLICATE_EMAIL',
                'message': str(e),
                'field': 'email'
            }
        }), 400

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'DUPLICATE_EMAIL',
                'message': 'Este correo ya está registrado',
                'field': 'email'
            }
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': str(e)
            }
        }), 500
