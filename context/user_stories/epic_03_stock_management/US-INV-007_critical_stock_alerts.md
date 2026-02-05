# US-INV-007: Alerta de Stock Crítico

## Historia de Usuario
**Como** gerente de almacen,
**quiero** recibir notificaciones cuando productos lleguen a stock cero,
**para** tomar acciones urgentes de reabastecimiento.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Detección de Stock Cero ✅ COMPLETADO
- [x] Cuando un producto alcanza stock = 0:
  - [x] Se marca automáticamente con estado "Sin Stock"
  - [x] Se crea registro en tabla `inventory_alerts` con tipo 'out_of_stock'
  - [x] Se activa notificación visual inmediata
- [x] La detección ocurre en tiempo real al actualizar stock
- **Implementación:** CriticalStockAlertService integrado en StockService.update_stock()

### CA-2: Alerta Visual en Dashboard ✅ COMPLETADO
Widget de alertas en dashboard:
- [x] Contador destacado: "X Productos Sin Stock"
- [x] Color rojo para llamar atención
- [x] Al hacer clic, redirige a vista de productos sin stock
- [x] Se actualiza en tiempo real (polling cada 5 min)
- [x] Badge de notificación si hay nuevas alertas no vistas
- **Implementación:** OutOfStockAlertWidget integrado en AdminDashboard y WarehouseDashboard

### CA-3: Indicadores en Lista de Productos ✅ COMPLETADO
En listado de productos:
- [x] Badge rojo prominente: "SIN STOCK" con animación pulse
- [x] Icono de advertencia (NoStockIcon)
- [x] Fila resaltada con fondo rojo suave
- [x] Se puede filtrar/ordenar por estado de stock
- [x] Vista rápida filtrada: "Productos Sin Stock"
- **Implementación:** StockBadge mejorado, ProductTable con row highlighting

### CA-4: Vista Dedicada de Productos Sin Stock ✅ COMPLETADO
Vista "Productos Sin Stock":
- [x] Lista todos los productos con stock = 0
- [x] Muestra:
  - [x] Producto (nombre, SKU, imagen)
  - [x] Categoría
  - [x] Fecha cuando llegó a stock 0
  - [x] Último movimiento (qué causó que llegara a 0)
  - [ ] Proveedor principal (diferido - requiere Epic 05)
  - [x] Acciones: "Crear Orden de Compra" (placeholder), "Ajustar Stock"
- [x] Ordenados por antigüedad de alerta
- **Implementación:** OutOfStockProducts página, ruta /inventory/out-of-stock

### CA-5: Validación en Creación de Pedidos ⏸️ DIFERIDO
Al intentar agregar producto sin stock a un pedido:
- Validación en tiempo real antes de agregar al carrito
- Mensaje de error: "Este producto no tiene stock disponible"
- No se permite agregar al pedido
- Sugerencia: "¿Deseas crear una orden de compra al proveedor?"
- Opción de agregar a lista de espera (feature futuro)
- **Nota:** DIFERIDO hasta Epic 04 (Sistema de Pedidos)

### CA-6: Sugerencia de Orden de Compra ⏸️ DIFERIDO
Para productos sin stock:
- Botón "Crear Orden de Compra" en vista de producto (UI placeholder presente)
- Pre-llena formulario de orden al proveedor:
  - Producto seleccionado
  - Proveedor principal del producto
  - Cantidad sugerida = punto de reorden × 2 (o configuración)
- Agiliza proceso de reabastecimiento
- **Nota:** DIFERIDO hasta Epic 05 (Supply Chain)

### CA-7: Notificaciones ⏸️ PARCIALMENTE IMPLEMENTADO
Sistema de notificaciones cuando producto llega a stock 0:
- [x] Notificación in-app (toast/banner) - Snackbar pattern disponible
- [ ] Email a gerente de almacén y administradores - DIFERIDO (requiere servicio de email)
- [ ] Resumen diario de productos sin stock - DIFERIDO (requiere scheduler)
- [ ] Opción de configurar notificaciones por categoría crítica - DIFERIDO
- **Nota:** Email y configuración avanzada diferidos para v2.0

### CA-8: Resolución de Alertas ✅ COMPLETADO
Alerta de stock crítico se resuelve automáticamente cuando:
- [x] El stock del producto sube por encima de 0
- [x] Se registra timestamp de resolución (resolved_at)
- [x] Se mantiene historial de todas las alertas (activas y resueltas)
- [x] Métrica: tiempo promedio en stock 0
- **Implementación:** CriticalStockAlertService.check_and_resolve_alert(), get_alert_statistics()

## Notas Técnicas
- Trigger de BD para crear alerta al llegar a stock 0
- Sistema de notificaciones en tiempo real (WebSockets)
- Índice en products(stock) para queries de productos sin stock
- Cola de emails para notificaciones asíncronas

```sql
-- Trigger para alertas de stock crítico
CREATE OR REPLACE FUNCTION check_critical_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el stock llega a 0
    IF NEW.stock = 0 AND OLD.stock > 0 THEN
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            current_stock,
            reorder_point,
            is_active
        )
        VALUES (
            NEW.id,
            'out_of_stock',
            0,
            NEW.reorder_point,
            true
        );

        -- Notificar a usuarios relevantes
        PERFORM pg_notify('stock_critical', json_build_object(
            'product_id', NEW.id,
            'product_name', NEW.name,
            'sku', NEW.sku
        )::text);
    END IF;

    -- Si el stock vuelve a estar disponible
    IF NEW.stock > 0 AND OLD.stock = 0 THEN
        UPDATE inventory_alerts
        SET is_active = false, resolved_at = CURRENT_TIMESTAMP
        WHERE product_id = NEW.id
        AND alert_type = 'out_of_stock'
        AND is_active = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_critical_stock
AFTER UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION check_critical_stock();

-- Vista de productos sin stock con info relevante
CREATE OR REPLACE VIEW products_out_of_stock AS
SELECT
    p.id,
    p.sku,
    p.name,
    p.category_id,
    c.name as category_name,
    p.reorder_point,
    ia.created_at as out_of_stock_since,
    (
        SELECT im.created_at
        FROM inventory_movements im
        WHERE im.product_id = p.id
        ORDER BY im.created_at DESC
        LIMIT 1
    ) as last_movement_date,
    p.main_supplier_id
FROM products p
INNER JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory_alerts ia ON ia.product_id = p.id
    AND ia.alert_type = 'out_of_stock'
    AND ia.is_active = true
WHERE p.stock = 0 AND p.is_active = true
ORDER BY ia.created_at ASC;
```

## Definición de Hecho
- [x] Backend: Trigger para detectar stock = 0 (CriticalStockAlertService integrado en StockService)
- [x] Backend: Creación automática de alertas (check_and_create_alert)
- [x] Backend: API GET /api/inventory/out-of-stock (+ /count, /statistics, /history)
- [ ] Backend: Sistema de notificaciones (WebSocket/email) - DIFERIDO v2.0
- [ ] Backend: Validación en API de pedidos - DIFERIDO Epic 04
- [x] Frontend: Widget en dashboard con contador (OutOfStockAlertWidget)
- [x] Frontend: Vista dedicada de productos sin stock (OutOfStockProducts)
- [x] Frontend: Badge e indicadores en lista de productos (StockBadge mejorado)
- [ ] Frontend: Validación en formulario de pedidos - DIFERIDO Epic 04
- [x] Frontend: Botón de crear orden de compra (UI placeholder, funcionalidad Epic 05)
- [x] Frontend: Sistema de notificaciones toast (Snackbar pattern disponible)
- [x] Base de datos: Tabla inventory_alerts (existía de US-INV-004)
- [x] Base de datos: Triggers de stock crítico (implementado en código Python)
- [ ] Base de datos: Vista products_out_of_stock - No necesaria (query en servicio)
- [ ] Pruebas de triggers y alertas - Pendiente
- [ ] Pruebas de notificaciones - Pendiente
- [x] Documentación de API (en código)

## Dependencias
- US-INV-001 (actualizaciones de stock)
- US-INV-004 (tabla inventory_alerts)
- US-PROD-001 (tabla products)
- Epic 04 (validación en pedidos)
- Sistema de notificaciones básico

## Tags
`inventory`, `alerts`, `critical`, `notifications`, `high-priority`
