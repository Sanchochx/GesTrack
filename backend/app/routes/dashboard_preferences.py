"""
Rutas API para Preferencias de Dashboard Personalizable
US-REP-014: Dashboard Personalizable
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.dashboard_preference_service import DashboardPreferenceService

dashboard_preferences_bp = Blueprint('dashboard_preferences', __name__, url_prefix='/api/dashboard/preferences')


@dashboard_preferences_bp.route('/widget-catalog', methods=['GET'])
@jwt_required()
def get_widget_catalog():
    """
    GET /api/dashboard/preferences/widget-catalog
    US-REP-014 CA-2: Catálogo de widgets disponibles para el dashboard.
    """
    return jsonify({'success': True, 'data': DashboardPreferenceService.get_widget_catalog()}), 200


@dashboard_preferences_bp.route('', methods=['GET'])
@jwt_required()
def get_preferences():
    """
    GET /api/dashboard/preferences
    US-REP-014 CA-4/CA-8: Obtiene la configuración de widgets del usuario actual
    (o la configuración por defecto si no ha personalizado su dashboard).
    """
    user_id = get_jwt_identity()
    return jsonify({'success': True, 'data': DashboardPreferenceService.get_preferences(user_id)}), 200


@dashboard_preferences_bp.route('', methods=['PUT'])
@jwt_required()
def save_preferences():
    """
    PUT /api/dashboard/preferences
    US-REP-014 CA-1/CA-3/CA-4/CA-7: Guarda la configuración de widgets del
    usuario actual (agregar/quitar, orden y tamaño).

    Body:
        { "widgets": [{ "widget_type": "daily_sales", "size": "half" }, ...] }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        preference = DashboardPreferenceService.save_preferences(user_id, data.get('widgets'))
        return jsonify({
            'success': True,
            'data': preference.to_dict(),
            'message': 'Configuración del dashboard guardada correctamente'
        }), 200

    except ValueError as e:
        return jsonify({'success': False, 'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': {'code': 'INTERNAL_ERROR', 'message': str(e)}}), 500


@dashboard_preferences_bp.route('/reset', methods=['POST'])
@jwt_required()
def reset_preferences():
    """
    POST /api/dashboard/preferences/reset
    US-REP-014 CA-5: Restablece el dashboard del usuario actual a la
    configuración por defecto.
    """
    user_id = get_jwt_identity()
    data = DashboardPreferenceService.reset_preferences(user_id)
    return jsonify({'success': True, 'data': data, 'message': 'Dashboard restablecido a la configuración por defecto'}), 200
