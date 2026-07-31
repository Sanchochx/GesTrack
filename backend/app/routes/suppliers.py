"""
Rutas API para gestión de Proveedores
US-SUPP-001: Registrar Proveedor
US-SUPP-002: Listar Proveedores
US-SUPP-003: Ver Perfil del Proveedor
US-SUPP-004: Editar Proveedor
US-SUPP-012: Historial de Órdenes por Proveedor
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.schemas.supplier_schema import (
    supplier_create_schema,
    supplier_update_schema,
    supplier_response_schema,
)
from app.services.supplier_service import SupplierService
from app.services.purchase_order_service import PurchaseOrderService, PURCHASE_ORDER_STATUSES
from app.schemas.supplier_product_schema import supplier_product_link_schema, supplier_product_update_schema
from app.utils.decorators import require_role
from app.utils.export_helper import ExportHelper
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from app import db

suppliers_bp = Blueprint('suppliers', __name__, url_prefix='/api/suppliers')


def _parse_date_range():
    """US-SUPP-012 CA-6: Parsea date_from/date_to de los query params (formato YYYY-MM-DD)"""
    date_from_str = request.args.get('date_from')
    date_to_str = request.args.get('date_to')

    date_from = datetime.strptime(date_from_str, '%Y-%m-%d') if date_from_str else None
    # date_to es inclusivo: se compara con el día siguiente
    date_to = (datetime.strptime(date_to_str, '%Y-%m-%d') + timedelta(days=1)) if date_to_str else None

    return date_from, date_to


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
        - search: US-SUPP-013 CA-1 — búsqueda por nombre de empresa o email (opcional)
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        sort_by = request.args.get('sort_by', 'company_name')
        order = request.args.get('order', 'asc')
        search = request.args.get('search') or None

        pagination = SupplierService.list_suppliers(
            page=page, per_page=per_page, sort_by=sort_by, order=order, search=search
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
    """
    try:
        supplier = SupplierService.get_supplier_by_id(supplier_id)
        if not supplier:
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Proveedor no encontrado'}
            }), 404

        data = supplier_response_schema.dump(supplier)

        metrics = PurchaseOrderService.get_supplier_purchase_metrics(supplier_id)
        data['total_orders'] = metrics['total_orders']
        data['total_purchases'] = metrics['total_purchases']
        data['fulfillment_rate'] = metrics['fulfillment_rate']
        data['last_order_date'] = metrics['last_order_date']

        recent_pagination = PurchaseOrderService.get_supplier_purchase_history(
            supplier_id, page=1, per_page=5
        )
        data['recent_orders'] = [
            {
                'id': order.id,
                'order_number': order.order_number,
                'order_date': order.created_at.isoformat() if order.created_at else None,
                'status': order.status,
                'total': float(order.total) if order.total else 0.0,
            }
            for order in recent_pagination.items
        ]

        return jsonify({'success': True, 'data': data}), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': str(e)
            }
        }), 500


@suppliers_bp.route('/<supplier_id>/purchase-orders', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def get_supplier_purchase_history(supplier_id):
    """
    GET /api/suppliers/:id/purchase-orders
    US-SUPP-012: Historial de órdenes de compra de un proveedor, con métricas
    de total de compras y tasa de cumplimiento.

    Query params:
        - page, per_page: paginación (default 1, 20)
        - sort_order: 'asc' o 'desc' sobre fecha (default 'desc')
        - status: Filtrar por estado (opcional)
        - date_from, date_to: Rango de fechas YYYY-MM-DD (opcional)
    """
    try:
        supplier = SupplierService.get_supplier_by_id(supplier_id)
        if not supplier:
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Proveedor no encontrado'}
            }), 404

        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        sort_order = request.args.get('sort_order', 'desc')
        status = request.args.get('status') or None
        if status and status not in PURCHASE_ORDER_STATUSES:
            return jsonify({
                'success': False,
                'error': {'code': 'VALIDATION_ERROR', 'message': 'Estado inválido'}
            }), 400

        date_from, date_to = _parse_date_range()

        pagination = PurchaseOrderService.get_supplier_purchase_history(
            supplier_id, page=page, per_page=per_page, sort_order=sort_order,
            status=status, date_from=date_from, date_to=date_to
        )
        metrics = PurchaseOrderService.get_supplier_purchase_metrics(
            supplier_id, status=status, date_from=date_from, date_to=date_to
        )

        orders_data = [
            {
                'id': order.id,
                'order_number': order.order_number,
                'created_at': order.created_at.isoformat() if order.created_at else None,
                'status': order.status,
                'items_count': len(order.items),
                'expected_delivery_date': order.expected_delivery_date.isoformat() if order.expected_delivery_date else None,
                'received_at': order.received_at.isoformat() if order.received_at else None,
                'total': float(order.total) if order.total else 0.0,
            }
            for order in pagination.items
        ]

        return jsonify({
            'success': True,
            'data': orders_data,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
            },
            'metrics': metrics,
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': str(e)
            }
        }), 500


@suppliers_bp.route('/<supplier_id>/purchase-orders/export', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def export_supplier_purchase_history(supplier_id):
    """
    GET /api/suppliers/:id/purchase-orders/export
    US-SUPP-012 CA-8: Exporta el historial de órdenes de compra de un proveedor a CSV/Excel.

    Query params:
        - format: 'csv' o 'excel' (default 'csv')
        - status, date_from, date_to: mismos filtros que el listado
    """
    try:
        supplier = SupplierService.get_supplier_by_id(supplier_id)
        if not supplier:
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Proveedor no encontrado'}
            }), 404

        export_format = request.args.get('format', 'csv').lower()
        status = request.args.get('status') or None
        date_from, date_to = _parse_date_range()

        orders = PurchaseOrderService.get_supplier_purchase_history_all(
            supplier_id, status=status, date_from=date_from, date_to=date_to
        )
        orders_data = [
            {
                'order_number': order.order_number,
                'created_at': order.created_at,
                'status': order.status,
                'items_count': len(order.items),
                'expected_delivery_date': order.expected_delivery_date,
                'received_at': order.received_at,
                'total': float(order.total) if order.total else 0.0,
            }
            for order in orders
        ]

        if export_format == 'excel':
            return ExportHelper.export_supplier_purchase_history_to_excel(orders_data)
        return ExportHelper.export_supplier_purchase_history_to_csv(orders_data)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': str(e)
            }
        }), 500


@suppliers_bp.route('/<supplier_id>/products', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def list_supplier_products(supplier_id):
    """
    GET /api/suppliers/:id/products
    US-SUPP-014 CA-1/CA-4: Lista los productos que provee un proveedor, con precio
    preferencial, indicador de preferido y último precio de compra.
    """
    try:
        products = SupplierService.list_supplier_products(supplier_id)
        if products is None:
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Proveedor no encontrado'}
            }), 404

        return jsonify({'success': True, 'data': products}), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@suppliers_bp.route('/<supplier_id>/products', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def link_supplier_product(supplier_id):
    """
    POST /api/suppliers/:id/products
    US-SUPP-014 CA-2/CA-3/CA-5: Vincula un producto existente a un proveedor.

    Body:
        - product_id: ID del producto (requerido)
        - preferential_price: Precio preferencial acordado (opcional)
        - is_preferred: Marcar como proveedor preferido de este producto (opcional, default false)
    """
    try:
        data = supplier_product_link_schema.load(request.json)
        link = SupplierService.link_product(supplier_id, data)

        last_price = SupplierService.get_last_purchase_price(supplier_id, link.product_id)
        return jsonify({
            'success': True,
            'data': link.to_dict(last_purchase_price=last_price),
            'message': 'Producto vinculado al proveedor correctamente'
        }), 201

    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': {'code': 'VALIDATION_ERROR', 'message': 'Error de validación', 'details': e.messages}
        }), 400

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@suppliers_bp.route('/<supplier_id>/products/<product_id>', methods=['PUT'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def update_supplier_product(supplier_id, product_id):
    """
    PUT /api/suppliers/:id/products/:product_id
    US-SUPP-014 CA-3/CA-5: Actualiza el precio preferencial y/o el indicador de
    proveedor preferido de un producto vinculado.

    Body:
        - preferential_price: Precio preferencial acordado (opcional)
        - is_preferred: Marcar/desmarcar como proveedor preferido (opcional)
    """
    try:
        data = supplier_product_update_schema.load(request.json or {})
        link = SupplierService.update_supplier_product(supplier_id, product_id, data)

        if not link:
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Este producto no está vinculado a este proveedor'}
            }), 404

        last_price = SupplierService.get_last_purchase_price(supplier_id, product_id)
        return jsonify({
            'success': True,
            'data': link.to_dict(last_purchase_price=last_price),
            'message': 'Vínculo actualizado correctamente'
        }), 200

    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': {'code': 'VALIDATION_ERROR', 'message': 'Error de validación', 'details': e.messages}
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@suppliers_bp.route('/<supplier_id>/products/<product_id>', methods=['DELETE'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def unlink_supplier_product(supplier_id, product_id):
    """
    DELETE /api/suppliers/:id/products/:product_id
    US-SUPP-014: Elimina el vínculo entre un proveedor y un producto.
    """
    try:
        removed = SupplierService.unlink_product(supplier_id, product_id)
        if not removed:
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Este producto no está vinculado a este proveedor'}
            }), 404

        return jsonify({'success': True, 'message': 'Producto desvinculado del proveedor'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
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
