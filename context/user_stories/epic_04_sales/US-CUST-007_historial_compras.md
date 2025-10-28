# US-CUST-007: Historial de Compras del Cliente

## Historia de Usuario
**Como** personal de ventas,
**quiero** ver el historial completo de compras de un cliente,
**para** conocer su comportamiento de compra y ofrecer mejor servicio.

## Prioridad
**Media**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Acceso al Historial
- Desde perfil del cliente (US-CUST-004): pestaña o sección "Historial de Compras"
- Botón "Ver historial completo" desde resumen de últimos pedidos
- URL: `/clientes/{id}/historial` o `/clientes/{id}/pedidos`
- Breadcrumb: Clientes > [Nombre] > Historial de Compras

### CA-2: Lista Completa de Pedidos
- Tabla con todos los pedidos del cliente:
  - Número de pedido (link a detalles)
  - Fecha del pedido
  - Productos (resumen: "3 productos")
  - Total del pedido
  - Estado del pedido (badge)
  - Estado de pago (badge)
- Orden cronológico descendente (más reciente primero)
- Paginación si hay muchos pedidos (10-20 por página)

### CA-3: Métricas Resumidas
- Panel superior con estadísticas del cliente:
  - **Total de pedidos**: cantidad total
  - **Total gastado**: suma de todos los pedidos no cancelados
  - **Promedio de compra**: total / cantidad de pedidos
  - **Frecuencia de compra**: pedidos por mes promedio
  - **Ticket más alto**: monto del pedido más grande
  - **Ticket más bajo**: monto del pedido más pequeño
- Diseño visual atractivo (cards o stats)
- Métricas actualizadas según filtros aplicados

### CA-4: Filtro por Rango de Fechas
- Selector de rango de fechas:
  - Fecha inicio
  - Fecha fin
- Datepicker para facilitar selección
- Shortcuts predefinidos:
  - Último mes
  - Últimos 3 meses
  - Últimos 6 meses
  - Este año
  - Año pasado
  - Todo el historial (por defecto)
- Al filtrar, métricas se recalculan para ese período

### CA-5: Filtro por Estado de Pedido
- Checkboxes o dropdown multiselección:
  - Pendiente
  - Confirmado
  - Procesando
  - Enviado
  - Entregado
  - Cancelado
- Por defecto: todos excepto cancelados
- Toggle "Incluir pedidos cancelados"
- Métricas se recalculan según filtro

### CA-6: Filtro por Estado de Pago
- Filtro de estado de pago:
  - Pendiente
  - Pagado Parcial
  - Pagado Completo
- Selección múltiple
- Por defecto: todos seleccionados

### CA-7: Detalles Expandibles por Pedido
- Click en fila del pedido expande detalles inline:
  - Lista de productos con cantidades y precios
  - Dirección de envío (si es diferente a la habitual)
  - Notas del pedido
  - Historial de estados
- Alternativa: botón "Ver detalles" abre vista completa del pedido
- Botones de acción rápida: Ver completo, Imprimir, Crear pedido similar

### CA-8: Productos Más Comprados
- Sección separada: "Productos favoritos de este cliente"
- Tabla o lista con top 10 productos:
  - Nombre del producto (con imagen thumbnail)
  - SKU
  - Cantidad total comprada (suma de todos los pedidos)
  - Veces comprado (en cuántos pedidos diferentes)
  - Última vez comprado (fecha)
- Orden por cantidad total descendente
- Útil para recomendaciones y upselling

### CA-9: Gráfico de Compras en el Tiempo
- Gráfico de barras o línea mostrando compras por período:
  - Eje X: períodos (meses o trimestres)
  - Eje Y: monto total de compras
- Ayuda a visualizar patrones y tendencias
- Identifica temporadas altas/bajas
- Configurable: últimos 6 meses, último año, etc.
- Solo mostrar si hay suficientes datos (mínimo 3 períodos)

### CA-10: Exportación del Historial
- Botón "Exportar historial"
- Formatos disponibles: CSV, Excel (.xlsx), PDF
- Incluye todos los pedidos (o solo filtrados)
- Campos exportados:
  - Número de pedido
  - Fecha
  - Productos (lista)
  - Subtotal, impuestos, envío, total
  - Estado
  - Estado de pago
- Encabezado con información del cliente
- Pie de página con totales resumidos
- Nombre de archivo: `Historial_[NombreCliente]_[Fecha].csv`

## Notas Técnicas
- API endpoint: `GET /api/customers/{id}/orders-history?date_from=&date_to=&status=&payment_status=&page=1&limit=20`
- Response incluye:
  - Lista de pedidos con detalles
  - Métricas calculadas según filtros
  - Top productos del cliente
  - Datos para gráfico (agrupados por período)
- Queries SQL optimizadas:
  - Para métricas:
    ```sql
    SELECT
      COUNT(*) as total_orders,
      SUM(total) as total_spent,
      AVG(total) as average_order,
      MAX(total) as highest_ticket,
      MIN(total) as lowest_ticket
    FROM orders
    WHERE customer_id = ? AND status != 'Cancelado'
    [AND filtros adicionales]
    ```
  - Para productos más comprados:
    ```sql
    SELECT p.*, SUM(oi.quantity) as total_qty, COUNT(DISTINCT o.id) as times_ordered, MAX(o.order_date) as last_ordered
    FROM products p
    JOIN order_items oi ON oi.product_id = p.id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.customer_id = ? AND o.status != 'Cancelado'
    GROUP BY p.id
    ORDER BY total_qty DESC
    LIMIT 10
    ```
  - Para gráfico temporal:
    ```sql
    SELECT DATE_TRUNC('month', order_date) as period, SUM(total) as total
    FROM orders
    WHERE customer_id = ?
    GROUP BY period
    ORDER BY period
    ```
- Considerar caché de métricas (invalidar al crear/actualizar pedido)
- Índices en: `customer_id`, `order_date`, `status`, `payment_status`
- Para exportación, usar bibliotecas:
  - CSV: csv (Python built-in)
  - Excel: openpyxl o xlsxwriter
  - PDF: ReportLab o WeasyPrint

## Definición de Hecho
- [ ] Frontend: Vista de historial de compras
- [ ] Frontend: Tabla de pedidos con paginación
- [ ] Frontend: Panel de métricas del cliente
- [ ] Frontend: Filtro por rango de fechas con shortcuts
- [ ] Frontend: Filtros por estado de pedido y pago
- [ ] Frontend: Recalculo de métricas según filtros
- [ ] Frontend: Detalles expandibles por pedido
- [ ] Frontend: Sección de productos más comprados
- [ ] Frontend: Gráfico de compras en el tiempo
- [ ] Frontend: Botón de exportación con opciones de formato
- [ ] Backend: API GET /api/customers/{id}/orders-history con filtros
- [ ] Backend: Cálculo de métricas con queries optimizadas
- [ ] Backend: Query de productos más comprados
- [ ] Backend: Datos agregados para gráfico temporal
- [ ] Backend: Endpoint de exportación (CSV, Excel, PDF)
- [ ] Pruebas de cálculo de métricas
- [ ] Pruebas de filtros combinados
- [ ] Pruebas de exportación en diferentes formatos
- [ ] Pruebas de performance con muchos pedidos
- [ ] Documentación de API

## Dependencias
- US-CUST-004 (Ver Perfil) - acceso desde perfil
- US-ORD-007 (Ver Detalles de Pedido) - links a pedidos
- Pedidos existentes del cliente
- Biblioteca de gráficos (Chart.js, Recharts, etc.)

## Tags
`customers`, `orders`, `reporting`, `analytics`, `medium-priority`
