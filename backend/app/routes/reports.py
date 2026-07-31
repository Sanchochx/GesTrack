"""
Rutas API para Reportes
US-REP-002: Reporte de Ventas Diarias
US-REP-003: Reporte de Ventas por Período
US-REP-004: Productos Más Vendidos
US-REP-005: Análisis de Márgenes de Ganancia
US-REP-006: Reporte de Inventario Actual
US-REP-007: Reporte de Movimientos de Inventario
US-REP-008: Reporte de Productos con Stock Bajo
US-REP-009: Reporte de Desempeño de Ventas por Vendedor
US-REP-010: Reporte de Clientes
US-REP-011: Análisis de Tendencias de Ventas
US-REP-012: Reporte de Órdenes de Compra a Proveedores
US-REP-015: Reporte de Devoluciones
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.report_service import ReportService
from app.utils.export_helper import ExportHelper
from app.utils.decorators import require_role

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

# US-REP-002: Reporte pensado para uso administrativo (vista global de ventas)
ORDER_STATUSES = ['Pendiente', 'Confirmado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado']


def _parse_report_date():
    date_raw = request.args.get('date')
    if not date_raw:
        return None, None
    try:
        return datetime.strptime(date_raw, '%Y-%m-%d').date(), None
    except ValueError:
        return None, 'Fecha inválida. Use el formato YYYY-MM-DD'


def _parse_date_arg(name):
    date_raw = request.args.get(name)
    if not date_raw:
        return None, None
    try:
        return datetime.strptime(date_raw, '%Y-%m-%d').date(), None
    except ValueError:
        return None, f'{name} inválida. Use el formato YYYY-MM-DD'


def _parse_period_filters():
    """US-REP-003: Parsea y valida los query params del reporte por período."""
    period = request.args.get('period', 'custom')
    group_by = request.args.get('group_by', 'day')
    status = request.args.get('status') or None

    start_date, error = _parse_date_arg('start_date')
    if error:
        return None, error
    end_date, error = _parse_date_arg('end_date')
    if error:
        return None, error

    if status and status not in ORDER_STATUSES:
        return None, 'Estado inválido'

    return {
        'period': period,
        'start_date': start_date,
        'end_date': end_date,
        'group_by': group_by,
        'status': status,
    }, None


def _parse_top_products_filters():
    """US-REP-004: Parsea y valida los query params del reporte de productos más vendidos."""
    period = request.args.get('period', 'monthly')
    category_id = request.args.get('category_id') or None
    sort_by = request.args.get('sort_by', 'quantity')
    status = request.args.get('status') or None

    start_date, error = _parse_date_arg('start_date')
    if error:
        return None, error
    end_date, error = _parse_date_arg('end_date')
    if error:
        return None, error

    if status and status not in ORDER_STATUSES:
        return None, 'Estado inválido'

    return {
        'period': period,
        'start_date': start_date,
        'end_date': end_date,
        'category_id': category_id,
        'sort_by': sort_by,
        'status': status,
    }, None


def _parse_margin_analysis_filters():
    """US-REP-005: Parsea y valida los query params del análisis de márgenes."""
    period = request.args.get('period', 'all')
    category_id = request.args.get('category_id') or None
    sort_by = request.args.get('sort_by', 'margin_pct')

    start_date, error = _parse_date_arg('start_date')
    if error:
        return None, error
    end_date, error = _parse_date_arg('end_date')
    if error:
        return None, error

    return {
        'period': period,
        'start_date': start_date,
        'end_date': end_date,
        'category_id': category_id,
        'sort_by': sort_by,
    }, None


INVENTORY_STOCK_STATUS_LABELS = {
    'normal': 'Normal',
    'low_stock': 'Stock Bajo',
    'out_of_stock': 'Sin Stock',
}


def _parse_inventory_report_filters():
    """US-REP-006: Parsea y valida los query params del reporte de inventario actual."""
    category_id = request.args.get('category_id') or None
    stock_status = request.args.get('stock_status') or None
    sort_by = request.args.get('sort_by', 'name')

    return {
        'category_id': category_id,
        'stock_status': stock_status,
        'sort_by': sort_by,
    }, None


def _parse_movements_report_filters():
    """US-REP-007: Parsea y valida los query params del reporte de movimientos de inventario."""
    start_date, error = _parse_date_arg('start_date')
    if error:
        return None, error
    end_date, error = _parse_date_arg('end_date')
    if error:
        return None, error

    return {
        'start_date': start_date,
        'end_date': end_date,
        'product_id': request.args.get('product_id') or None,
        'movement_type': request.args.get('movement_type') or None,
        'user_id': request.args.get('user_id') or None,
        'category_id': request.args.get('category_id') or None,
    }, None


def _parse_seller_report_filters():
    """US-REP-009: Parsea y valida los query params del reporte de ventas por vendedor."""
    period = request.args.get('period', 'monthly')

    start_date, error = _parse_date_arg('start_date')
    if error:
        return None, error
    end_date, error = _parse_date_arg('end_date')
    if error:
        return None, error

    return {
        'period': period,
        'start_date': start_date,
        'end_date': end_date,
    }, None


def _parse_customer_report_filters():
    """US-REP-010: Parsea y valida los query params del reporte de clientes."""
    period = request.args.get('period', 'monthly')
    at_risk_days = request.args.get('at_risk_days', 90, type=int)

    start_date, error = _parse_date_arg('start_date')
    if error:
        return None, error
    end_date, error = _parse_date_arg('end_date')
    if error:
        return None, error

    return {
        'period': period,
        'start_date': start_date,
        'end_date': end_date,
        'at_risk_days': at_risk_days,
    }, None


def _parse_purchase_orders_report_filters():
    """US-REP-012: Parsea y valida los query params del reporte de órdenes de compra."""
    start_date, error = _parse_date_arg('start_date')
    if error:
        return None, error
    end_date, error = _parse_date_arg('end_date')
    if error:
        return None, error

    return {
        'start_date': start_date,
        'end_date': end_date,
        'supplier_id': request.args.get('supplier_id') or None,
        'status': request.args.get('status') or None,
    }, None


def _parse_returns_report_filters():
    """US-REP-015: Parsea y valida los query params del reporte de devoluciones."""
    start_date, error = _parse_date_arg('start_date')
    if error:
        return None, error
    end_date, error = _parse_date_arg('end_date')
    if error:
        return None, error

    return {
        'start_date': start_date,
        'end_date': end_date,
        'status': request.args.get('status') or None,
    }, None


@reports_bp.route('/sales-daily', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def get_daily_sales_report():
    """
    GET /api/reports/sales-daily
    US-REP-002: Reporte de ventas del día.

    Query params:
        - date: Fecha del reporte YYYY-MM-DD (opcional, default hoy)
        - status: Filtrar por estado de pedido (opcional; sin filtro, excluye "Cancelado")
    """
    try:
        report_date, error = _parse_report_date()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        status = request.args.get('status') or None
        if status and status not in ORDER_STATUSES:
            return jsonify({
                'success': False,
                'error': {'code': 'VALIDATION_ERROR', 'message': 'Estado inválido'}
            }), 400

        data = ReportService.get_daily_sales_report(report_date=report_date, status=status)
        return jsonify({'success': True, 'data': data}), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/sales-daily/export', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def export_daily_sales_report():
    """
    GET /api/reports/sales-daily/export
    US-REP-002 CA-6: Exporta el detalle de pedidos del reporte de ventas diarias.

    Query params:
        - format: 'csv' o 'excel' (default 'csv'). 'pdf' no está implementado aún.
        - date, status: mismos filtros que el reporte
    """
    try:
        report_date, error = _parse_report_date()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        status = request.args.get('status') or None
        export_format = request.args.get('format', 'csv').lower()

        if export_format == 'pdf':
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_IMPLEMENTED', 'message': 'Exportación a PDF no implementada aún. Use Excel o CSV.'}
            }), 501

        data = ReportService.get_daily_sales_report(report_date=report_date, status=status)

        if export_format == 'excel':
            return ExportHelper.export_daily_sales_report_to_excel(data['orders'], data['date'])
        return ExportHelper.export_daily_sales_report_to_csv(data['orders'], data['date'])

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/sales-period', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def get_sales_by_period_report():
    """
    GET /api/reports/sales-period
    US-REP-003: Reporte de ventas por período personalizado.

    Query params:
        - period: 'daily' | 'weekly' | 'monthly' | 'custom' (default 'custom')
        - start_date, end_date: YYYY-MM-DD (requeridos si period='custom')
        - group_by: 'day' | 'week' | 'month' (default 'day')
        - status: Filtrar por estado de pedido (opcional; sin filtro, excluye "Cancelado")
    """
    try:
        filters, error = _parse_period_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        data = ReportService.get_sales_by_period_report(**filters)
        return jsonify({'success': True, 'data': data}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/sales-period/export', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def export_sales_by_period_report():
    """
    GET /api/reports/sales-period/export
    US-REP-003 CA-7: Exporta el detalle de pedidos del reporte de ventas por período.

    Query params:
        - format: 'csv' o 'excel' (default 'csv'). 'pdf' no está implementado aún.
        - period, start_date, end_date, group_by, status: mismos filtros que el reporte
    """
    try:
        filters, error = _parse_period_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        export_format = request.args.get('format', 'csv').lower()

        if export_format == 'pdf':
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_IMPLEMENTED', 'message': 'Exportación a PDF no implementada aún. Use Excel o CSV.'}
            }), 501

        data = ReportService.get_sales_by_period_report(**filters)

        if export_format == 'excel':
            return ExportHelper.export_sales_by_period_report_to_excel(data['orders'], data['start_date'], data['end_date'])
        return ExportHelper.export_sales_by_period_report_to_csv(data['orders'], data['start_date'], data['end_date'])

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/top-products', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def get_top_selling_products_report():
    """
    GET /api/reports/top-products
    US-REP-004: Reporte de productos más vendidos.

    Query params:
        - period: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom' (default 'monthly')
        - start_date, end_date: YYYY-MM-DD (requeridos si period='custom')
        - category_id: Filtrar por categoría (opcional)
        - sort_by: 'quantity' | 'revenue' | 'margin' (default 'quantity')
        - status: Filtrar por estado de pedido (opcional; sin filtro, excluye "Cancelado")
    """
    try:
        filters, error = _parse_top_products_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        data = ReportService.get_top_selling_products(**filters)
        return jsonify({'success': True, 'data': data}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/top-products/export', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def export_top_selling_products_report():
    """
    GET /api/reports/top-products/export
    US-REP-004 CA-8: Exporta el ranking de productos más vendidos.

    Query params:
        - format: 'csv' o 'excel' (default 'csv'). 'pdf' no está implementado aún.
        - period, start_date, end_date, category_id, sort_by, status: mismos filtros que el reporte
    """
    try:
        filters, error = _parse_top_products_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        export_format = request.args.get('format', 'csv').lower()

        if export_format == 'pdf':
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_IMPLEMENTED', 'message': 'Exportación a PDF no implementada aún. Use Excel o CSV.'}
            }), 501

        data = ReportService.get_top_selling_products(**filters)

        if export_format == 'excel':
            return ExportHelper.export_top_selling_products_to_excel(data['products'])
        return ExportHelper.export_top_selling_products_to_csv(data['products'])

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/profit-margin', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def get_profit_margin_report():
    """
    GET /api/reports/profit-margin
    US-REP-005: Análisis de márgenes de ganancia por producto.

    Query params:
        - period: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom' (default 'all')
        - start_date, end_date: YYYY-MM-DD (requeridos si period='custom')
        - category_id: Filtrar por categoría (opcional)
        - sort_by: 'margin_pct' | 'margin_dollar' | 'total_profit' (default 'margin_pct')
    """
    try:
        filters, error = _parse_margin_analysis_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        data = ReportService.get_profit_margin_analysis(**filters)
        return jsonify({'success': True, 'data': data}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/profit-margin/export', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def export_profit_margin_report():
    """
    GET /api/reports/profit-margin/export
    US-REP-005 CA-9: Exporta el análisis de márgenes de ganancia a Excel.

    Query params:
        - period, start_date, end_date, category_id, sort_by: mismos filtros que el reporte
    """
    try:
        filters, error = _parse_margin_analysis_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        data = ReportService.get_profit_margin_analysis(**filters)
        return ExportHelper.export_profit_margin_analysis_to_excel(data['products'])

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/inventory', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def get_current_inventory_report():
    """
    GET /api/reports/inventory
    US-REP-006: Reporte del estado actual del inventario.

    Query params:
        - category_id: Filtrar por categoría (opcional)
        - stock_status: 'normal' | 'low_stock' | 'out_of_stock' (opcional)
        - sort_by: 'name' | 'stock' | 'value' (default 'name')
    """
    try:
        filters, error = _parse_inventory_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        data = ReportService.get_current_inventory_report(**filters)
        return jsonify({'success': True, 'data': data}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/inventory/export', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def export_current_inventory_report():
    """
    GET /api/reports/inventory/export
    US-REP-006 CA-7: Exporta el reporte de inventario actual.

    Query params:
        - format: 'csv' o 'excel' (default 'csv')
        - category_id, stock_status, sort_by: mismos filtros que el reporte
    """
    try:
        filters, error = _parse_inventory_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        export_format = request.args.get('format', 'csv').lower()

        data = ReportService.get_current_inventory_report(**filters)
        products = [
            {**p, 'stock_status': INVENTORY_STOCK_STATUS_LABELS.get(p['stock_status'], p['stock_status'])}
            for p in data['products']
        ]

        if export_format == 'excel':
            return ExportHelper.export_current_inventory_report_to_excel(products, data['generated_at'])
        return ExportHelper.export_current_inventory_report_to_csv(products, data['generated_at'])

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/inventory-movements', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def get_inventory_movements_report():
    """
    GET /api/reports/inventory-movements
    US-REP-007: Reporte de movimientos de inventario en un período.

    Query params:
        - start_date, end_date: YYYY-MM-DD (default: últimos 30 días)
        - product_id, movement_type, user_id, category_id: filtros opcionales
    """
    try:
        filters, error = _parse_movements_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        data = ReportService.get_inventory_movements_report(**filters)
        return jsonify({'success': True, 'data': data}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/inventory-movements/export', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def export_inventory_movements_report():
    """
    GET /api/reports/inventory-movements/export
    US-REP-007 CA-7: Exporta el reporte de movimientos de inventario.

    Query params:
        - format: 'csv' o 'excel' (default 'csv')
        - start_date, end_date, product_id, movement_type, user_id, category_id: mismos filtros que el reporte
    """
    try:
        filters, error = _parse_movements_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        export_format = request.args.get('format', 'csv').lower()

        data = ReportService.get_inventory_movements_report(**filters)

        if export_format == 'excel':
            return ExportHelper.export_inventory_movements_report_to_excel(data['movements'], data['start_date'], data['end_date'])
        return ExportHelper.export_inventory_movements_report_to_csv(data['movements'], data['start_date'], data['end_date'])

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/low-stock', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def get_low_stock_report():
    """
    GET /api/reports/low-stock
    US-REP-008: Reporte de productos con stock bajo que necesitan reabastecimiento.
    """
    try:
        data = ReportService.get_low_stock_report()
        return jsonify({'success': True, 'data': data}), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/low-stock/export', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def export_low_stock_report():
    """
    GET /api/reports/low-stock/export
    US-REP-008 CA-7: Exporta el reporte de productos con stock bajo.

    Query params:
        - format: 'csv' o 'excel' (default 'csv')
    """
    try:
        export_format = request.args.get('format', 'csv').lower()

        data = ReportService.get_low_stock_report()
        products = [
            {**p, 'supplier_name': p['preferred_supplier']['supplier_name'] if p['preferred_supplier'] else 'Sin proveedor asignado'}
            for p in data['products']
        ]

        if export_format == 'excel':
            return ExportHelper.export_low_stock_report_to_excel(products)
        return ExportHelper.export_low_stock_report_to_csv(products)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/sales-by-seller', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def get_sales_by_seller_report():
    """
    GET /api/reports/sales-by-seller
    US-REP-009: Reporte de desempeño de ventas por vendedor.

    Query params:
        - period: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom' (default 'monthly')
        - start_date, end_date: YYYY-MM-DD (requeridos si period='custom')
    """
    try:
        filters, error = _parse_seller_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        data = ReportService.get_sales_by_seller_report(**filters)
        return jsonify({'success': True, 'data': data}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/sales-by-seller/export', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def export_sales_by_seller_report():
    """
    GET /api/reports/sales-by-seller/export
    US-REP-009 CA-8: Exporta el reporte de desempeño de ventas por vendedor.

    Query params:
        - format: 'excel' o 'pdf' (default 'excel'). 'pdf' no está implementado aún.
        - period, start_date, end_date: mismos filtros que el reporte
    """
    try:
        filters, error = _parse_seller_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        export_format = request.args.get('format', 'excel').lower()

        if export_format == 'pdf':
            return jsonify({
                'success': False,
                'error': {'code': 'NOT_IMPLEMENTED', 'message': 'Exportación a PDF no implementada aún. Use Excel.'}
            }), 501

        data = ReportService.get_sales_by_seller_report(**filters)
        return ExportHelper.export_sales_by_seller_report_to_excel(data['sellers'])

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/customers', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def get_customer_report():
    """
    GET /api/reports/customers
    US-REP-010: Reporte de la base de clientes.

    Query params:
        - period: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom' (default 'monthly')
        - start_date, end_date: YYYY-MM-DD (requeridos si period='custom')
        - at_risk_days: días sin compras para marcar un cliente en riesgo (default 90)
    """
    try:
        filters, error = _parse_customer_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        data = ReportService.get_customer_report(**filters)
        return jsonify({'success': True, 'data': data}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/customers/export', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def export_customer_report():
    """
    GET /api/reports/customers/export
    US-REP-010 CA-8: Exporta el top de clientes del reporte de clientes.

    Query params:
        - format: 'csv' o 'excel' (default 'csv')
        - period, start_date, end_date, at_risk_days: mismos filtros que el reporte
    """
    try:
        filters, error = _parse_customer_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        export_format = request.args.get('format', 'csv').lower()

        data = ReportService.get_customer_report(**filters)

        if export_format == 'excel':
            return ExportHelper.export_customer_report_to_excel(data['top_customers'])
        return ExportHelper.export_customer_report_to_csv(data['top_customers'])

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/sales-trends', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def get_sales_trends_report():
    """
    GET /api/reports/sales-trends
    US-REP-011: Análisis de tendencias de ventas.
    """
    try:
        data = ReportService.get_sales_trends_report()
        return jsonify({'success': True, 'data': data}), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/sales-trends/export', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def export_sales_trends_report():
    """
    GET /api/reports/sales-trends/export
    US-REP-011 CA-8: Exporta el análisis de tendencias de ventas a PDF.
    """
    try:
        data = ReportService.get_sales_trends_report()
        return ExportHelper.export_sales_trends_report_to_pdf(data)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/purchase-orders', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def get_purchase_orders_report():
    """
    GET /api/reports/purchase-orders
    US-REP-012: Reporte de órdenes de compra a proveedores.

    Query params:
        - start_date, end_date: YYYY-MM-DD (default: últimos 12 meses)
        - supplier_id, status: filtros opcionales
    """
    try:
        filters, error = _parse_purchase_orders_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        data = ReportService.get_purchase_orders_report(**filters)
        return jsonify({'success': True, 'data': data}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/purchase-orders/export', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def export_purchase_orders_report():
    """
    GET /api/reports/purchase-orders/export
    US-REP-012 CA-8: Exporta el reporte de órdenes de compra a proveedores.

    Query params:
        - format: 'csv' o 'excel' (default 'csv')
        - start_date, end_date, supplier_id, status: mismos filtros que el reporte
    """
    try:
        filters, error = _parse_purchase_orders_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        export_format = request.args.get('format', 'csv').lower()

        data = ReportService.get_purchase_orders_report(**filters)

        if export_format == 'excel':
            return ExportHelper.export_purchase_orders_report_to_excel(data['orders'], data['start_date'], data['end_date'])
        return ExportHelper.export_purchase_orders_report_to_csv(data['orders'], data['start_date'], data['end_date'])

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/returns', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def get_returns_report():
    """
    GET /api/reports/returns
    US-REP-015: Reporte de devoluciones de productos.

    Query params:
        - start_date, end_date: YYYY-MM-DD (default: últimos 12 meses)
        - status: filtrar por estado de la devolución (opcional)
    """
    try:
        filters, error = _parse_returns_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        data = ReportService.get_returns_report(**filters)
        return jsonify({'success': True, 'data': data}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500


@reports_bp.route('/returns/export', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def export_returns_report():
    """
    GET /api/reports/returns/export
    US-REP-015 CA-8: Exporta el reporte de devoluciones.

    Query params:
        - format: 'csv' o 'excel' (default 'csv')
        - start_date, end_date, status: mismos filtros que el reporte
    """
    try:
        filters, error = _parse_returns_report_filters()
        if error:
            return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': error}}), 400

        export_format = request.args.get('format', 'csv').lower()

        data = ReportService.get_returns_report(**filters)

        if export_format == 'excel':
            return ExportHelper.export_returns_report_to_excel(data['returns'], data['start_date'], data['end_date'])
        return ExportHelper.export_returns_report_to_csv(data['returns'], data['start_date'], data['end_date'])

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}
        }), 500
