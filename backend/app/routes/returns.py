"""
Rutas API para gestión de Devoluciones
US-ORD-011: Procesamiento de Devoluciones
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.return_service import ReturnService
from app.services.stock_service import StockUpdateError
from app.schemas.return_schema import return_create_schema, return_status_update_schema
from app.utils.decorators import require_role
from app.models.order import Order
from app.models.return_order import Return
from marshmallow import ValidationError

returns_bp = Blueprint('returns', __name__, url_prefix='/api')


@returns_bp.route('/orders/<string:order_id>/returns', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas', 'Gerente de Almacén'])
def list_order_returns(order_id):
    """
    GET /api/orders/:id/returns
    CA-10: Lista las devoluciones asociadas a un pedido.
    """
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Pedido no encontrado'}
            }), 404

        returns = ReturnService.list_order_returns(order_id)
        eligibility = ReturnService.get_eligibility(order)

        return jsonify({
            'success': True,
            'data': [r.to_dict() for r in returns],
            'eligibility': eligibility,
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'SERVER_ERROR', 'message': 'Error al listar devoluciones', 'details': str(e)}
        }), 500


@returns_bp.route('/orders/<string:order_id>/returns', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas', 'Gerente de Almacén'])
def create_return(order_id):
    """
    POST /api/orders/:id/returns
    CA-2 a CA-6: Crea una devolución para un pedido entregado.

    Body:
        - items: Lista de [{product_id, quantity, item_reason}] (requerido)
        - reason: Motivo de la devolución (requerido, de lista predefinida)
        - reason_detail: Detalle si reason es "Otro" (requerido en ese caso, max 300 chars)
        - notes: Notas adicionales (opcional, max 500 chars)
    """
    try:
        data = return_create_schema.load(request.get_json() or {})
        current_user_id = get_jwt_identity()

        return_obj = ReturnService.create_return(order_id, data, current_user_id)

        return jsonify({
            'success': True,
            'data': return_obj.to_dict(),
            'message': f'Devolución {return_obj.return_number} creada exitosamente'
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

    except StockUpdateError as e:
        return jsonify({
            'success': False,
            'error': {'code': 'STOCK_ERROR', 'message': str(e)}
        }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'SERVER_ERROR', 'message': 'Error al crear devolución', 'details': str(e)}
        }), 500


@returns_bp.route('/returns/<string:return_id>/status', methods=['PATCH'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def update_return_status(return_id):
    """
    PATCH /api/returns/:id/status
    CA-7, CA-8, CA-9: Aprueba o rechaza una devolución.

    Body:
        - status: "Aprobada" o "Rechazada" (requerido)
        - refund_method: Método de compensación (requerido si status es "Aprobada")
        - refund_reference: Referencia del reembolso/nota de crédito (opcional)
    """
    try:
        data = return_status_update_schema.load(request.get_json() or {})
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')

        return_obj = ReturnService.update_status(return_id, data, current_user_id, user_role)

        return jsonify({
            'success': True,
            'data': return_obj.to_dict(),
            'message': f'Devolución {return_obj.return_number} actualizada a "{return_obj.status}"'
        }), 200

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

    except StockUpdateError as e:
        return jsonify({
            'success': False,
            'error': {'code': 'STOCK_ERROR', 'message': str(e)}
        }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'SERVER_ERROR', 'message': 'Error al procesar devolución', 'details': str(e)}
        }), 500


@returns_bp.route('/returns', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas', 'Gerente de Almacén'])
def list_returns():
    """
    GET /api/returns
    CA-11: Lista global de devoluciones con filtros y paginación.

    Query params:
        - page, per_page
        - status: Filtrar por estado
        - customer_id: Filtrar por cliente
        - date_from, date_to: Rango de fechas (YYYY-MM-DD)
    """
    try:
        from app.models.customer import Customer
        from datetime import datetime, timezone

        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        status_filter = request.args.get('status', '').strip()
        customer_id_filter = request.args.get('customer_id', '').strip()
        date_from_raw = request.args.get('date_from', '').strip()
        date_to_raw = request.args.get('date_to', '').strip()

        query = Return.query.join(Order, Order.id == Return.order_id)

        if status_filter:
            query = query.filter(Return.status == status_filter)
        if customer_id_filter:
            query = query.filter(Order.customer_id == customer_id_filter)
        if date_from_raw:
            try:
                date_from = datetime.strptime(date_from_raw, '%Y-%m-%d').replace(tzinfo=timezone.utc)
                query = query.filter(Return.created_at >= date_from)
            except ValueError:
                pass
        if date_to_raw:
            try:
                date_to = datetime.strptime(date_to_raw, '%Y-%m-%d').replace(
                    hour=23, minute=59, second=59, tzinfo=timezone.utc
                )
                query = query.filter(Return.created_at <= date_to)
            except ValueError:
                pass

        query = query.order_by(Return.created_at.desc())
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'success': True,
            'data': [r.to_dict(include_order=True) for r in paginated.items],
            'pagination': {
                'page': paginated.page,
                'per_page': paginated.per_page,
                'total': paginated.total,
                'pages': paginated.pages,
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'SERVER_ERROR', 'message': 'Error al listar devoluciones', 'details': str(e)}
        }), 500
