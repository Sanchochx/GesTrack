"""
Rutas API para gestión de inventario

US-INV-002: Ajustes Manuales de Inventario
US-INV-003: Historial de Movimientos de Stock
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.services.inventory_adjustment_service import (
    InventoryAdjustmentService,
    AdjustmentValidationError
)
from app.services.inventory_movement_service import InventoryMovementService
from app.utils.export_helper import ExportHelper
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


# ==========================================
# US-INV-003: Historial de Movimientos
# ==========================================

@inventory_bp.route('/movements', methods=['GET'])
@jwt_required()
def get_movements():
    """
    Obtiene el historial de movimientos de inventario con filtros (CA-1, CA-3)

    Query params:
        date_from: Fecha inicial (ISO format)
        date_to: Fecha final (ISO format)
        movement_type: Tipo de movimiento (puede ser lista separada por comas)
        product_id: ID del producto
        user_id: ID del usuario
        category_id: ID de categoría
        page: Número de página (default: 1)
        per_page: Registros por página (default: 50, max: 100)

    Returns:
        {
            "success": true,
            "data": {
                "movements": [...],
                "total": 100,
                "pages": 2,
                "current_page": 1,
                "per_page": 50
            }
        }
    """
    try:
        # Obtener parámetros de filtro
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        movement_type = request.args.get('movement_type')
        product_id = request.args.get('product_id')
        user_id = request.args.get('user_id')
        category_id = request.args.get('category_id')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        # Si movement_type es una lista separada por comas, convertir a lista
        if movement_type and ',' in movement_type:
            movement_type = [t.strip() for t in movement_type.split(',')]

        # Obtener movimientos
        result = InventoryMovementService.get_movements(
            date_from=date_from,
            date_to=date_to,
            movement_type=movement_type,
            product_id=product_id,
            user_id=user_id,
            category_id=category_id,
            page=page,
            per_page=per_page
        )

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener movimientos: {str(e)}'
            }
        }), 500


@inventory_bp.route('/movements/product/<product_id>', methods=['GET'])
@jwt_required()
def get_movements_by_product(product_id):
    """
    Obtiene el historial de movimientos de un producto específico (CA-4)

    Args:
        product_id: ID del producto

    Query params:
        page: Número de página (default: 1)
        per_page: Registros por página (default: 50)

    Returns:
        {
            "success": true,
            "data": {
                "movements": [...],
                "total": 50,
                "pages": 1,
                "current_page": 1,
                "per_page": 50
            }
        }
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        result = InventoryMovementService.get_movements_by_product(
            product_id=product_id,
            page=page,
            per_page=per_page
        )

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener movimientos del producto: {str(e)}'
            }
        }), 500


@inventory_bp.route('/movements/<movement_id>', methods=['GET'])
@jwt_required()
def get_movement_details(movement_id):
    """
    Obtiene detalles completos de un movimiento específico (CA-5)

    Args:
        movement_id: ID del movimiento

    Returns:
        {
            "success": true,
            "data": {...}
        }
    """
    try:
        movement = InventoryMovementService.get_movement_details(movement_id)

        if not movement:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Movimiento no encontrado'
                }
            }), 404

        return jsonify({
            'success': True,
            'data': movement
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener detalles del movimiento: {str(e)}'
            }
        }), 500


@inventory_bp.route('/movements/stock-evolution/<product_id>', methods=['GET'])
@jwt_required()
def get_stock_evolution(product_id):
    """
    Obtiene la evolución del stock de un producto para graficar (CA-4)

    Args:
        product_id: ID del producto

    Query params:
        date_from: Fecha inicial (opcional)
        date_to: Fecha final (opcional)
        limit: Máximo de puntos (default: 100)

    Returns:
        {
            "success": true,
            "data": [
                {
                    "date": "2025-11-01T10:00:00",
                    "stock": 50,
                    "movement_type": "Entrada",
                    "quantity": 20
                },
                ...
            ]
        }
    """
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        limit = request.args.get('limit', 100, type=int)

        evolution = InventoryMovementService.get_stock_evolution(
            product_id=product_id,
            date_from=date_from,
            date_to=date_to,
            limit=limit
        )

        return jsonify({
            'success': True,
            'data': evolution
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener evolución de stock: {str(e)}'
            }
        }), 500


@inventory_bp.route('/movements/export', methods=['GET'])
@jwt_required()
def export_movements():
    """
    Exporta movimientos de inventario a CSV o Excel (CA-6)

    Query params:
        format: 'csv' o 'excel' (default: 'csv')
        date_from: Fecha inicial
        date_to: Fecha final
        movement_type: Tipo de movimiento (lista separada por comas)
        product_id: ID del producto
        user_id: ID del usuario
        category_id: ID de categoría
        limit: Máximo de registros a exportar (default: 10000, max: 10000)

    Returns:
        Archivo CSV o Excel para descargar
    """
    try:
        # Obtener parámetros
        export_format = request.args.get('format', 'csv').lower()
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        movement_type = request.args.get('movement_type')
        product_id = request.args.get('product_id')
        user_id = request.args.get('user_id')
        category_id = request.args.get('category_id')
        limit = request.args.get('limit', 10000, type=int)

        # Limitar a máximo 10,000 registros (CA-6)
        limit = min(limit, 10000)

        # Si movement_type es una lista separada por comas, convertir a lista
        if movement_type and ',' in movement_type:
            movement_type = [t.strip() for t in movement_type.split(',')]

        # Obtener todos los movimientos filtrados (sin paginación)
        result = InventoryMovementService.get_movements(
            date_from=date_from,
            date_to=date_to,
            movement_type=movement_type,
            product_id=product_id,
            user_id=user_id,
            category_id=category_id,
            page=1,
            per_page=limit
        )

        movements = result['movements']

        # Exportar según formato
        if export_format == 'excel':
            return ExportHelper.export_inventory_movements_to_excel(movements)
        else:
            return ExportHelper.export_inventory_movements_to_csv(movements)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'EXPORT_ERROR',
                'message': f'Error al exportar: {str(e)}'
            }
        }), 500


@inventory_bp.route('/movements/statistics', methods=['GET'])
@jwt_required()
def get_movement_statistics():
    """
    Obtiene estadísticas de movimientos en un período

    Query params:
        date_from: Fecha inicial
        date_to: Fecha final

    Returns:
        {
            "success": true,
            "data": {
                "by_type": [
                    {
                        "movement_type": "Entrada",
                        "count": 50,
                        "total_quantity": 1000
                    },
                    ...
                ],
                "total_movements": 150,
                "total_quantity": 3000
            }
        }
    """
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')

        statistics = InventoryMovementService.get_movement_statistics(
            date_from=date_from,
            date_to=date_to
        )

        return jsonify({
            'success': True,
            'data': statistics
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener estadísticas: {str(e)}'
            }
        }), 500


@inventory_bp.route('/movements/recent', methods=['GET'])
@jwt_required()
def get_recent_movements():
    """
    Obtiene los movimientos más recientes

    Query params:
        limit: Número de movimientos (default: 10, max: 50)

    Returns:
        {
            "success": true,
            "data": [...]
        }
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)  # Máximo 50

        movements = InventoryMovementService.get_recent_movements(limit=limit)

        return jsonify({
            'success': True,
            'data': movements
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener movimientos recientes: {str(e)}'
            }
        }), 500
