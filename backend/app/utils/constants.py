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

# US-ORD-011 CA-1: Ventana de tiempo para aceptar devoluciones desde la entrega
RETURN_WINDOW_DAYS = 30

# US-ORD-014 CA-6: Motivos predefinidos para descuentos en pedidos
DISCOUNT_REASONS = [
    "Promoción especial",
    "Cliente frecuente / VIP",
    "Liquidación",
    "Compensación por inconveniente",
    "Descuento autorizado por gerencia",
    "Otro",
]

# US-ORD-014 CA-7: Umbral de descuento (%) a partir del cual se requiere ser Admin
DISCOUNT_AUTHORIZATION_THRESHOLD = 20

# US-ORD-012 CA-2/CA-6: Datos de la empresa para documentos imprimibles (pedido en PDF)
COMPANY_INFO = {
    'name': 'GesTrack',
    'address': 'Calle Principal 123, Bogotá, Colombia',
    'phone': '+57 (601) 555-0100',
    'email': 'contacto@gestrack.com',
    'terms': 'Este pedido es válido según los términos y condiciones acordados con el cliente. '
             'Cualquier reclamo debe realizarse dentro de los 30 días posteriores a la entrega.',
}
