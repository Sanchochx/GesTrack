"""
Constantes de la aplicación

US-INV-002: Ajustes Manuales de Inventario - CA-2
"""

# US-INV-002 CA-2: Razones predefinidas para ajustes de inventario
ADJUSTMENT_REASONS = [
    "Conteo físico",
    "Producto dañado",
    "Merma",
    "Error de registro",
    "Devolución de cliente",
    "Pérdida",
    "Otro"
]

# Tipos de ajuste
ADJUSTMENT_TYPES = {
    'INCREASE': 'increase',
    'DECREASE': 'decrease'
}

# Tipos de movimiento de inventario
MOVEMENT_TYPES = {
    'MANUAL_ADJUSTMENT': 'Ajuste Manual',
    'INITIAL_STOCK': 'Stock Inicial',
    'PURCHASE': 'Entrada',
    'SALE': 'Salida',
    'RETURN': 'Devolución'
}

# Umbrales para validaciones
SIGNIFICANT_ADJUSTMENT_THRESHOLD = 0.5  # 50% - requiere doble confirmación
NOTIFICATION_THRESHOLD = 0.2  # 20% - enviar notificación a admin

# Validaciones
MIN_REASON_LENGTH = 10  # US-INV-002 CA-3: Mínimo 10 caracteres para razón personalizada
MAX_REASON_LENGTH = 500  # US-INV-002 CA-1: Máximo 500 caracteres
