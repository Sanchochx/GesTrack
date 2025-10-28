# Historias de Usuario - Reportes y Analíticas

## US-REP-001: Dashboard Principal
**Como** usuario del sistema,
**quiero** ver un dashboard con métricas clave al iniciar sesión,
**para** tener una visión rápida del estado del negocio.

### Criterios de Aceptación:
- Se muestra según el rol del usuario (diferentes vistas para Admin, Gerente, Ventas)
- Métricas principales: ventas del día, pedidos pendientes, productos con stock bajo, valor total del inventario
- Se incluyen gráficos visuales (barras, líneas, donas)
- Las métricas se actualizan en tiempo real
- Se puede seleccionar período de tiempo (hoy, esta semana, este mes)
- Se muestran tendencias vs período anterior (% de cambio)
- Diseño responsivo y fácil de leer

**Prioridad:** Alta

---

## US-REP-002: Reporte de Ventas Diarias
**Como** administrador,
**quiero** ver un reporte de ventas del día actual,
**para** monitorear el desempeño diario del negocio.

### Criterios de Aceptación:
- Se muestra: total de ventas del día, cantidad de pedidos, ticket promedio
- Se lista detalle de pedidos del día con: número, cliente, total, estado
- Se calcula comparación con promedio diario del mes
- Se muestra gráfico de ventas por hora del día
- Se puede filtrar por estado de pedido
- Se puede exportar a PDF/Excel
- Se actualiza automáticamente cada 5 minutos

**Prioridad:** Alta

---

## US-REP-003: Reporte de Ventas por Período
**Como** administrador,
**quiero** generar reportes de ventas por períodos personalizados,
**para** analizar tendencias de ventas.

### Criterios de Aceptación:
- Se puede seleccionar: diario, semanal, mensual, personalizado (rango de fechas)
- Se muestra: total de ventas, cantidad de pedidos, ticket promedio, productos vendidos
- Se incluye gráfico de evolución de ventas en el período
- Se muestra comparación con período anterior
- Se puede agrupar por: día, semana, mes
- Se lista top 10 de productos más vendidos en el período
- Se puede exportar a PDF/Excel/CSV

**Prioridad:** Alta

---

## US-REP-004: Productos Más Vendidos
**Como** administrador,
**quiero** ver un reporte de productos más vendidos,
**para** identificar los productos estrella del negocio.

### Criterios de Aceptación:
- Se muestra ranking de productos por cantidad vendida
- Se puede filtrar por período de tiempo
- Para cada producto: nombre, cantidad vendida, ingresos generados, margen de ganancia
- Se incluye gráfico de barras de top 10 productos
- Se puede ordenar por: cantidad vendida, ingresos, margen
- Se puede filtrar por categoría
- Se muestra porcentaje de participación en ventas totales
- Se puede exportar a Excel/CSV

**Prioridad:** Media

---

## US-REP-005: Análisis de Márgenes de Ganancia
**Como** administrador,
**quiero** analizar los márgenes de ganancia por producto,
**para** optimizar la estrategia de precios.

### Criterios de Aceptación:
- Se muestra lista de productos con: precio costo, precio venta, margen (% y $), unidades vendidas
- Se calcula ganancia total por producto (margen × unidades vendidas)
- Se puede ordenar por: margen %, margen $, ganancia total
- Se usa código de colores: verde (alto margen), amarillo (medio), rojo (bajo)
- Se incluye gráfico de distribución de productos por rango de margen
- Se puede filtrar por categoría
- Se puede filtrar por rango de fechas para considerar solo ventas del período
- Se calcula margen promedio general
- Se puede exportar a Excel

**Prioridad:** Media

---

## US-REP-006: Reporte de Inventario Actual
**Como** gerente de almacén,
**quiero** generar un reporte del estado actual del inventario,
**para** tener una visión completa del stock.

### Criterios de Aceptación:
- Se muestra lista de todos los productos con: SKU, nombre, categoría, stock actual, valor en inventario
- Se calcula valor total del inventario
- Se puede filtrar por: categoría, estado de stock (normal, bajo, sin stock)
- Se puede ordenar por: nombre, stock, valor
- Se incluye gráfico de distribución de inventario por categoría
- Se destacan productos con stock bajo o sin stock
- Se puede exportar a Excel/CSV con fecha de generación
- Se incluye timestamp del reporte

**Prioridad:** Alta

---

## US-REP-007: Reporte de Movimientos de Inventario
**Como** gerente de almacén,
**quiero** generar un reporte de movimientos de inventario en un período,
**para** auditar cambios en el stock.

### Criterios de Aceptación:
- Se selecciona rango de fechas
- Se muestra lista de movimientos con: fecha/hora, producto, tipo de movimiento, cantidad, usuario
- Se puede filtrar por: producto, tipo de movimiento, usuario
- Se muestra resumen: total de entradas, total de salidas, balance neto
- Se puede filtrar por categoría de producto
- Se incluye gráfico de entradas vs salidas en el período
- Se puede exportar a Excel/CSV
- Los movimientos están ordenados cronológicamente

**Prioridad:** Media

---

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

---

## US-REP-009: Reporte de Desempeño de Ventas por Vendedor
**Como** administrador,
**quiero** ver el desempeño individual de cada vendedor,
**para** evaluar el equipo de ventas.

### Criterios de Aceptación:
- Se muestra lista de vendedores con: cantidad de pedidos, monto total vendido, ticket promedio
- Se puede filtrar por período de tiempo
- Se calcula porcentaje de participación de cada vendedor en ventas totales
- Se incluye gráfico comparativo entre vendedores
- Se muestran top productos vendidos por cada vendedor
- Se puede ver detalle de pedidos por vendedor
- Se calcula tasa de conversión (pedidos confirmados vs pendientes)
- Se puede exportar a PDF/Excel

**Prioridad:** Media

---

## US-REP-010: Reporte de Clientes
**Como** administrador,
**quiero** generar reportes sobre la base de clientes,
**para** analizar el comportamiento de compra.

### Criterios de Aceptación:
- Se muestra: total de clientes, clientes activos (con compras en período), nuevos clientes
- Se lista top 10 clientes por monto de compra
- Se muestra distribución de clientes por nivel (VIP, Frecuente, Regular)
- Se calcula frecuencia promedio de compra
- Se identifica clientes en riesgo (sin compras en X días)
- Se puede filtrar por período
- Se incluyen gráficos: nuevos clientes por mes, distribución por nivel
- Se puede exportar a Excel/CSV

**Prioridad:** Baja

---

## US-REP-011: Análisis de Tendencias de Ventas
**Como** administrador,
**quiero** ver tendencias de ventas en el tiempo,
**para** proyectar y planificar estrategias futuras.

### Criterios de Aceptación:
- Se muestra gráfico de línea de ventas por mes (últimos 12 meses)
- Se identifican meses pico y meses bajos
- Se calcula tasa de crecimiento promedio mensual
- Se puede comparar año actual vs año anterior
- Se incluye análisis de estacionalidad
- Se pueden ver tendencias por categoría de producto
- Se muestra proyección simple para los próximos 3 meses
- Se puede exportar datos y gráficos a PDF

**Prioridad:** Baja

---

## US-REP-012: Reporte de Órdenes de Compra a Proveedores
**Como** gerente de almacén,
**quiero** generar reportes de órdenes de compra,
**para** analizar gastos y desempeño de proveedores.

### Criterios de Aceptación:
- Se muestra lista de órdenes con: número, proveedor, fecha, monto, estado
- Se puede filtrar por: proveedor, estado, rango de fechas
- Se calcula total de compras en el período
- Se muestra distribución de gastos por proveedor
- Se calcula tasa de cumplimiento por proveedor (órdenes a tiempo vs total)
- Se identifican órdenes atrasadas
- Se incluye gráfico de compras por mes
- Se puede exportar a Excel/CSV

**Prioridad:** Media

---

## US-REP-013: Exportación Masiva de Reportes
**Como** administrador,
**quiero** programar exportación automática de reportes,
**para** recibir información periódicamente sin generarla manualmente.

### Criterios de Aceptación:
- Se puede programar generación automática de reportes
- Frecuencia configurable: diaria, semanal, mensual
- Se selecciona tipo de reporte y parámetros
- Los reportes se envían por email automáticamente
- Se puede configurar destinatarios del email
- Se genera archivo Excel/PDF adjunto
- Se puede desactivar/pausar la programación
- Se mantiene historial de reportes generados

**Prioridad:** Baja

---

## US-REP-014: Dashboard Personalizable
**Como** usuario del sistema,
**quiero** personalizar mi dashboard con widgets relevantes,
**para** ver la información más importante para mi rol.

### Criterios de Aceptación:
- Se puede agregar/eliminar widgets del dashboard
- Widgets disponibles: ventas del día, pedidos pendientes, stock bajo, top productos, etc.
- Se puede reordenar widgets mediante drag-and-drop
- La configuración se guarda por usuario
- Se puede restablecer a configuración por defecto
- Cada widget tiene opción de actualizar manualmente
- Se puede redimensionar algunos widgets
- La personalización persiste entre sesiones

**Prioridad:** Baja

---

## US-REP-015: Reporte de Devoluciones
**Como** administrador,
**quiero** analizar las devoluciones de productos,
**para** identificar problemas de calidad o satisfacción.

### Criterios de Aceptación:
- Se muestra lista de devoluciones con: fecha, pedido, cliente, productos devueltos, motivo
- Se puede filtrar por rango de fechas
- Se calcula tasa de devolución (% de pedidos con devolución)
- Se identifican productos con más devoluciones
- Se agrupan devoluciones por motivo
- Se muestra impacto económico de devoluciones
- Se incluye gráfico de devoluciones por mes
- Se puede exportar a Excel/CSV

**Prioridad:** Baja
