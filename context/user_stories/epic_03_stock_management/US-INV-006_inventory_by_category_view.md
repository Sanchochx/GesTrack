# US-INV-006: Vista de Inventario por Categoría

## Historia de Usuario
**Como** gerente de almacen,
**quiero** ver el inventario agrupado por categoría,
**para** analizar el stock de forma organizada.

## Prioridad
**Baja**

## Estimación
3 Story Points

## Criterios de Aceptación

### CA-1: Listado de Categorías
- Vista principal "Inventario por Categoría"
- Tarjetas o lista accordion con cada categoría:
  - Nombre de categoría
  - Cantidad total de productos en la categoría
  - Cantidad de productos con stock disponible
  - Cantidad de productos con stock bajo (≤ punto reorden)
  - Cantidad de productos sin stock
  - Valor total de inventario de la categoría
- Ordenadas alfabéticamente por defecto

### CA-2: Expansión/Colapso de Categorías
- Al hacer clic en una categoría, se expande mostrando sus productos
- Se puede colapsar para ocultar detalles
- Estado de expansión se mantiene al navegar (localStorage)
- Botones "Expandir Todas" / "Colapsar Todas"

### CA-3: Productos Dentro de Categoría
Al expandir categoría, se muestra tabla de productos:
- Columnas:
  - Imagen (thumbnail)
  - SKU
  - Nombre
  - Stock Actual
  - Punto de Reorden
  - Estado (En Stock / Stock Bajo / Sin Stock)
  - Valor (precio costo × stock)
- Indicadores visuales:
  - Verde: Stock > punto reorden
  - Amarillo: Stock ≤ punto reorden
  - Rojo: Stock = 0
- Se puede hacer clic en producto para ver detalles

### CA-4: Filtros y Ordenamiento
Opciones de filtro:
- Mostrar solo categorías con stock bajo
- Mostrar solo categorías con productos sin stock
- Buscar categoría por nombre

Opciones de ordenamiento:
- Alfabético (A-Z, Z-A)
- Por valor de inventario (mayor a menor, menor a mayor)
- Por cantidad de productos
- Por número de productos con stock bajo

### CA-5: Indicadores de Stock en Categorías
Badges visuales en cada categoría:
- Badge verde: "X productos en stock"
- Badge amarillo: "X productos stock bajo" (si > 0)
- Badge rojo: "X productos sin stock" (si > 0)
- Al hacer hover, muestra tooltip con lista de productos en esa condición

### CA-6: Resumen General
Panel superior con métricas totales:
- Total de categorías
- Total de productos
- Categorías con stock bajo (al menos 1 producto con stock ≤ reorden)
- Categorías sin stock (todas sus productos en stock 0)
- Valor total del inventario (todas las categorías)

### CA-7: Acciones Rápidas
Desde la vista de categoría:
- Botón "Ajustar Punto de Reorden Masivo" (abre modal de US-INV-004)
- Botón "Exportar Categoría" (exporta productos de esa categoría)
- Link "Ver Historial" (historial de movimientos filtrado por categoría)

## Notas Técnicas
- Query con agregación por categoría optimizada
- Join con tabla products para obtener datos de stock
- Cache de estadísticas por categoría (invalidar al cambiar stock)

```sql
-- Query principal para vista por categoría
SELECT
    c.id,
    c.name,
    COUNT(p.id) as total_products,
    COUNT(p.id) FILTER (WHERE p.stock > 0) as products_in_stock,
    COUNT(p.id) FILTER (WHERE p.stock <= p.reorder_point AND p.stock > 0) as products_low_stock,
    COUNT(p.id) FILTER (WHERE p.stock = 0) as products_out_of_stock,
    SUM(p.stock * p.cost_price) as total_value,
    SUM(p.stock) as total_units
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name ASC;

-- Query para productos de una categoría específica
SELECT
    id,
    sku,
    name,
    stock,
    reorder_point,
    cost_price,
    (stock * cost_price) as item_value,
    image_url,
    CASE
        WHEN stock = 0 THEN 'out_of_stock'
        WHEN stock <= reorder_point THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM products
WHERE category_id = $1 AND is_active = true
ORDER BY stock_status DESC, stock ASC;
```

## Definición de Hecho
- [x] Backend: API GET /api/inventory/by-category
- [x] Backend: API GET /api/inventory/category/:id/products
- [x] Backend: API GET /api/inventory/by-category/:id/export (CA-7)
- [x] Backend: Queries optimizadas con agregaciones
- [x] Frontend: Vista de listado de categorías
- [x] Frontend: Accordion o tarjetas expandibles/colapsables
- [x] Frontend: Tabla de productos dentro de categoría
- [x] Frontend: Indicadores visuales de estado de stock
- [x] Frontend: Panel de resumen general
- [x] Frontend: Filtros y ordenamiento
- [x] Frontend: Botones de acciones rápidas
- [x] Frontend: Persistencia de estado expandido (localStorage)
- [ ] Pruebas de queries con múltiples categorías
- [ ] Pruebas de performance
- [x] Documentación de API

## Dependencias
- US-PROD-007 (tabla categories)
- US-PROD-001 (tabla products)
- US-INV-004 (campo reorder_point)
- US-INV-005 (cálculo de valor)

## Tags
`inventory`, `categories`, `organization`, `view`, `low-priority`
