# US-INV-004: Configuración de Puntos de Reorden

## Historia de Usuario
**Como** gerente de almacen,
**quiero** establecer puntos de reorden para cada producto,
**para** recibir alertas antes de quedarme sin stock.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Configuración al Crear Producto
- En el formulario de creación de producto (US-PROD-001):
  - Campo "Punto de Reorden": numérico, entero, positivo
  - Valor por defecto: 10 unidades
  - Tooltip explicativo: "Recibirás una alerta cuando el stock llegue a este nivel"
  - Validación: debe ser ≥ 0 y menor que stock inicial

### CA-2: Configuración al Editar Producto
- En el formulario de edición de producto:
  - Mismo campo "Punto de Reorden" editable
  - Muestra valor actual
  - Indicador visual del stock actual vs punto de reorden
  - Si stock actual < punto de reorden, muestra advertencia: "El stock actual ya está por debajo del punto de reorden"

### CA-3: Vista de Punto de Reorden en Listado
- En la lista de productos:
  - Columna "Punto de Reorden"
  - Indicador visual si stock actual ≤ punto de reorden
  - Badge amarillo "REORDEN" cuando se alcanza el punto
  - Se puede ordenar por esta columna

### CA-4: Configuración Masiva por Categoría
- Función "Configurar Reorden Masivo":
  - Seleccionar categoría
  - Ingresar punto de reorden para todos los productos de esa categoría
  - Preview de productos que serán afectados
  - Confirmación antes de aplicar
  - Opción de sobrescribir puntos existentes o solo aplicar a productos sin configurar

### CA-5: Sugerencias Inteligentes
- Al configurar punto de reorden, sistema sugiere valor basado en:
  - Promedio de ventas de los últimos 30 días
  - Tiempo de reabastecimiento del proveedor (si está configurado)
  - Fórmula sugerida: `(Ventas promedio diarias × Días de reabastecimiento) + Stock de seguridad`
- Usuario puede aceptar sugerencia o ingresar valor manual

### CA-6: Validaciones
- Punto de reorden debe ser número entero positivo o cero
- No puede ser mayor que 10,000 unidades (validación de sensatez)
- Si se configura en 0, se muestra warning: "No recibirás alertas de reorden para este producto"
- Se guarda en tabla products como campo `reorder_point`

### CA-7: Trigger de Alertas
- Cuando el stock de un producto alcanza o cae por debajo del punto de reorden:
  - Se crea registro en tabla `inventory_alerts`
  - Se activa notificación visual en dashboard
  - Se marca el producto con indicador de "Requiere Reorden"
- La alerta permanece activa hasta que:
  - El stock sube por encima del punto de reorden
  - O la alerta se marca manualmente como resuelta

## Notas Técnicas
- Campo `reorder_point` en tabla products (INTEGER, DEFAULT 10)
- Trigger o check después de cada actualización de stock
- Índice en products(stock, reorder_point) para queries de alertas

```sql
-- Extensión de tabla products
ALTER TABLE products ADD COLUMN reorder_point INTEGER DEFAULT 10;

-- Función para verificar punto de reorden
CREATE OR REPLACE FUNCTION check_reorder_point()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el stock baja al punto de reorden o menos
    IF NEW.stock <= NEW.reorder_point AND OLD.stock > OLD.reorder_point THEN
        -- Crear alerta si no existe una activa
        INSERT INTO inventory_alerts (product_id, alert_type, current_stock, reorder_point, is_active)
        SELECT NEW.id, 'reorder_point', NEW.stock, NEW.reorder_point, true
        WHERE NOT EXISTS (
            SELECT 1 FROM inventory_alerts
            WHERE product_id = NEW.id
            AND alert_type = 'reorder_point'
            AND is_active = true
        );
    END IF;

    -- Si el stock sube por encima del punto de reorden, resolver alertas
    IF NEW.stock > NEW.reorder_point AND OLD.stock <= OLD.reorder_point THEN
        UPDATE inventory_alerts
        SET is_active = false, resolved_at = CURRENT_TIMESTAMP
        WHERE product_id = NEW.id
        AND alert_type = 'reorder_point'
        AND is_active = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reorder_point
AFTER UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION check_reorder_point();
```

## Definición de Hecho
- [ ] Backend: Campo reorder_point añadido a tabla products
- [ ] Backend: Migración de BD para campo nuevo
- [ ] Backend: Trigger para detectar llegada a punto de reorden
- [ ] Backend: API para configuración masiva por categoría
- [ ] Backend: Lógica de sugerencias inteligentes
- [ ] Frontend: Campo en formulario de crear/editar producto
- [ ] Frontend: Indicadores visuales en listado de productos
- [ ] Frontend: Interfaz de configuración masiva
- [ ] Frontend: Mostrar sugerencias de punto de reorden
- [ ] Base de datos: Tabla inventory_alerts creada
- [ ] Pruebas de triggers de alertas
- [ ] Pruebas de configuración masiva
- [ ] Documentación de API

## Dependencias
- US-PROD-001 (tabla products)
- US-INV-001 (actualizaciones de stock)
- US-INV-007 (sistema de alertas)

## Tags
`inventory`, `reorder-point`, `alerts`, `configuration`, `high-priority`
