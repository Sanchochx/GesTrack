"""
Rutas API para gestión de stock en tiempo real

US-INV-001: Seguimiento de Stock en Tiempo Real
- CA-3: Sincronización en Tiempo Real (WebSockets)
- CA-4: Timestamp de Última Actualización
- CA-5: Manejo de Concurrencia
- CA-6: Vistas Actualizadas
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, socketio
from app.models.product import Product
from app.services.stock_service import StockService, StockUpdateError, ConcurrencyError, InsufficientStockError
from flask_socketio import emit

stock_bp = Blueprint('stock', __name__, url_prefix='/api/stock')


@stock_bp.route('/update', methods=['POST'])
@jwt_required()
def update_stock():
    """
    Actualiza el stock de un producto con optimistic locking (CA-5)

    Body:
        {
            "product_id": "uuid",
            "quantity_change": 10,  # positivo para incremento, negativo para decremento
            "movement_type": "Entrada",  # "Entrada", "Salida", "Ajuste Manual", etc.
            "reason": "Compra a proveedor",
            "reference": "PO-12345",
            "notes": "Notas opcionales",
            "expected_version": 5  # opcional, para optimistic locking
        }

    Returns:
        {
            "success": true,
            "data": {
                "product": {...},
                "movement": {...}
            }
        }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validar campos requeridos
        if not data.get('product_id'):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'MISSING_PRODUCT_ID',
                    'message': 'El ID del producto es requerido'
                }
            }), 400

        if data.get('quantity_change') is None:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'MISSING_QUANTITY',
                    'message': 'La cantidad del cambio es requerida'
                }
            }), 400

        if not data.get('movement_type'):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'MISSING_MOVEMENT_TYPE',
                    'message': 'El tipo de movimiento es requerido'
                }
            }), 400

        # Actualizar stock usando el servicio
        product, movement = StockService.update_stock(
            product_id=data['product_id'],
            quantity_change=data['quantity_change'],
            user_id=current_user_id,
            movement_type=data['movement_type'],
            reason=data.get('reason'),
            reference=data.get('reference'),
            notes=data.get('notes'),
            expected_version=data.get('expected_version')
        )

        # CA-3: Emitir evento WebSocket para actualización en tiempo real
        socketio.emit('stock_updated', {
            'product_id': product.id,
            'sku': product.sku,
            'name': product.name,
            'stock_quantity': product.stock_quantity,
            'stock_last_updated': product.stock_last_updated.isoformat() if product.stock_last_updated else None,
            'last_updated_by_name': product.last_updated_by.full_name if product.last_updated_by else None,
            'version': product.version,
            'movement_type': movement.movement_type,
            'quantity_change': movement.quantity
        }, namespace='/', broadcast=True)

        return jsonify({
            'success': True,
            'data': {
                'product': product.to_dict(),
                'movement': movement.to_dict()
            },
            'message': 'Stock actualizado correctamente'
        }), 200

    except ConcurrencyError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'CONCURRENCY_ERROR',
                'message': str(e),
                'retry': True
            }
        }), 409

    except InsufficientStockError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INSUFFICIENT_STOCK',
                'message': str(e)
            }
        }), 400

    except StockUpdateError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'STOCK_UPDATE_ERROR',
                'message': str(e)
            }
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error inesperado: {str(e)}'
            }
        }), 500


@stock_bp.route('/adjust', methods=['POST'])
@jwt_required()
def adjust_stock():
    """
    Ajusta manualmente el stock de un producto a una cantidad específica

    Body:
        {
            "product_id": "uuid",
            "new_stock_quantity": 50,
            "reason": "Inventario físico",
            "notes": "Ajuste por conteo manual"
        }

    Returns:
        {
            "success": true,
            "data": {
                "product": {...},
                "movement": {...}
            }
        }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validar campos requeridos
        if not data.get('product_id'):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'MISSING_PRODUCT_ID',
                    'message': 'El ID del producto es requerido'
                }
            }), 400

        if data.get('new_stock_quantity') is None:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'MISSING_QUANTITY',
                    'message': 'La nueva cantidad de stock es requerida'
                }
            }), 400

        if not data.get('reason'):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'MISSING_REASON',
                    'message': 'La razón del ajuste es requerida'
                }
            }), 400

        # Ajustar stock usando el servicio
        product, movement = StockService.adjust_stock_manually(
            product_id=data['product_id'],
            new_stock_quantity=data['new_stock_quantity'],
            user_id=current_user_id,
            reason=data['reason'],
            notes=data.get('notes')
        )

        # CA-3: Emitir evento WebSocket
        socketio.emit('stock_updated', {
            'product_id': product.id,
            'sku': product.sku,
            'name': product.name,
            'stock_quantity': product.stock_quantity,
            'stock_last_updated': product.stock_last_updated.isoformat() if product.stock_last_updated else None,
            'last_updated_by_name': product.last_updated_by.full_name if product.last_updated_by else None,
            'version': product.version,
            'movement_type': 'Ajuste Manual',
            'quantity_change': movement.quantity
        }, namespace='/', broadcast=True)

        return jsonify({
            'success': True,
            'data': {
                'product': product.to_dict(),
                'movement': movement.to_dict()
            },
            'message': 'Stock ajustado correctamente'
        }), 200

    except StockUpdateError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'STOCK_UPDATE_ERROR',
                'message': str(e)
            }
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error inesperado: {str(e)}'
            }
        }), 500


@stock_bp.route('/history/<product_id>', methods=['GET'])
@jwt_required()
def get_stock_history(product_id):
    """
    Obtiene el historial de movimientos de stock de un producto (CA-4)

    Args:
        product_id: ID del producto

    Query params:
        limit: Número máximo de movimientos (default: 50)

    Returns:
        {
            "success": true,
            "data": [...]
        }
    """
    try:
        limit = request.args.get('limit', 50, type=int)

        history = StockService.get_stock_history(product_id, limit=limit)

        return jsonify({
            'success': True,
            'data': history
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener historial: {str(e)}'
            }
        }), 500


@stock_bp.route('/info/<product_id>', methods=['GET'])
@jwt_required()
def get_stock_info(product_id):
    """
    Obtiene información detallada del stock de un producto (CA-4, CA-6)

    Returns:
        {
            "success": true,
            "data": {
                "id": "...",
                "sku": "...",
                "name": "...",
                "stock_quantity": 100,
                "stock_last_updated": "2025-11-08T10:30:00",
                "last_updated_by_name": "Juan Pérez",
                "version": 5,
                "stock_status": "normal",
                "is_low_stock": false,
                "is_out_of_stock": false
            }
        }
    """
    try:
        product_info = StockService.get_product_with_stock_info(product_id)

        if not product_info:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Producto no encontrado'
                }
            }), 404

        return jsonify({
            'success': True,
            'data': product_info
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener información de stock: {str(e)}'
            }
        }), 500


# WebSocket Events (CA-3)
@socketio.on('connect')
def handle_connect():
    """
    Maneja la conexión de un cliente WebSocket
    """
    print('Cliente conectado al WebSocket de stock')
    emit('connected', {'message': 'Conectado al sistema de actualizaciones de stock en tiempo real'})


@socketio.on('disconnect')
def handle_disconnect():
    """
    Maneja la desconexión de un cliente WebSocket
    """
    print('Cliente desconectado del WebSocket de stock')


@socketio.on('subscribe_product')
def handle_subscribe_product(data):
    """
    Permite a un cliente suscribirse a actualizaciones de un producto específico

    Args:
        data: {"product_id": "uuid"}
    """
    product_id = data.get('product_id')
    if product_id:
        # En una implementación más avanzada, podrías usar rooms de SocketIO
        # para suscripciones selectivas
        emit('subscribed', {'product_id': product_id, 'message': f'Suscrito a actualizaciones del producto {product_id}'})
