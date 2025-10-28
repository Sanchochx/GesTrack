# Historias de Usuario - Gestión de Inventario

## US-INV-001: Seguimiento de Stock en Tiempo Real
**Como** gerente de almacén,
**quiero** ver los niveles de stock actualizados en tiempo real,
**para** tomar decisiones informadas sobre reabastecimiento.

### Criterios de Aceptación:
- El stock se actualiza automáticamente al crear/procesar pedidos
- El stock se actualiza al recibir órdenes de compra de proveedores
- Los cambios se reflejan inmediatamente en todas las vistas del sistema
- Se muestra timestamp de la última actualización
- Se sincroniza correctamente entre múltiples usuarios concurrentes

**Prioridad:** Alta

---

## US-INV-002: Ajustes Manuales de Inventario
**Como** gerente de almacén,
**quiero** poder realizar ajustes manuales al stock de productos,
**para** corregir discrepancias encontradas en conteos físicos.

### Criterios de Aceptación:
- Se puede aumentar o disminuir el stock de cualquier producto
- Se requiere especificar la cantidad del ajuste
- Se debe ingresar una razón/motivo del ajuste (ej: "Conteo físico", "Producto dañado", "Merma")
- Se solicita confirmación antes de aplicar el ajuste
- El ajuste se registra en el historial de movimientos con fecha, hora, usuario y motivo
- Se actualiza el valor total del inventario
- Se muestra mensaje de confirmación

**Prioridad:** Alta

---

## US-INV-003: Historial de Movimientos de Stock
**Como** gerente de almacén,
**quiero** ver el historial completo de movimientos de cada producto,
**para** rastrear todos los cambios en el inventario.

### Criterios de Aceptación:
- Se muestra lista cronológica de todos los movimientos (más recientes primero)
- Cada registro incluye: fecha/hora, tipo de movimiento, cantidad, stock resultante, usuario responsable
- Tipos de movimiento: Venta, Ajuste Manual, Recepción de Proveedor, Devolución
- Se puede filtrar por: rango de fechas, tipo de movimiento, producto
- Se puede exportar el historial a CSV/Excel
- La paginación permite navegar por históricos extensos

**Prioridad:** Media

---

## US-INV-004: Configuración de Puntos de Reorden
**Como** gerente de almacén,
**quiero** establecer puntos de reorden para cada producto,
**para** recibir alertas antes de quedarme sin stock.

### Criterios de Aceptación:
- Se puede configurar el punto de reorden al crear/editar un producto
- El punto de reorden es un valor numérico positivo
- Por defecto, el punto de reorden es 10 unidades
- Cuando el stock alcanza o cae por debajo del punto de reorden, se activa alerta
- Se puede modificar el punto de reorden en cualquier momento
- Se puede establecer puntos de reorden masivamente para una categoría

**Prioridad:** Alta

---

## US-INV-005: Valor Total del Inventario
**Como** administrador,
**quiero** conocer el valor total del inventario actual,
**para** evaluar el capital invertido en stock.

### Criterios de Aceptación:
- El valor se calcula como: suma de (precio de costo × stock actual) de todos los productos
- Se muestra en el dashboard principal
- Se actualiza automáticamente con cada cambio en inventario o precios
- Se puede ver el valor total por categoría
- Se muestra en formato de moneda (ej: $1,234.56)
- Se incluye gráfico de evolución del valor del inventario en el tiempo

**Prioridad:** Media

---

## US-INV-006: Vista de Inventario por Categoría
**Como** gerente de almacén,
**quiero** ver el inventario agrupado por categoría,
**para** analizar el stock de forma organizada.

### Criterios de Aceptación:
- Se muestra listado de categorías con cantidad de productos en cada una
- Al seleccionar una categoría, se muestran todos sus productos con stock
- Se muestra valor total de inventario por categoría
- Se indica cuántos productos tienen stock bajo en cada categoría
- Se puede expandir/colapsar las categorías
- Se mantiene el orden alfabético de categorías

**Prioridad:** Baja

---

## US-INV-007: Alerta de Stock Crítico
**Como** gerente de almacén,
**quiero** recibir notificaciones cuando productos lleguen a stock cero,
**para** tomar acciones urgentes de reabastecimiento.

### Criterios de Aceptación:
- Cuando un producto llega a stock = 0, se marca como "Sin Stock"
- Se genera alerta visual en el dashboard
- En la lista de productos se muestra indicador rojo de "Sin Stock"
- Existe vista filtrada de "Productos Sin Stock"
- No se pueden crear pedidos con productos sin stock (validación)
- Se sugiere crear orden de compra al proveedor

**Prioridad:** Alta

---

## US-INV-008: Reserva de Stock para Pedidos Pendientes
**Como** sistema,
**quiero** reservar el stock cuando se crea un pedido,
**para** evitar sobreventa de productos.

### Criterios de Aceptación:
- Al crear un pedido en estado "Pendiente", el stock se reduce inmediatamente
- Si se cancela un pedido pendiente, el stock se restaura
- No se puede crear un pedido si no hay stock suficiente
- Se valida disponibilidad de stock en tiempo real antes de confirmar pedido
- Se muestra stock disponible vs stock reservado
- La validación funciona correctamente con pedidos concurrentes

**Prioridad:** Alta

---

## US-INV-009: Exportar Datos de Inventario
**Como** gerente de almacén,
**quiero** exportar el inventario actual a formato Excel/CSV,
**para** realizar análisis externos o respaldos.

### Criterios de Aceptación:
- Existe botón "Exportar Inventario" en la vista de inventario
- Se puede elegir formato: CSV o Excel (.xlsx)
- El archivo incluye: SKU, nombre, categoría, stock actual, precio costo, precio venta, valor total, punto reorden
- El nombre del archivo incluye fecha de exportación
- El archivo se descarga automáticamente al generarse
- Se incluyen todos los productos o solo los filtrados actualmente

**Prioridad:** Baja

---

## US-INV-010: Dashboard de Inventario
**Como** gerente de almacén,
**quiero** ver un dashboard con métricas clave del inventario,
**para** tener una visión rápida del estado general.

### Criterios de Aceptación:
- Se muestra: total de productos, valor total del inventario, productos con stock bajo, productos sin stock
- Se incluye gráfico de distribución de inventario por categoría
- Se muestran los 10 productos con menor stock
- Se incluye lista de últimos movimientos de inventario (top 10)
- Se actualizan las métricas en tiempo real
- Se puede seleccionar rango de fechas para algunas métricas

**Prioridad:** Media
