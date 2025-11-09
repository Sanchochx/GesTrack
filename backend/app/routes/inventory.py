"""
Rutas API para gestión de inventario

US-INV-002: Ajustes Manuales de Inventario
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.services.inventory_adjustment_service import (
    InventoryAdjustmentService,
    AdjustmentValidationError
)
from app.utils.constants import ADJUSTMENT_REASONS, ADJUSTMENT_TYPES
from app.utils.decorators import warehouse_manager_or_admin

inventory_bp = Blueprint('inventory', __name__, url_prefix='/api/inventory')


@inventory_bp.route('/adjustment-reasons', methods=['GET'])
@jwt_required()
def get_adjustment_reasons():
    """
    Obtiene la lista de razones predefinidas para ajustes (CA-2)

    Returns:
        {
            "success": true,
            "data": ["Conteo físico", "Producto dañado", ...]
        }
    """
    return jsonify({
        'success': True,
        'data': ADJUSTMENT_REASONS
    }), 200


@inventory_bp.route('/adjustments', methods=['POST'])
@jwt_required()
@warehouse_manager_or_admin
def create_adjustment():
    """
    Crea un ajuste manual de inventario (CA-1, CA-3, CA-4, CA-5)

    Body:
        {
            "product_id": "uuid",
            "adjustment_type": "increase" | "decrease",
            "quantity": 10,
            "reason": "Conteo físico",
            "confirmed": false  # true si ya pasó por confirmación
        }

    Returns:
        {
            "success": true,
            "data": {
                "product": {...},
                "movement": {...},
                "requires_confirmation": false,
                "value_impact": {...},
                "is_significant": false
            },
            "message": "Ajuste realizado correctamente"
        }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validar campos requeridos
        required_fields = ['product_id', 'adjustment_type', 'quantity', 'reason']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'MISSING_FIELD',
                        'message': f'El campo {field} es requerido'
                    }
                }), 400

        # Validar tipo de ajuste
        if data['adjustment_type'] not in [ADJUSTMENT_TYPES['INCREASE'], ADJUSTMENT_TYPES['DECREASE']]:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INVALID_ADJUSTMENT_TYPE',
                    'message': 'El tipo de ajuste debe ser "increase" o "decrease"'
                }
            }), 400

        # Validar cantidad
        try:
            quantity = int(data['quantity'])
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INVALID_QUANTITY',
                    'message': 'La cantidad debe ser un número entero positivo'
                }
            }), 400

        # Crear ajuste
        result = InventoryAdjustmentService.create_manual_adjustment(
            product_id=data['product_id'],
            adjustment_type=data['adjustment_type'],
            quantity=quantity,
            reason=data['reason'],
            user_id=current_user_id,
            confirmed=data.get('confirmed', False)
        )

        # Si requiere confirmación, retornar advertencia
        if result.get('requires_confirmation'):
            return jsonify({
                'success': True,
                'requires_confirmation': True,
                'data': result
            }), 200

        # Ajuste exitoso
        return jsonify({
            'success': True,
            'data': result,
            'message': f"Stock de {result['product']['name']} ajustado de {result['movement']['previous_stock']} a {result['movement']['new_stock']} unidades"
        }), 201

    except AdjustmentValidationError as e:
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
                'code': 'INTERNAL_ERROR',
                'message': f'Error inesperado: {str(e)}'
            }
        }), 500


@inventory_bp.route('/adjustments/history', methods=['GET'])
@jwt_required()
def get_adjustment_history():
    """
    Obtiene el historial de ajustes manuales

    Query params:
        product_id: Filtrar por producto (opcional)
        user_id: Filtrar por usuario (opcional)
        limit: Número máximo de resultados (default: 50)

    Returns:
        {
            "success": true,
            "data": [...]
        }
    """
    try:
        product_id = request.args.get('product_id')
        user_id = request.args.get('user_id')
        limit = request.args.get('limit', 50, type=int)

        history = InventoryAdjustmentService.get_adjustment_history(
            product_id=product_id,
            user_id=user_id,
            limit=limit
        )

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
