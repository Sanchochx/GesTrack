## US-REP-008: Reporte de Productos con Stock Bajo
**Como** gerente de almacén,
**quiero** ver un reporte de productos que necesitan reabastecimiento,
**para** priorizar órdenes de compra.

### Criterios de Aceptación:
- Se muestra lista de productos con stock en o bajo el punto de reorden
- Para cada producto: nombre, SKU, stock actual, punto de reorden, proveedor preferido, días estimados sin stock
- Se ordena por urgencia (productos sin stock primero, luego por días estimados)
- Se calcula cantidad sugerida de reorden basado en promedio de ventas
- Se puede agrupar por proveedor para facilitar creación de órdenes
- Se puede crear órdenes de compra directamente desde el reporte
- Se puede exportar a Excel/CSV
- Se muestra timestamp del reporte

**Prioridad:** Alta
