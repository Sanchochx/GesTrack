# US-INV-003: Historial de Movimientos de Stock

## Historia de Usuario
**Como** gerente de almacen,
**quiero** ver el historial completo de movimientos de cada producto,
**para** rastrear todos los cambios en el inventario.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Vista de Historial General
- Acceso desde menú principal: "Inventario > Historial de Movimientos"
- Tabla con columnas:
  - Fecha/Hora
  - Producto (nombre + SKU)
  - Tipo de Movimiento
  - Cantidad (con indicador +/- y color)
  - Stock Anterior
  - Stock Resultante
  - Usuario
  - Motivo/Razón (si aplica)
- Ordenados cronológicamente (más recientes primero)
- Paginación: 50 registros por página

### CA-2: Tipos de Movimiento
Se muestran con íconos y colores distintivos:
- **Stock Inicial**: Icono de inicio, color azul
- **Venta**: Icono de carrito, color rojo
- **Ajuste Manual**: Icono de edición, color naranja
- **Recepción de Proveedor**: Icono de camión, color verde
- **Devolución**: Icono de retorno, color morado
- **Reserva de Pedido**: Icono de candado, color gris
- **Cancelación de Pedido**: Icono de desbloqueo, color verde claro

### CA-3: Filtros Disponibles
Panel de filtros lateral o superior:
- **Rango de Fechas**: Desde - Hasta (con presets: Hoy, Esta semana, Este mes, Último trimestre)
- **Tipo de Movimiento**: Multiselect con todos los tipos
- **Producto**: Selector con búsqueda por nombre/SKU
- **Usuario**: Selector con búsqueda
- **Categoría**: Filtrar productos por categoría
- Botón "Limpiar Filtros"

### CA-4: Historial por Producto
Desde la página de detalles del producto:
- Pestaña o sección "Historial de Movimientos"
- Muestra solo movimientos de ese producto
- Misma estructura de tabla que vista general
- Gráfico de línea mostrando evolución del stock en el tiempo

### CA-5: Detalles de Movimiento
Al hacer clic en una fila:
- Modal o panel expandible con información completa:
  - Todos los campos básicos
  - Si es venta: link al pedido relacionado
  - Si es recepción: link a la orden de compra
  - Si es ajuste: motivo completo
  - Metadata adicional (IP, timestamp exacto, etc.)

### CA-6: Exportación de Historial
- Botón "Exportar" en la vista
- Opciones: CSV / Excel
- Exporta los registros filtrados actualmente visibles
- Nombre de archivo: `historial_inventario_YYYYMMDD_HHMMSS.csv`
- Incluye todas las columnas más campos adicionales
- Límite: 10,000 registros por exportación

### CA-7: Indicadores Visuales
- Cantidad positiva (+): Verde, icono de flecha arriba
- Cantidad negativa (-): Rojo, icono de flecha abajo
- Stock resultante en 0: Badge de advertencia "SIN STOCK"
- Stock resultante bajo punto de reorden: Badge amarillo "STOCK BAJO"
- Movimientos del día actual: Destacados con fondo suave

## Notas Técnicas
- Query optimizada con índices en created_at, product_id, movement_type
- Paginación en backend para performance
- Cache de conteo total de registros (invalidar al insertar)
- Joins eficientes con tablas relacionadas (products, users, orders)

```sql
-- Query principal optimizada
SELECT
    im.id,
    im.created_at,
    p.name as product_name,
    p.sku,
    im.movement_type,
    im.quantity,
    im.stock_before,
    im.stock_after,
    u.full_name as user_name,
    im.reason,
    im.related_order_id,
    im.related_supplier_order_id
FROM inventory_movements im
INNER JOIN products p ON im.product_id = p.id
INNER JOIN users u ON im.user_id = u.id
WHERE
    ($1::date IS NULL OR im.created_at >= $1)
    AND ($2::date IS NULL OR im.created_at <= $2)
    AND ($3::text IS NULL OR im.movement_type = $3)
    AND ($4::int IS NULL OR im.product_id = $4)
    AND ($5::int IS NULL OR im.user_id = $5)
ORDER BY im.created_at DESC
LIMIT $6 OFFSET $7;
```

## Definición de Hecho
- [ ] Frontend: Vista de historial general con tabla
- [ ] Frontend: Panel de filtros funcional
- [ ] Frontend: Historial por producto en página de detalles
- [ ] Frontend: Gráfico de evolución de stock
- [ ] Frontend: Modal de detalles de movimiento
- [ ] Frontend: Exportación a CSV/Excel
- [ ] Frontend: Indicadores visuales y colores por tipo
- [ ] Backend: API GET /api/inventory/movements con filtros
- [ ] Backend: Paginación eficiente
- [ ] Backend: Endpoint de exportación
- [ ] Base de datos: Índices optimizados
- [ ] Pruebas de performance con >10k registros
- [ ] Pruebas de filtros combinados
- [ ] Documentación de API

## Dependencias
- US-INV-001 (tabla inventory_movements debe existir)
- US-PROD-001 (tabla products)
- Epic 01 (tabla users)
- Sistema de exportación de archivos

## Tags
`inventory`, `history`, `audit-trail`, `reporting`, `medium-priority`
