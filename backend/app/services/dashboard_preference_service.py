"""
Servicio de Preferencias de Dashboard Personalizable
US-REP-014: Dashboard Personalizable
"""
from app import db
from app.models.dashboard_preference import DashboardPreference

VALID_SIZES = ('third', 'half', 'two_thirds', 'full')

# CA-2: Catálogo de widgets disponibles (cada uno reutiliza un componente ya
# existente del dashboard estándar — ver components/dashboard/ en el frontend)
WIDGET_REGISTRY = {
    'daily_sales': {'label': 'Ventas del Período', 'default_size': 'half'},
    'pending_orders': {'label': 'Pedidos Pendientes', 'default_size': 'half'},
    'out_of_stock': {'label': 'Productos Sin Stock', 'default_size': 'third'},
    'inventory_value': {'label': 'Valor del Inventario', 'default_size': 'third'},
    'top_products': {'label': 'Top Productos', 'default_size': 'half'},
    'top_categories': {'label': 'Top Categorías', 'default_size': 'third'},
    'stock_distribution': {'label': 'Distribución de Stock', 'default_size': 'third'},
    'inventory_evolution': {'label': 'Evolución del Inventario', 'default_size': 'two_thirds'},
    'category_distribution': {'label': 'Distribución por Categoría', 'default_size': 'third'},
}

# CA-5: Configuración por defecto del dashboard
DEFAULT_WIDGETS = [
    {'widget_type': 'daily_sales', 'size': 'half'},
    {'widget_type': 'pending_orders', 'size': 'half'},
    {'widget_type': 'out_of_stock', 'size': 'third'},
    {'widget_type': 'inventory_value', 'size': 'third'},
    {'widget_type': 'top_products', 'size': 'half'},
]


class DashboardPreferenceService:
    """Lógica de negocio para la configuración personalizada del dashboard"""

    @staticmethod
    def get_widget_catalog():
        """CA-2: Catálogo de widgets disponibles para agregar al dashboard"""
        return [
            {'widget_type': key, 'label': meta['label'], 'default_size': meta['default_size']}
            for key, meta in WIDGET_REGISTRY.items()
        ]

    @staticmethod
    def _validate_widgets(widgets):
        if not isinstance(widgets, list) or len(widgets) == 0:
            raise ValueError('Debe incluir al menos un widget')

        seen = set()
        for w in widgets:
            widget_type = w.get('widget_type') if isinstance(w, dict) else None
            size = w.get('size') if isinstance(w, dict) else None
            if widget_type not in WIDGET_REGISTRY:
                raise ValueError(f'Tipo de widget inválido: {widget_type}')
            if size not in VALID_SIZES:
                raise ValueError(f'Tamaño de widget inválido: {size}')
            if widget_type in seen:
                raise ValueError(f'El widget "{widget_type}" está duplicado')
            seen.add(widget_type)

    @staticmethod
    def get_preferences(user_id):
        """CA-4/CA-8: Obtiene la configuración guardada del usuario, o la de por defecto"""
        preference = DashboardPreference.query.filter_by(user_id=user_id).first()
        if preference:
            return preference.to_dict()
        return {'id': None, 'user_id': user_id, 'widgets': DEFAULT_WIDGETS, 'updated_at': None}

    @staticmethod
    def save_preferences(user_id, widgets):
        """
        CA-1/CA-3/CA-4/CA-7: Guarda (crea o actualiza) la configuración de
        widgets del usuario — agregar/quitar, reordenar y redimensionar se
        resuelven todos guardando la lista completa en el orden deseado.
        """
        DashboardPreferenceService._validate_widgets(widgets)

        preference = DashboardPreference.query.filter_by(user_id=user_id).first()
        if preference:
            preference.widgets = widgets
        else:
            preference = DashboardPreference(user_id=user_id, widgets=widgets)
            db.session.add(preference)

        db.session.commit()
        return preference

    @staticmethod
    def reset_preferences(user_id):
        """CA-5: Restablece la configuración a los valores por defecto"""
        preference = DashboardPreference.query.filter_by(user_id=user_id).first()
        if preference:
            db.session.delete(preference)
            db.session.commit()
        return {'id': None, 'user_id': user_id, 'widgets': DEFAULT_WIDGETS, 'updated_at': None}
