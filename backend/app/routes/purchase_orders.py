"""
Rutas API para gestión de Órdenes de Compra
US-SUPP-005: Crear Orden de Compra
US-SUPP-006: Listar Órdenes de Compra
US-SUPP-007: Gestionar Estados de Orden de Compra
US-SUPP-008: Recibir Mercancía (Actualizar Inventario)
US-SUPP-010: Editar Orden de Compra
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.schemas.purchase_order_schema import (
    purchase_order_create_schema, purchase_order_receive_schema, purchase_order_update_schema
)
from app.services.purchase_order_service import PurchaseOrderService
from app.services.stock_service import StockUpdateError
from app.utils.decorators import require_role
from marshmallow import ValidationError

purchase_orders_bp = Blueprint('purchase_orders', __name__, url_prefix='/api/purchase-orders')


@purchase_orders_bp.route('', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def list_purchase_orders():
    """
    GET /api/purchase-orders
    US-SUPP-006: Lista órdenes de compra con paginación, ordenamiento y métricas.

    Query params:
        - page: Página (default 1)
        - per_page: Items por página (default 20, max 100)
        - sort_by: Columna de ordenamiento (created_at, supplier, total, status)
        - sort_order: Dirección (asc, desc) - default desc
    """
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')

        pagination, metrics = PurchaseOrderService.list_purchase_orders(
            page=page, per_page=per_page, sort_by=sort_by, sort_order=sort_order
        )

        orders_data = []
        for order in pagination.items:
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'supplier_id': order.supplier_id,
                'supplier_name': order.supplier.company_name if order.supplier else None,
                'status': order.status,
                'total': float(order.total) if order.total else 0.0,
                'expected_delivery_date': order.expected_delivery_date.isoformat() if order.expected_delivery_date else None,
                'items_count': len(order.items),
                'created_at': order.created_at.isoformat() if order.created_at else None,
            })

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
                'code': 'SERVER_ERROR',
                'message': 'Error al listar órdenes de compra',
                'details': str(e)
            }
        }), 500


@purchase_orders_bp.route('/<string:purchase_order_id>', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def get_purchase_order(purchase_order_id):
    """
    GET /api/purchase-orders/:id
    US-SUPP-008 CA-2: Obtiene una orden de compra con sus items, necesaria
    para mostrar los productos ordenados al momento de recibir mercancía.
    """
    try:
        purchase_order = PurchaseOrderService.get_purchase_order_by_id(purchase_order_id)
        if not purchase_order:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Orden de compra no encontrada'
                }
            }), 404

        return jsonify({
            'success': True,
            'data': purchase_order.to_dict(),
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al obtener la orden de compra',
                'details': str(e)
            }
        }), 500


@purchase_orders_bp.route('', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def create_purchase_order():
    """
    POST /api/purchase-orders
    CA-1 a CA-10: Crea una nueva orden de compra a un proveedor.

    Body:
        - supplier_id: ID del proveedor (requerido)
        - items: Lista de items [{product_id, quantity_ordered, unit_cost}] (requerido)
        - shipping_cost: Costo de envío (opcional, default 0)
        - expected_delivery_date: Fecha estimada de entrega (opcional, formato YYYY-MM-DD)
    """
    try:
        data = purchase_order_create_schema.load(request.json)
        current_user_id = get_jwt_identity()

        purchase_order = PurchaseOrderService.create_purchase_order(data, current_user_id)

        return jsonify({
            'success': True,
            'data': purchase_order.to_dict(),
            'message': f'Orden de compra {purchase_order.order_number} creada exitosamente'
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
                'code': 'VALIDATION_ERROR',
                'message': str(e)
            }
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al crear la orden de compra',
                'details': str(e)
            }
        }), 500


@purchase_orders_bp.route('/<string:purchase_order_id>', methods=['PUT'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def update_purchase_order(purchase_order_id):
    """
    PUT /api/purchase-orders/:id
    US-SUPP-010: Edita una orden de compra existente (solo en estado "Pendiente").

    Body:
        - supplier_id: ID del proveedor (requerido)
        - items: Lista de items [{product_id, quantity_ordered, unit_cost}] (requerido) — estado final de la orden
        - shipping_cost: Costo de envío (opcional, default 0)
        - expected_delivery_date: Fecha estimada de entrega (opcional, formato YYYY-MM-DD)
    """
    try:
        data = purchase_order_update_schema.load(request.json)
        current_user_id = get_jwt_identity()

        purchase_order, changes = PurchaseOrderService.update_purchase_order(
            purchase_order_id, data, current_user_id
        )

        return jsonify({
            'success': True,
            'data': purchase_order.to_dict(),
            'changes': changes,
            'message': f'Orden de compra {purchase_order.order_number} actualizada exitosamente'
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
                'code': 'VALIDATION_ERROR',
                'message': str(e)
            }
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al editar la orden de compra',
                'details': str(e)
            }
        }), 500


@purchase_orders_bp.route('/<string:purchase_order_id>/status', methods=['PATCH'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def update_purchase_order_status(purchase_order_id):
    """
    PATCH /api/purchase-orders/:id/status
    US-SUPP-007: Actualiza el estado de una orden de compra.

    Body:
        - status: Nuevo estado (requerido) — Pendiente, Confirmada, En Tránsito o Cancelada
        - notes: Notas del cambio (opcional)
    """
    try:
        data = request.get_json() or {}
        new_status = data.get('status')
        if not new_status:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Se requiere el campo "status"'
                }
            }), 400

        current_user_id = get_jwt_identity()
        notes = data.get('notes')

        purchase_order = PurchaseOrderService.update_status(
            purchase_order_id, new_status, current_user_id, notes
        )

        return jsonify({
            'success': True,
            'data': purchase_order.to_dict(),
            'message': f'Estado de la orden {purchase_order.order_number} actualizado a "{new_status}"'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': str(e)
            }
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al actualizar el estado de la orden de compra',
                'details': str(e)
            }
        }), 500


@purchase_orders_bp.route('/<string:purchase_order_id>/receive', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def receive_purchase_order(purchase_order_id):
    """
    POST /api/purchase-orders/:id/receive
    US-SUPP-008: Registra la recepción de mercancía de una orden de compra y actualiza el inventario.

    Body:
        - items: Lista [{item_id, quantity_received, discrepancy_reason, discrepancy_notes}] (requerido)
          discrepancy_reason es requerido si quantity_received difiere de lo solicitado
          (valores: "Faltante", "Sobrante", "Daño")
    """
    try:
        data = purchase_order_receive_schema.load(request.json)
        current_user_id = get_jwt_identity()

        purchase_order = PurchaseOrderService.receive_purchase_order(
            purchase_order_id, data['items'], current_user_id
        )

        return jsonify({
            'success': True,
            'data': purchase_order.to_dict(),
            'message': f'Mercancía de la orden {purchase_order.order_number} recibida exitosamente. El inventario ha sido actualizado.'
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
                'code': 'VALIDATION_ERROR',
                'message': str(e)
            }
        }), 400

    except StockUpdateError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'STOCK_ERROR',
                'message': str(e)
            }
        }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al registrar la recepción de mercancía',
                'details': str(e)
            }
        }), 500
