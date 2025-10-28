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

### CA-1: Detección de Stock Cero
- Cuando un producto alcanza stock = 0:
  - Se marca automáticamente con estado "Sin Stock"
  - Se crea registro en tabla `inventory_alerts` con tipo 'out_of_stock'
  - Se activa notificación visual inmediata
- La detección ocurre en tiempo real al actualizar stock

### CA-2: Alerta Visual en Dashboard
Widget de alertas en dashboard:
- Contador destacado: "X Productos Sin Stock"
- Color rojo para llamar atención
- Al hacer clic, redirige a vista de productos sin stock
- Se actualiza en tiempo real
- Badge de notificación si hay nuevas alertas no vistas

### CA-3: Indicadores en Lista de Productos
En listado de productos:
- Badge rojo prominente: "SIN STOCK"
- Icono de advertencia
- Fila resaltada con fondo rojo suave
- Se puede filtrar/ordenar por estado de stock
- Vista rápida filtrada: "Productos Sin Stock"

### CA-4: Vista Dedicada de Productos Sin Stock
Vista "Productos Sin Stock":
- Lista todos los productos con stock = 0
- Muestra:
  - Producto (nombre, SKU, imagen)
  - Categoría
  - Fecha cuando llegó a stock 0
  - Último movimiento (qué causó que llegara a 0)
  - Proveedor principal (si está configurado)
  - Acciones: "Crear Orden de Compra", "Ajustar Stock"
- Ordenados por criticidad (productos más vendidos primero)

### CA-5: Validación en Creación de Pedidos
Al intentar agregar producto sin stock a un pedido:
- Validación en tiempo real antes de agregar al carrito
- Mensaje de error: "Este producto no tiene stock disponible"
- No se permite agregar al pedido
- Sugerencia: "¿Deseas crear una orden de compra al proveedor?"
- Opción de agregar a lista de espera (feature futuro)

### CA-6: Sugerencia de Orden de Compra
Para productos sin stock:
- Botón "Crear Orden de Compra" en vista de producto
- Pre-llena formulario de orden al proveedor:
  - Producto seleccionado
  - Proveedor principal del producto
  - Cantidad sugerida = punto de reorden × 2 (o configuración)
- Agiliza proceso de reabastecimiento

### CA-7: Notificaciones
Sistema de notificaciones cuando producto llega a stock 0:
- Notificación in-app (toast/banner)
- Email a gerente de almacén y administradores
- Resumen diario de productos sin stock (si hay)
- Opción de configurar notificaciones por categoría crítica

### CA-8: Resolución de Alertas
Alerta de stock crítico se resuelve automáticamente cuando:
- El stock del producto sube por encima de 0
- Se registra timestamp de resolución
- Se mantiene historial de todas las alertas (activas y resueltas)
- Métrica: tiempo promedio en stock 0

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
- [ ] Backend: Trigger para detectar stock = 0
- [ ] Backend: Creación automática de alertas
- [ ] Backend: API GET /api/inventory/out-of-stock
- [ ] Backend: Sistema de notificaciones (WebSocket/email)
- [ ] Backend: Validación en API de pedidos
- [ ] Frontend: Widget en dashboard con contador
- [ ] Frontend: Vista dedicada de productos sin stock
- [ ] Frontend: Badge e indicadores en lista de productos
- [ ] Frontend: Validación en formulario de pedidos
- [ ] Frontend: Botón de crear orden de compra
- [ ] Frontend: Sistema de notificaciones toast
- [ ] Base de datos: Tabla inventory_alerts
- [ ] Base de datos: Triggers de stock crítico
- [ ] Base de datos: Vista products_out_of_stock
- [ ] Pruebas de triggers y alertas
- [ ] Pruebas de notificaciones
- [ ] Documentación de API

## Dependencias
- US-INV-001 (actualizaciones de stock)
- US-INV-004 (tabla inventory_alerts)
- US-PROD-001 (tabla products)
- Epic 04 (validación en pedidos)
- Sistema de notificaciones básico

## Tags
`inventory`, `alerts`, `critical`, `notifications`, `high-priority`
