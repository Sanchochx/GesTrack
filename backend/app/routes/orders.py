"""
Rutas API para gestión de Pedidos
US-ORD-001: Crear Pedido
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.order_service import OrderService
from app.services.stock_service import InsufficientStockError, StockUpdateError
from app.schemas.order_schema import order_create_schema
from app.utils.decorators import require_role
from marshmallow import ValidationError

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')


@orders_bp.route('', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas', 'Gerente de Almacén'])
def create_order():
    """
    POST /api/orders
    CA-8: Crea un nuevo pedido con validación de stock y movimientos de inventario.

    Body:
        - customer_id: ID del cliente (requerido)
        - items: Lista de items [{product_id, quantity, unit_price}] (requerido)
        - tax_percentage: Porcentaje de impuesto (opcional, default 0)
        - shipping_cost: Costo de envío (opcional, default 0)
        - discount_amount: Monto de descuento (opcional, default 0)
        - discount_justification: Justificación del descuento (requerido si >20%)
        - notes: Notas del pedido (opcional, max 500 chars)
    """
    try:
        # Validar datos de entrada con Marshmallow
        data = order_create_schema.load(request.json)

        # Obtener usuario actual
        current_user_id = get_jwt_identity()

        # Crear pedido via servicio
        order = OrderService.create_order(data, current_user_id)

        return jsonify({
            'success': True,
            'data': order.to_dict(),
            'message': f'Pedido {order.order_number} creado exitosamente'
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

    except InsufficientStockError as e:
        # CA-9: Error específico de stock insuficiente
        response = {
            'success': False,
            'error': {
                'code': 'INSUFFICIENT_STOCK',
                'message': str(e),
            }
        }
        if hasattr(e, 'details'):
            response['error']['details'] = e.details
        return jsonify(response), 409

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
                'message': 'Error al crear pedido',
                'details': str(e)
            }
        }), 500


@orders_bp.route('/validate-stock', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Personal de Ventas', 'Gerente de Almacén'])
def validate_stock():
    """
    POST /api/orders/validate-stock
    CA-3: Valida disponibilidad de stock en tiempo real sin bloquear.

    Body:
        - items: Lista de [{product_id, quantity}]

    Returns:
        - available: bool (true si todos los items tienen stock)
        - items: Lista con info de disponibilidad por producto
    """
    try:
        data = request.get_json()

        if not data or 'items' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Se requiere una lista de items'
                }
            }), 400

        items = data['items']
        if not items or not isinstance(items, list):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'La lista de items no puede estar vacía'
                }
            }), 400

        result = OrderService.validate_stock_availability(items)

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'Error al validar stock',
                'details': str(e)
            }
        }), 500
