"""
Rutas API para Reportes
US-REP-002: Reporte de Ventas Diarias
US-REP-003: Reporte de Ventas por Período
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
