# US-ORD-010: Historial de Pedidos por Cliente

## Historia de Usuario
**Como** personal de ventas,
**quiero** ver el historial de pedidos de un cliente específico,
**para** conocer su comportamiento de compra.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Acceso al Historial
- Desde el perfil del cliente, existe pestaña o sección "Historial de Pedidos"
- En vista de detalles de pedido, link "Ver otros pedidos de este cliente"
- En selector de clientes al crear pedido, icono para ver historial
- Breadcrumb: Clientes > [Nombre Cliente] > Historial de Pedidos

### CA-2: Lista de Pedidos del Cliente
- Tabla con todos los pedidos del cliente:
  - Número de pedido (link a detalles)
  - Fecha del pedido
  - Cantidad de productos
  - Total del pedido
  - Estado del pedido (badge con color)
  - Estado de pago (badge)
- Orden: más reciente primero (descendente por fecha)
- Paginación si hay muchos pedidos (10-20 por página)

### CA-3: Métricas del Cliente
- Panel de resumen en la parte superior:
  - **Total de pedidos**: número total de pedidos realizados
  - **Total gastado**: suma de todos los pedidos (excluir cancelados)
  - **Promedio de compra**: total gastado / número de pedidos
  - **Última compra**: fecha del pedido más reciente
  - **Primera compra**: fecha del pedido más antiguo
- Diseño visual atractivo (cards o stats)
- Formato de moneda para montos

### CA-4: Filtro por Rango de Fechas
- Selector de rango de fechas para filtrar historial
- Datepicker con fecha inicio y fecha fin
- Shortcuts: Último mes, Últimos 3 meses, Últimos 6 meses, Este año, Todo
- Por defecto: "Todo" (todos los pedidos)
- Al filtrar, las métricas se recalculan según el rango seleccionado
- Indicador visible del filtro aplicado

### CA-5: Filtro por Estado
- Checkboxes o dropdown para filtrar por estado de pedido:
  - Pendiente
  - Confirmado
  - Procesando
  - Enviado
  - Entregado
  - Cancelado
- Por defecto: todos excepto cancelados
- Toggle "Incluir cancelados"
- Las métricas se recalculan según filtros

### CA-6: Detalles Expandibles (Opcional)
- Click en fila del pedido muestra/oculta detalles inline:
  - Lista de productos del pedido
  - Cantidades y precios
  - Información de envío
  - Notas
- Alternativa: link directo a vista completa de detalles del pedido
- Botones de acción rápida: Ver completo, Reordenar (futuro)

### CA-7: Productos Más Comprados
- Sección "Productos favoritos" o "Productos más comprados"
- Lista de top 5-10 productos que el cliente ha comprado más veces:
  - Nombre del producto
  - Cantidad total comprada (suma de todos los pedidos)
  - Frecuencia (número de pedidos que lo incluyen)
- Útil para sugerir productos en próximas ventas

### CA-8: Gráfico de Compras en el Tiempo (Opcional)
- Gráfico de línea o barras mostrando:
  - Eje X: meses
  - Eje Y: monto total de compras
- Ayuda a visualizar tendencias y estacionalidad
- Período configurable: último año, últimos 6 meses, etc.
- Solo si hay suficientes datos (al menos 3 meses)

### CA-9: Exportación del Historial
- Botón "Exportar historial" (CSV o PDF)
- Incluye todos los pedidos del cliente (o filtrados)
- Campos: número pedido, fecha, productos, total, estado
- Encabezado con información del cliente
- Nombre de archivo: "Historial_[NombreCliente]_[Fecha].csv"

### CA-10: Estado Vacío
- Si el cliente no tiene pedidos:
  - Mensaje: "[Cliente] aún no ha realizado ningún pedido"
  - Ilustración o icono
  - Botón "Crear primer pedido" que abre formulario con cliente pre-seleccionado

## Notas Técnicas
- API endpoint: `GET /api/customers/{id}/orders?date_from=&date_to=&status=`
- Response incluye:
  - Lista de pedidos del cliente
  - Métricas calculadas: total_orders, total_spent, average_order, last_purchase, first_purchase
  - Top productos (query separada o incluida)
- Optimizar query con índices en: `customer_id`, `order_date`, `status`
- Usar agregación SQL para calcular métricas:
  ```sql
  SELECT
    COUNT(*) as total_orders,
    SUM(total) as total_spent,
    AVG(total) as average_order,
    MAX(order_date) as last_purchase,
    MIN(order_date) as first_purchase
  FROM orders
  WHERE customer_id = X AND status != 'Cancelado'
  ```
- Para productos más comprados:
  ```sql
  SELECT product_id, SUM(quantity), COUNT(DISTINCT order_id)
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.customer_id = X
  GROUP BY product_id
  ORDER BY SUM(quantity) DESC
  LIMIT 10
  ```
- Cachear métricas del cliente (invalidar al crear/editar pedido)

## Definición de Hecho
- [ ] Frontend: Vista de historial de pedidos del cliente
- [ ] Frontend: Tabla de pedidos con paginación
- [ ] Frontend: Panel de métricas del cliente
- [ ] Frontend: Filtro por rango de fechas
- [ ] Frontend: Filtro por estado de pedido
- [ ] Frontend: Recalculo de métricas según filtros
- [ ] Frontend: Sección de productos más comprados
- [ ] Frontend: Exportación de historial (CSV/PDF)
- [ ] Frontend: Estado vacío cuando no hay pedidos
- [ ] Frontend: Links de navegación y acceso
- [ ] Backend: API GET /api/customers/{id}/orders con filtros
- [ ] Backend: Cálculo de métricas del cliente
- [ ] Backend: Query de productos más comprados
- [ ] Backend: Optimización con índices
- [ ] Backend: Paginación de resultados
- [ ] Pruebas de cálculo de métricas
- [ ] Pruebas de filtros combinados
- [ ] Pruebas de performance con muchos pedidos
- [ ] Documentación de API

## Dependencias
- US-CUST-004 (Ver Perfil del Cliente) para integración
- US-ORD-007 (Ver Detalles del Pedido) para links
- Pedidos existentes en el sistema

## Tags
`orders`, `customers`, `reporting`, `analytics`, `medium-priority`
