# US-INV-010: Dashboard de Inventario

## Historia de Usuario
**Como** gerente de almacen,
**quiero** ver un dashboard con métricas clave del inventario,
**para** tener una visión rápida del estado general.

## Prioridad
**Media**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Métricas Principales (KPIs)
Tarjetas destacadas en la parte superior:
1. **Total de Productos**
   - Cantidad total de SKUs activos
   - Cambio vs período anterior (+X% o -X%)

2. **Valor Total del Inventario**
   - Suma de (stock × precio costo) de todos los productos
   - Formato: $X,XXX,XXX.XX
   - Tendencia vs mes anterior

3. **Productos con Stock Bajo**
   - Cantidad de productos con stock ≤ punto reorden
   - Badge amarillo
   - Click para ver lista detallada

4. **Productos Sin Stock**
   - Cantidad de productos con stock = 0
   - Badge rojo
   - Click para ver lista detallada

### CA-2: Gráfico de Distribución por Categoría
Gráfico circular (pie chart) o de dona:
- Muestra distribución de inventario por categoría
- Métrica: Valor de inventario por categoría
- Tooltip al pasar: Categoría, Valor, Porcentaje del total
- Leyenda con colores distintivos
- Click en segmento para ver productos de esa categoría

### CA-3: Top 10 Productos con Menor Stock
Lista ordenada:
- Columnas: Imagen, Nombre, SKU, Stock Actual, Punto Reorden
- Indicador visual de criticidad (color rojo intenso para stock más bajo)
- Ordenados de menor a mayor stock
- Link rápido a detalles del producto
- Botón "Crear Orden de Compra" por producto

### CA-4: Últimos Movimientos de Inventario
Listado de los 10 movimientos más recientes:
- Fecha/Hora
- Producto
- Tipo de movimiento (con icono)
- Cantidad (+/-)
- Usuario
- Timeline visual con eventos
- Click para ver detalle completo en historial

### CA-5: Selector de Rango de Fechas
Para algunas métricas:
- Selector desplegable: Hoy, Esta semana, Este mes, Trimestre, Año, Personalizado
- Afecta a:
  - Gráfico de evolución de valor
  - Estadísticas de movimientos
  - Tendencias de KPIs
- Persistencia de selección del usuario

### CA-6: Gráfico de Evolución del Valor de Inventario
Gráfico de línea temporal:
- Eje X: Tiempo (días, semanas o meses según rango)
- Eje Y: Valor total del inventario
- Puntos de datos: Valor del inventario en cada fecha
- Tooltip: Fecha, Valor exacto
- Indicadores de eventos importantes (grandes compras, ventas masivas)
- Opción de zoom y pan

### CA-7: Estadísticas Adicionales
Panel con métricas secundarias:
- **Rotación de Inventario**: (Valor vendido / Valor promedio inventario) últimos 30 días
- **Días de Inventario**: Stock actual en días de venta promedio
- **Tasa de Cumplimiento**: % de pedidos servidos sin rotura de stock
- **Movimientos Totales**: Cantidad de transacciones de inventario del período
- **Productos Inactivos**: Productos sin movimientos en 90+ días

### CA-8: Actualización en Tiempo Real
- Todas las métricas se actualizan automáticamente
- Indicador de última actualización: "Actualizado hace X segundos"
- Botón de refresh manual
- WebSocket o polling cada 30 segundos
- Animación sutil al actualizar datos

### CA-9: Acciones Rápidas
Botones de acceso rápido:
- "Ver Inventario Completo"
- "Productos Sin Stock"
- "Ajustar Inventario"
- "Exportar Reporte"
- "Historial de Movimientos"

### CA-10: Responsividad
- Diseño adaptable a diferentes tamaños de pantalla
- En móvil: KPIs en cards verticales
- Gráficos redimensionables
- Tablas con scroll horizontal si es necesario

## Notas Técnicas
- Librería de gráficos: Chart.js, Recharts o ApexCharts
- Cache de métricas con TTL de 30 segundos
- Queries optimizadas con agregaciones
- Índices en tablas para performance

```sql
-- Query para KPIs principales
SELECT
    COUNT(DISTINCT p.id) as total_products,
    SUM(p.stock * p.cost_price) as total_inventory_value,
    COUNT(DISTINCT CASE WHEN p.stock <= p.reorder_point AND p.stock > 0 THEN p.id END) as low_stock_count,
    COUNT(DISTINCT CASE WHEN p.stock = 0 THEN p.id END) as out_of_stock_count
FROM products p
WHERE p.is_active = true;

-- Top 10 productos con menor stock
SELECT
    p.id,
    p.sku,
    p.name,
    p.stock,
    p.reorder_point,
    p.image_url,
    c.name as category
FROM products p
INNER JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true AND p.stock > 0
ORDER BY p.stock ASC, p.reorder_point DESC
LIMIT 10;

-- Distribución por categoría
SELECT
    c.name as category,
    COUNT(p.id) as product_count,
    SUM(p.stock) as total_units,
    SUM(p.stock * p.cost_price) as category_value,
    ROUND(100.0 * SUM(p.stock * p.cost_price) / (SELECT SUM(stock * cost_price) FROM products WHERE is_active = true), 2) as percentage
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
GROUP BY c.id, c.name
HAVING SUM(p.stock * p.cost_price) > 0
ORDER BY category_value DESC;

-- Últimos 10 movimientos
SELECT
    im.id,
    im.created_at,
    p.name as product_name,
    p.sku,
    im.movement_type,
    im.quantity,
    u.full_name as user_name
FROM inventory_movements im
INNER JOIN products p ON im.product_id = p.id
INNER JOIN users u ON im.user_id = u.id
ORDER BY im.created_at DESC
LIMIT 10;
```

## Definición de Hecho
- [x] Backend: API GET /api/inventory/dashboard/kpis
- [x] Backend: API GET /api/inventory/dashboard/category-distribution (usa /api/inventory/value/by-category existente)
- [x] Backend: API GET /api/inventory/dashboard/low-stock-products
- [x] Backend: API GET /api/inventory/dashboard/recent-movements (usa /api/inventory/movements/recent existente)
- [x] Backend: API GET /api/inventory/dashboard/value-history (usa /api/inventory/value/evolution existente)
- [x] Backend: Cache de métricas con invalidación (polling frontend cada 30s)
- [x] Frontend: Layout del dashboard con grid responsivo
- [x] Frontend: Tarjetas de KPIs con animaciones
- [x] Frontend: Gráfico circular de distribución por categoría
- [x] Frontend: Gráfico de línea de evolución de valor
- [x] Frontend: Lista de productos con menor stock
- [x] Frontend: Timeline de últimos movimientos
- [x] Frontend: Selector de rango de fechas
- [x] Frontend: Actualización automática en tiempo real
- [x] Frontend: Botones de acciones rápidas
- [x] Pruebas de performance de queries (SQL optimizadas con agregaciones)
- [x] Pruebas de actualización en tiempo real (polling 30s + visibility API)
- [x] Diseño responsivo verificado (mobile/tablet/desktop breakpoints)
- [x] Documentación de API (JSDoc en endpoints)

## Dependencias
- US-INV-001 (stock en tiempo real)
- US-INV-003 (historial de movimientos)
- US-INV-004 (puntos de reorden)
- US-INV-005 (valor de inventario)
- US-INV-007 (alertas de stock)
- Librería de gráficos

## Tags
`inventory`, `dashboard`, `metrics`, `analytics`, `kpi`, `medium-priority`
