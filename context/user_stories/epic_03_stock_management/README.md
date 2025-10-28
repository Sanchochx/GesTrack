# Epic 03: Stock Management - Inventario

## Descripción
Esta épica cubre todo el sistema de gestión de inventario en tiempo real, incluyendo seguimiento de stock, ajustes manuales, alertas de reorden, historial de movimientos, y análisis del valor del inventario. Proporciona las herramientas necesarias para que el gerente de almacén pueda mantener control total sobre los niveles de stock, evitar roturas de stock, y optimizar el capital invertido en inventario.

## Objetivos
- Implementar seguimiento de stock en tiempo real con actualizaciones automáticas
- Permitir ajustes manuales de inventario con trazabilidad completa
- Proporcionar visibilidad total del historial de movimientos de stock
- Configurar sistema de alertas para puntos de reorden y stock crítico
- Calcular y mostrar valor total del inventario
- Ofrecer múltiples vistas del inventario (por categoría, dashboard, reportes)
- Prevenir sobreventa mediante reserva de stock
- Facilitar exportación de datos para análisis externos

## Roles con Acceso
- **Administrador**: Acceso completo a todas las funcionalidades
- **Gerente de Almacén**: Acceso completo a gestión de inventario, ajustes, configuración
- **Personal de Ventas**: Visualización de stock disponible (solo lectura)

## Historias de Usuario

### Alta Prioridad
1. **US-INV-001**: Seguimiento de Stock en Tiempo Real - 8 SP
2. **US-INV-002**: Ajustes Manuales de Inventario - 5 SP
3. **US-INV-004**: Configuración de Puntos de Reorden - 5 SP
4. **US-INV-007**: Alerta de Stock Crítico - 5 SP
5. **US-INV-008**: Reserva de Stock para Pedidos Pendientes - 8 SP

### Media Prioridad
6. **US-INV-003**: Historial de Movimientos de Stock - 5 SP
7. **US-INV-005**: Valor Total del Inventario - 5 SP
8. **US-INV-010**: Dashboard de Inventario - 8 SP

### Baja Prioridad
9. **US-INV-006**: Vista de Inventario por Categoría - 3 SP
10. **US-INV-009**: Exportar Datos de Inventario - 3 SP

**Total estimado**: 55 Story Points

## Dependencias

### Épicas Requeridas
- **Epic 01 (Foundation)**: Sistema de autenticación y autorización
- **Epic 02 (Core Data)**: Gestión de productos completa (especialmente US-PROD-001)

### Integraciones
- Integración con sistema de pedidos (Epic 04) para actualizaciones automáticas de stock
- Integración con sistema de proveedores (Epic 05) para recepciones de inventario
- Sistema de notificaciones para alertas de stock bajo/crítico

## Modelo de Datos

### Tabla: inventory_movements
```sql
CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    movement_type VARCHAR(50) NOT NULL, -- 'initial_stock', 'sale', 'manual_adjustment', 'supplier_receipt', 'return', 'order_reservation', 'order_cancellation'
    quantity INTEGER NOT NULL, -- Puede ser positivo (entrada) o negativo (salida)
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    reason VARCHAR(500), -- Obligatorio para ajustes manuales
    user_id INTEGER NOT NULL REFERENCES users(id),
    related_order_id INTEGER REFERENCES orders(id), -- Si aplica
    related_supplier_order_id INTEGER REFERENCES supplier_orders(id), -- Si aplica
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_created ON inventory_movements(created_at DESC);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
```

### Tabla: inventory_alerts
```sql
CREATE TABLE inventory_alerts (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    alert_type VARCHAR(50) NOT NULL, -- 'reorder_point', 'out_of_stock', 'critical_stock'
    current_stock INTEGER NOT NULL,
    reorder_point INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_inventory_alerts_active ON inventory_alerts(is_active, product_id);
```

### Extensión a tabla products
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0; -- Stock reservado para pedidos pendientes
```

## Criterios de Éxito

### Funcionales
- ✅ El stock se actualiza en tiempo real con cada operación
- ✅ Se registra el 100% de los movimientos de inventario con trazabilidad completa
- ✅ Las alertas de stock bajo/crítico se generan automáticamente
- ✅ No se permite sobreventa (validación de stock disponible)
- ✅ Los ajustes manuales requieren justificación y quedan auditados
- ✅ El dashboard muestra métricas actualizadas en tiempo real

### Técnicos
- ✅ Transacciones ACID para operaciones de inventario críticas
- ✅ Manejo de concurrencia para evitar condiciones de carrera en stock
- ✅ Performance: consultas de stock < 200ms
- ✅ Índices optimizados para consultas frecuentes
- ✅ Validación de stock tanto en frontend como backend

### Métricas
- Reducción de roturas de stock en 80%
- Tiempo promedio de detección de stock bajo < 1 minuto
- 100% de precisión en cálculos de stock
- 0 casos de sobreventa
- Tiempo de generación de reportes < 3 segundos

## Prioridad
**ALTA** - El control de inventario es crítico para el funcionamiento del negocio

## Notas Técnicas
- Implementar locks optimistas/pesimistas para operaciones concurrentes de stock
- Considerar uso de triggers de base de datos para actualizaciones automáticas
- Implementar sistema de eventos para sincronización en tiempo real (WebSockets o polling)
- Cache de métricas de dashboard con invalidación inteligente
- Exportaciones en background para grandes volúmenes de datos

## Riesgos y Mitigaciones
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Condiciones de carrera en stock | Alto | Transacciones con nivel de aislamiento adecuado + locks |
| Discrepancias entre stock real y sistema | Alto | Proceso periódico de auditoría + ajustes manuales trazables |
| Performance en históricos grandes | Medio | Paginación + índices + archivado de datos antiguos |
| Sobreventa en pedidos concurrentes | Alto | Validación de stock con locks + stock reservado |
