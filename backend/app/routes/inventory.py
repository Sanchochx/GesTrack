"""
Rutas API para gestión de inventario

US-INV-002: Ajustes Manuales de Inventario
US-INV-003: Historial de Movimientos de Stock
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.category import Category
from app.services.inventory_adjustment_service import (
    InventoryAdjustmentService,
    AdjustmentValidationError
)
from app.services.inventory_movement_service import InventoryMovementService
from app.services.reorder_point_service import ReorderPointService
from app.services.inventory_value_service import InventoryValueService
from app.services.inventory_category_service import InventoryCategoryService
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


# ===================================================================
# US-INV-004: Configuración de Puntos de Reorden
# ===================================================================

@inventory_bp.route('/reorder-point/suggest/<product_id>', methods=['GET'])
@jwt_required()
def suggest_reorder_point(product_id):
    """
    US-INV-004 CA-5: Calcular sugerencia inteligente de punto de reorden

    Query params:
        lead_time_days: Días de reabastecimiento (default: 7)
        safety_stock_days: Días de stock de seguridad (default: 3)

    Returns:
        {
            "success": true,
            "data": {
                "suggested_reorder_point": 25,
                "average_daily_sales": 2.5,
                "lead_time_days": 7,
                "safety_stock": 8,
                "calculation_details": "...",
                "current_reorder_point": 10
            }
        }
    """
    try:
        lead_time_days = request.args.get('lead_time_days', 7, type=int)
        safety_stock_days = request.args.get('safety_stock_days', 3, type=int)

        suggestion = ReorderPointService.calculate_suggested_reorder_point(
            product_id=product_id,
            lead_time_days=lead_time_days,
            safety_stock_days=safety_stock_days
        )

        if not suggestion:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'PRODUCT_NOT_FOUND',
                    'message': 'Producto no encontrado'
                }
            }), 404

        return jsonify({
            'success': True,
            'data': suggestion
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al calcular sugerencia: {str(e)}'
            }
        }), 500


@inventory_bp.route('/reorder-point/bulk-update', methods=['POST'])
@jwt_required()
@warehouse_manager_or_admin
def bulk_update_reorder_points():
    """
    US-INV-004 CA-4: Actualizar puntos de reorden masivamente por categoría

    Body:
        {
            "category_id": "uuid",
            "reorder_point": 20,
            "overwrite_existing": true
        }

    Returns:
        {
            "success": true,
            "data": {
                "products_updated": 15,
                "products_skipped": 2,
                "updated_products": [...],
                "skipped_products": [...]
            },
            "message": "Puntos de reorden actualizados correctamente"
        }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validar campos requeridos
        if 'category_id' not in data or 'reorder_point' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'MISSING_FIELD',
                    'message': 'Los campos category_id y reorder_point son requeridos'
                }
            }), 400

        # Validar punto de reorden
        validation = ReorderPointService.validate_reorder_point(data['reorder_point'])
        if not validation['valid']:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INVALID_REORDER_POINT',
                    'message': validation['error']
                }
            }), 400

        # Actualizar
        result = ReorderPointService.bulk_update_reorder_points_by_category(
            category_id=data['category_id'],
            reorder_point=data['reorder_point'],
            overwrite_existing=data.get('overwrite_existing', True),
            user_id=current_user_id
        )

        if not result['success']:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'UPDATE_ERROR',
                    'message': result['error']
                }
            }), 400

        return jsonify({
            'success': True,
            'data': result,
            'message': f'Se actualizaron {result["products_updated"]} productos correctamente'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al actualizar puntos de reorden: {str(e)}'
            }
        }), 500


@inventory_bp.route('/reorder-point/preview/<category_id>', methods=['GET'])
@jwt_required()
def preview_category_products(category_id):
    """
    US-INV-004 CA-4: Obtener preview de productos de una categoría

    Returns:
        {
            "success": true,
            "data": [
                {
                    "id": "uuid",
                    "name": "Producto 1",
                    "sku": "PROD-001",
                    "current_reorder_point": 10,
                    "stock_quantity": 50,
                    "stock_status": "normal"
                },
                ...
            ]
        }
    """
    try:
        products = ReorderPointService.get_products_by_category_for_preview(category_id)

        return jsonify({
            'success': True,
            'data': products
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener preview: {str(e)}'
            }
        }), 500


@inventory_bp.route('/reorder-point/validate', methods=['POST'])
@jwt_required()
def validate_reorder_point():
    """
    US-INV-004 CA-6: Validar punto de reorden

    Body:
        {
            "reorder_point": 25,
            "stock_quantity": 15  (opcional)
        }

    Returns:
        {
            "success": true,
            "data": {
                "valid": true,
                "error": null,
                "warning": "El stock actual ya está por debajo del punto de reorden"
            }
        }
    """
    try:
        data = request.get_json()

        if 'reorder_point' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'MISSING_FIELD',
                    'message': 'El campo reorder_point es requerido'
                }
            }), 400

        validation = ReorderPointService.validate_reorder_point(
            reorder_point=data['reorder_point'],
            stock_quantity=data.get('stock_quantity')
        )

        return jsonify({
            'success': True,
            'data': validation
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al validar: {str(e)}'
            }
        }), 500


@inventory_bp.route('/reorder-point/products-below', methods=['GET'])
@jwt_required()
def get_products_below_reorder_point():
    """
    US-INV-004 CA-3, CA-7: Obtener productos en o debajo del punto de reorden

    Returns:
        {
            "success": true,
            "data": [
                {
                    "id": "uuid",
                    "name": "Producto 1",
                    "sku": "PROD-001",
                    "stock_quantity": 5,
                    "reorder_point": 10,
                    "difference": 5,
                    "stock_status": "low_stock",
                    "category": "Electrónica"
                },
                ...
            ]
        }
    """
    try:
        products = ReorderPointService.get_products_at_or_below_reorder_point()

        return jsonify({
            'success': True,
            'data': products
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener productos: {str(e)}'
            }
        }), 500


# ===================================================================
# US-INV-005: Valor Total del Inventario
# ===================================================================

@inventory_bp.route('/value/total', methods=['GET'])
@jwt_required()
def get_total_inventory_value():
    """
    US-INV-005 CA-1: Obtener el valor total del inventario

    Returns:
        {
            "success": true,
            "data": {
                "total_value": 125000.50,
                "total_products": 150,
                "total_quantity": 5000,
                "calculated_at": "2025-11-14T10:30:00",
                "formatted_value": "$125,000.50"
            }
        }
    """
    try:
        value_data = InventoryValueService.calculate_total_value()

        return jsonify({
            'success': True,
            'data': value_data
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al calcular valor del inventario: {str(e)}'
            }
        }), 500


@inventory_bp.route('/value/by-category', methods=['GET'])
@jwt_required()
def get_value_by_category():
    """
    US-INV-005 CA-3: Obtener desglose del valor por categoría

    Returns:
        {
            "success": true,
            "data": [
                {
                    "category_id": "uuid",
                    "category_name": "Electrónica",
                    "category_color": "#2196F3",
                    "category_icon": "devices",
                    "total_value": 45000.00,
                    "product_count": 50,
                    "total_quantity": 1200,
                    "percentage": 36.00,
                    "formatted_value": "$45,000.00"
                },
                ...
            ]
        }
    """
    try:
        breakdown = InventoryValueService.get_value_by_category()

        return jsonify({
            'success': True,
            'data': breakdown
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener desglose por categoría: {str(e)}'
            }
        }), 500


@inventory_bp.route('/value/evolution', methods=['GET'])
@jwt_required()
def get_value_evolution():
    """
    US-INV-005 CA-4: Obtener evolución temporal del valor del inventario

    Query params:
        period: '7d', '30d', '3m', '1y', 'custom' (default: '7d')
        date_from: Fecha inicial (para period='custom')
        date_to: Fecha final (para period='custom')

    Returns:
        {
            "success": true,
            "data": [
                {
                    "snapshot_date": "2025-11-07T00:00:00",
                    "total_value": 120000.00,
                    "total_products": 145,
                    "total_quantity": 4800,
                    "formatted_value": "$120,000.00"
                },
                ...
            ]
        }
    """
    try:
        period = request.args.get('period', '7d')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')

        evolution = InventoryValueService.get_value_evolution(
            period=period,
            date_from=date_from,
            date_to=date_to
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
                'message': f'Error al obtener evolución: {str(e)}'
            }
        }), 500


@inventory_bp.route('/value/metrics', methods=['GET'])
@jwt_required()
def get_inventory_metrics():
    """
    US-INV-005 CA-5: Obtener métricas adicionales del inventario

    Returns:
        {
            "success": true,
            "data": {
                "inventory_turnover": null,
                "days_of_inventory": null,
                "top_categories": [...],
                "stock_distribution": {
                    "out_of_stock": 10,
                    "low_stock": 25,
                    "normal_stock": 115,
                    "total": 150
                }
            }
        }
    """
    try:
        metrics = InventoryValueService.calculate_inventory_metrics()

        return jsonify({
            'success': True,
            'data': metrics
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al calcular métricas: {str(e)}'
            }
        }), 500


@inventory_bp.route('/value/top-products', methods=['GET'])
@jwt_required()
def get_top_products_by_value():
    """
    US-INV-005 CA-5: Obtener top productos por valor

    Query params:
        limit: Número de productos (default: 10, max: 50)

    Returns:
        {
            "success": true,
            "data": [
                {
                    "product_id": "uuid",
                    "sku": "PROD-001",
                    "name": "Laptop HP",
                    "cost_price": 500.00,
                    "stock_quantity": 20,
                    "total_value": 10000.00,
                    "formatted_value": "$10,000.00",
                    "category_name": "Electrónica"
                },
                ...
            ]
        }
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)  # Máximo 50

        top_products = InventoryValueService.get_top_products_by_value(limit=limit)

        return jsonify({
            'success': True,
            'data': top_products
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al obtener top productos: {str(e)}'
            }
        }), 500


@inventory_bp.route('/value/change', methods=['GET'])
@jwt_required()
def get_value_change():
    """
    US-INV-005 CA-2: Obtener cambio de valor vs período anterior

    Query params:
        period: '7d', '30d', '3m', '1y' (default: '7d')

    Returns:
        {
            "success": true,
            "data": {
                "current_value": 125000.50,
                "previous_value": 120000.00,
                "change_amount": 5000.50,
                "change_percentage": 4.17,
                "direction": "increase",
                "formatted_current": "$125,000.50",
                "formatted_previous": "$120,000.00",
                "formatted_change": "$5,000.50"
            }
        }
    """
    try:
        period = request.args.get('period', '7d')

        change = InventoryValueService.get_value_change_from_previous_period(period=period)

        return jsonify({
            'success': True,
            'data': change
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al calcular cambio de valor: {str(e)}'
            }
        }), 500


@inventory_bp.route('/value/snapshot', methods=['POST'])
@jwt_required()
@warehouse_manager_or_admin
def create_value_snapshot():
    """
    US-INV-005 CA-4: Crear snapshot manual del valor del inventario

    Body:
        {
            "trigger_reason": "manual"  (opcional)
        }

    Returns:
        {
            "success": true,
            "data": {
                "id": "uuid",
                "snapshot_date": "2025-11-14T10:30:00",
                "total_value": 125000.50,
                ...
            },
            "message": "Snapshot creado correctamente"
        }
    """
    try:
        data = request.get_json() or {}
        trigger_reason = data.get('trigger_reason', 'manual')

        snapshot = InventoryValueService.save_snapshot(trigger_reason=trigger_reason)

        return jsonify({
            'success': True,
            'data': snapshot.to_dict(),
            'message': 'Snapshot del valor del inventario creado correctamente'
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': f'Error al crear snapshot: {str(e)}'
            }
        }), 500


@inventory_bp.route('/value/export', methods=['GET'])
@jwt_required()
def export_value_report():
    """
    US-INV-005 CA-7: Exporta reporte de valor del inventario a Excel

    Query params:
        format: 'excel' o 'pdf' (default: 'excel')
        period: '7d', '30d', '3m', '1y' (para evolución histórica, default: '30d')

    Returns:
        Archivo Excel o PDF para descargar
    """
    try:
        export_format = request.args.get('format', 'excel').lower()
        period = request.args.get('period', '30d')

        # Obtener todos los datos necesarios para el reporte
        value_data = InventoryValueService.calculate_total_value()
        categories = InventoryValueService.get_value_by_category()
        top_products = InventoryValueService.get_top_products_by_value(limit=10)
        evolution = InventoryValueService.get_value_evolution(period=period)

        # Exportar según formato
        if export_format == 'pdf':
            return ExportHelper.export_inventory_value_report_to_pdf(
                value_data=value_data,
                categories=categories,
                top_products=top_products
            )
        else:  # excel (default)
            return ExportHelper.export_inventory_value_report_to_excel(
                value_data=value_data,
                categories=categories,
                top_products=top_products,
                evolution=evolution
            )

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'EXPORT_ERROR',
                'message': f'Error al exportar reporte: {str(e)}'
            }
        }), 500


# ============================================================================
# US-INV-006: Vista de Inventario por Categoría
# ============================================================================

@inventory_bp.route('/by-category', methods=['GET'])
@jwt_required()
@warehouse_manager_or_admin
def get_categories_inventory():
    """
    US-INV-006 CA-1, CA-4: Obtiene lista de categorías con estadísticas de inventario

    Query params:
        search: Búsqueda por nombre de categoría
        sort_by: Campo de ordenamiento (name, value, products, low_stock)
        sort_order: Orden (asc, desc)
        has_low_stock: true/false - Solo categorías con productos en stock bajo
        has_out_of_stock: true/false - Solo categorías con productos sin stock

    Returns:
        {
            "success": true,
            "data": [
                {
                    "category_id": "uuid",
                    "category_name": "Electrónica",
                    "category_color": "#1976d2",
                    "category_icon": "💻",
                    "total_products": 45,
                    "products_in_stock": 30,
                    "products_low_stock": 10,
                    "products_out_of_stock": 5,
                    "total_value": 125000.50,
                    "formatted_value": "$125,000.50",
                    "total_units": 250
                }
            ]
        }
    """
    try:
        # Obtener parámetros de filtrado
        filters = {}
        if request.args.get('search'):
            filters['search_term'] = request.args.get('search')
        if request.args.get('has_low_stock') == 'true':
            filters['has_low_stock'] = True
        if request.args.get('has_out_of_stock') == 'true':
            filters['has_out_of_stock'] = True

        # Parámetros de ordenamiento
        sort_by = request.args.get('sort_by', 'name')
        sort_order = request.args.get('sort_order', 'asc')

        # Obtener categorías con estadísticas
        categories = InventoryCategoryService.get_categories_with_stats(
            filters=filters,
            sort_by=sort_by,
            sort_order=sort_order
        )

        return jsonify({
            'success': True,
            'data': categories
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'CATEGORY_INVENTORY_ERROR',
                'message': f'Error al obtener inventario por categoría: {str(e)}'
            }
        }), 500


@inventory_bp.route('/by-category/<category_id>/products', methods=['GET'])
@jwt_required()
@warehouse_manager_or_admin
def get_category_products(category_id):
    """
    US-INV-006 CA-3: Obtiene productos de una categoría con detalles de inventario

    Path params:
        category_id: ID de la categoría

    Returns:
        {
            "success": true,
            "data": [
                {
                    "id": "uuid",
                    "sku": "PROD-001",
                    "name": "Producto X",
                    "stock_quantity": 50,
                    "reorder_point": 20,
                    "cost_price": 100.00,
                    "item_value": 5000.00,
                    "formatted_value": "$5,000.00",
                    "image_url": "/uploads/...",
                    "stock_status": "in_stock"
                }
            ]
        }
    """
    try:
        products = InventoryCategoryService.get_category_products(category_id)

        return jsonify({
            'success': True,
            'data': products
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'CATEGORY_NOT_FOUND',
                'message': str(e)
            }
        }), 404

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'CATEGORY_PRODUCTS_ERROR',
                'message': f'Error al obtener productos de categoría: {str(e)}'
            }
        }), 500


@inventory_bp.route('/by-category/metrics', methods=['GET'])
@jwt_required()
@warehouse_manager_or_admin
def get_category_inventory_metrics():
    """
    US-INV-006 CA-6: Obtiene métricas generales del inventario por categorías

    Returns:
        {
            "success": true,
            "data": {
                "total_categories": 10,
                "total_products": 150,
                "categories_with_low_stock": 3,
                "categories_out_of_stock": 1,
                "total_value": 500000.00,
                "formatted_value": "$500,000.00"
            }
        }
    """
    try:
        metrics = InventoryCategoryService.get_overall_metrics()

        return jsonify({
            'success': True,
            'data': metrics
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'METRICS_ERROR',
                'message': f'Error al obtener métricas: {str(e)}'
            }
        }), 500


@inventory_bp.route('/by-category/<category_id>/export', methods=['GET'])
@jwt_required()
@warehouse_manager_or_admin
def export_category_products(category_id):
    """
    US-INV-006 CA-7: Exporta productos de una categoría a Excel/CSV

    Path params:
        category_id: ID de la categoría

    Query params:
        format: 'excel' o 'csv' (default: 'excel')

    Returns:
        Archivo Excel o CSV para descargar
    """
    try:
        export_format = request.args.get('format', 'excel').lower()

        # Verificar que la categoría existe
        category = Category.query.get(category_id)
        if not category:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'CATEGORY_NOT_FOUND',
                    'message': 'Categoría no encontrada'
                }
            }), 404

        # Obtener productos usando el servicio existente
        products = InventoryCategoryService.get_category_products(category_id)

        # Definir columnas para exportación
        columns = [
            ('sku', 'SKU'),
            ('name', 'Nombre'),
            ('stock_quantity', 'Stock Actual'),
            ('reorder_point', 'Punto de Reorden'),
            ('stock_status', 'Estado'),
            ('cost_price', 'Precio Costo'),
            ('item_value', 'Valor Total')
        ]

        # Limpiar nombre de categoría para el archivo
        safe_name = category.name.replace(' ', '_').lower()[:20]
        filename_prefix = f'categoria_{safe_name}'

        # Exportar según formato
        if export_format == 'csv':
            return ExportHelper.export_to_csv(products, columns, filename_prefix)
        else:
            return ExportHelper.export_to_excel(
                products,
                columns,
                filename_prefix,
                sheet_name=f'Productos - {category.name}'
            )

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'CATEGORY_NOT_FOUND',
                'message': str(e)
            }
        }), 404

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'EXPORT_ERROR',
                'message': f'Error al exportar productos de categoría: {str(e)}'
            }
        }), 500
