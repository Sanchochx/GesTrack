"""
Rutas API para Reportes Programados
US-REP-013: Exportación Masiva de Reportes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.scheduled_report import ScheduledReport
from app.services.scheduled_report_service import ScheduledReportService
from app.utils.decorators import require_role

scheduled_reports_bp = Blueprint('scheduled_reports', __name__, url_prefix='/api/scheduled-reports')


@scheduled_reports_bp.route('/report-types', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def get_report_types():
    """
    GET /api/scheduled-reports/report-types
    US-REP-013 CA-3: Lista de tipos de reporte disponibles para programar.
    """
    return jsonify({'success': True, 'data': ScheduledReportService.get_available_report_types()}), 200


@scheduled_reports_bp.route('', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def list_schedules():
    """
    GET /api/scheduled-reports
    US-REP-013: Lista todas las programaciones de reportes.
    """
    schedules = ScheduledReport.query.order_by(ScheduledReport.created_at.desc()).all()
    return jsonify({'success': True, 'data': [s.to_dict() for s in schedules]}), 200


@scheduled_reports_bp.route('/<schedule_id>', methods=['GET'])
@jwt_required()
@require_role(['Admin'])
def get_schedule(schedule_id):
    """
    GET /api/scheduled-reports/:id
    US-REP-013 CA-8: Detalle de una programación con su historial de ejecuciones.
    """
    schedule = ScheduledReport.query.get(schedule_id)
    if not schedule:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Reporte programado no encontrado'}}), 404
    return jsonify({'success': True, 'data': schedule.to_dict(include_history=True)}), 200


@scheduled_reports_bp.route('', methods=['POST'])
@jwt_required()
@require_role(['Admin'])
def create_schedule():
    """
    POST /api/scheduled-reports
    US-REP-013 CA-1/CA-2/CA-3/CA-5: Crea una nueva programación de reporte.

    Body:
        {
            "name": "Ventas semanales",
            "report_type": "sales-period",
            "frequency": "weekly",
            "recipients": ["gerente@empresa.com"],
            "parameters": { "period": "weekly" },
            "file_format": "excel"
        }
    """
    try:
        data = request.get_json() or {}
        required_fields = ['name', 'report_type', 'frequency', 'recipients']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': {'code': 'MISSING_FIELD', 'message': f'El campo {field} es requerido'}
                }), 400

        current_user_id = get_jwt_identity()
        schedule = ScheduledReportService.create_schedule(
            name=data['name'],
            report_type=data['report_type'],
            frequency=data['frequency'],
            recipients=data['recipients'],
            created_by_id=current_user_id,
            parameters=data.get('parameters'),
            file_format=data.get('file_format'),
        )
        return jsonify({
            'success': True,
            'data': schedule.to_dict(),
            'message': 'Reporte programado creado correctamente'
        }), 201

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}}), 500


@scheduled_reports_bp.route('/<schedule_id>', methods=['PUT'])
@jwt_required()
@require_role(['Admin'])
def update_schedule(schedule_id):
    """
    PUT /api/scheduled-reports/:id
    US-REP-013: Actualiza nombre, parámetros, frecuencia, destinatarios o formato.
    """
    try:
        data = request.get_json() or {}
        schedule = ScheduledReportService.update_schedule(schedule_id, **data)
        return jsonify({
            'success': True,
            'data': schedule.to_dict(),
            'message': 'Reporte programado actualizado correctamente'
        }), 200

    except ValueError as e:
        code = 'NOT_FOUND' if 'no encontrado' in str(e) else 'VALIDATION_ERROR'
        status = 404 if code == 'NOT_FOUND' else 400
        return jsonify({'success': False, 'error': {'code': code, 'message': str(e)}}), status
    except Exception as e:
        return jsonify({'success': False, 'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}}), 500


@scheduled_reports_bp.route('/<schedule_id>/toggle', methods=['PATCH'])
@jwt_required()
@require_role(['Admin'])
def toggle_schedule(schedule_id):
    """
    PATCH /api/scheduled-reports/:id/toggle
    US-REP-013 CA-7: Activa o pausa una programación de reporte.

    Body: { "is_active": false }
    """
    try:
        data = request.get_json() or {}
        if 'is_active' not in data:
            return jsonify({
                'success': False,
                'error': {'code': 'MISSING_FIELD', 'message': 'El campo is_active es requerido'}
            }), 400

        schedule = ScheduledReportService.toggle_active(schedule_id, bool(data['is_active']))
        return jsonify({
            'success': True,
            'data': schedule.to_dict(),
            'message': 'Programación activada' if schedule.is_active else 'Programación pausada'
        }), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': str(e)}}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}}), 500


@scheduled_reports_bp.route('/<schedule_id>', methods=['DELETE'])
@jwt_required()
@require_role(['Admin'])
def delete_schedule(schedule_id):
    """
    DELETE /api/scheduled-reports/:id
    US-REP-013: Elimina una programación de reporte.
    """
    try:
        ScheduledReportService.delete_schedule(schedule_id)
        return jsonify({'success': True, 'message': 'Reporte programado eliminado correctamente'}), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': str(e)}}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}}), 500


@scheduled_reports_bp.route('/<schedule_id>/run-now', methods=['POST'])
@jwt_required()
@require_role(['Admin'])
def run_schedule_now(schedule_id):
    """
    POST /api/scheduled-reports/:id/run-now
    US-REP-013: Ejecuta una programación inmediatamente (sin esperar su ciclo),
    útil para validar la configuración de destinatarios y formato.
    """
    try:
        run = ScheduledReportService.run_now(schedule_id)
        if run.status == 'error':
            return jsonify({
                'success': False,
                'error': {'code': 'RUN_FAILED', 'message': run.error_message}
            }), 502
        return jsonify({
            'success': True,
            'data': run.to_dict(),
            'message': 'Reporte generado y enviado correctamente'
        }), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': str(e)}}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}}), 500
