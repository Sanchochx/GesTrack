# US-ORD-011: Procesamiento de Devoluciones

## Historia de Usuario
**Como** personal de ventas,
**quiero** procesar devoluciones de productos,
**para** manejar situaciones donde el cliente regresa mercancía.

## Prioridad
**Media**

## Estimación
13 Story Points

## Criterios de Aceptación

### CA-1: Restricciones para Devoluciones
- Solo se pueden crear devoluciones para pedidos en estado "Entregado"
- Pedidos en otros estados no pueden tener devoluciones
- Se puede configurar ventana de tiempo para devoluciones (ej: 30 días desde entrega)
- Si el pedido supera la ventana: mensaje "Este pedido ya no acepta devoluciones"
- Botón "Procesar Devolución" visible solo en pedidos entregados elegibles

### CA-2: Crear Devolución
- Botón "Procesar Devolución" en vista de detalles del pedido
- Abre modal/página "Nueva Devolución para Pedido ORD-XXXX"
- Muestra lista de todos los productos del pedido original:
  - Nombre del producto
  - Cantidad comprada
  - Precio unitario
  - Checkbox para seleccionar para devolución
  - Campo de cantidad a devolver (si se selecciona)
- Se pueden devolver uno o múltiples productos
- Se puede devolver cantidad parcial de un producto

### CA-3: Selección de Productos a Devolver
- Checkbox junto a cada producto del pedido
- Al marcar checkbox, habilita campo de cantidad
- Validación: cantidad a devolver ≤ cantidad comprada
- Si cantidad comprada = 1, no mostrar campo (devolver 1)
- Resumen: "Devolviendo X productos de Y totales"
- Subtotal de la devolución se calcula automáticamente

### CA-4: Motivo de Devolución
- Campo requerido: "Motivo de la devolución"
- Dropdown con opciones predefinidas:
  - Producto defectuoso/dañado
  - Producto incorrecto (error en pedido)
  - Cliente cambió de opinión
  - Producto no cumple expectativas
  - Duplicado
  - Otro (especificar)
- Si selecciona "Otro": campo de texto libre (requerido, max 300 caracteres)
- Campo adicional opcional: "Notas sobre la devolución"

### CA-5: Cálculo del Monto de Devolución
- Monto de devolución = suma de (cantidad devuelta × precio unitario) de cada producto
- Se calcula automáticamente según productos seleccionados
- Muestra: "Monto a reembolsar: $XXX.XX"
- Considera descuentos proporcionales del pedido original (opcional)
- No incluye costo de envío en el reembolso (configurable)

### CA-6: Confirmación de Devolución
- Al confirmar devolución:
  - Se crea registro en tabla `returns` con:
    - order_id
    - return_date (automático)
    - reason
    - status (inicial: "Pendiente")
    - total_amount
    - created_by
  - Se crean registros en `return_items` por cada producto:
    - return_id
    - product_id
    - quantity
    - reason específico (si aplica)
- Transacción atómica de base de datos

### CA-7: Actualización Automática de Inventario
- Al confirmar devolución (o al aprobarla, según flujo):
  - Stock de cada producto devuelto se incrementa automáticamente
  - Se crean movimientos de inventario:
    - Tipo: "Devolución"
    - Cantidad: positiva (incremento)
    - Referencia: return_id y order_id
    - Notas: motivo de devolución
- Validación: no permitir cantidades negativas en stock

### CA-8: Estados de la Devolución
- Estados posibles:
  1. **Pendiente**: devolución creada, esperando recepción de productos
  2. **Aprobada**: productos recibidos, devolución aceptada
  3. **Rechazada**: devolución no aceptada (productos no devueltos o fuera de política)
- Flujo configurable: auto-aprobar o requerir aprobación manual
- Al cambiar estado, registrar fecha/hora y usuario
- Solo Admin puede rechazar devoluciones

### CA-9: Gestión de Reembolso/Nota de Crédito
- Opciones según política de negocio:
  - **Reembolso**: devolver dinero al cliente
    - Se puede crear registro de pago negativo
    - O campo específico de reembolso pendiente
  - **Nota de crédito**: cliente obtiene crédito para futuras compras
    - Se registra crédito disponible en perfil del cliente
  - **Intercambio**: reemplazar producto por otro (futuro)
- Al aprobar devolución, seleccionar método de compensación
- Registrar referencia de reembolso (número de transferencia, etc.)

### CA-10: Visualización de Devoluciones
- Sección "Devoluciones" en vista de detalles del pedido
- Tabla con devoluciones asociadas:
  - ID de devolución
  - Fecha de devolución
  - Productos devueltos (resumen)
  - Monto
  - Motivo
  - Estado (badge)
- Si no hay devoluciones: "No hay devoluciones para este pedido"
- Link para ver detalles completos de cada devolución
- En perfil del cliente: historial de devoluciones

### CA-11: Lista de Devoluciones (Global)
- Vista separada: "Gestión de Devoluciones"
- Tabla con todas las devoluciones del sistema:
  - ID devolución
  - Número de pedido (link)
  - Cliente
  - Fecha
  - Monto
  - Estado
  - Acciones
- Filtros: por estado, rango de fechas, cliente
- Paginación y búsqueda

### CA-12: Validaciones
- No se puede devolver más cantidad de la comprada
- No se pueden crear múltiples devoluciones que sumen más de lo comprado
- Validar que el pedido original esté entregado y pagado (configurable)
- Validar ventana de tiempo para devoluciones
- Todas las validaciones en frontend y backend

## Notas Técnicas
- API endpoints:
  - `POST /api/orders/{id}/returns` - crear devolución
  - `GET /api/orders/{id}/returns` - listar devoluciones de un pedido
  - `PATCH /api/returns/{id}/status` - cambiar estado de devolución
  - `GET /api/returns` - lista global de devoluciones
- Transacción de base de datos al crear devolución:
  1. Crear registro en returns
  2. Crear registros en return_items
  3. Si auto-aprobar: actualizar stock e inventario
  4. Si reembolso: crear registro de pago negativo o actualizar crédito del cliente
- Considerar estados intermedios: Pendiente → En revisión → Aprobada/Rechazada
- Calcular tasa de devolución por producto (analytics)
- Notificar al cliente sobre estado de devolución (email)
- Vincular movimientos de inventario con returns para trazabilidad completa

## Definición de Hecho
- [ ] Frontend: Modal/página de crear devolución
- [ ] Frontend: Selección de productos y cantidades
- [ ] Frontend: Campo de motivo con opciones
- [ ] Frontend: Cálculo de monto de devolución
- [ ] Frontend: Validaciones de cantidades
- [ ] Frontend: Sección de devoluciones en detalles de pedido
- [ ] Frontend: Vista global de devoluciones
- [ ] Frontend: Cambio de estado de devolución
- [ ] Backend: API POST /api/orders/{id}/returns
- [ ] Backend: Validación de pedido elegible para devolución
- [ ] Backend: Validación de cantidades
- [ ] Backend: Transacción de creación de devolución
- [ ] Backend: Actualización automática de inventario
- [ ] Backend: API de cambio de estado
- [ ] Backend: API de lista global de devoluciones
- [ ] Base de datos: Tablas returns y return_items
- [ ] Base de datos: Enum de estados de devolución
- [ ] Integración con sistema de reembolsos/créditos
- [ ] Pruebas de creación de devolución
- [ ] Pruebas de actualización de inventario
- [ ] Pruebas de validaciones
- [ ] Documentación de flujo de devoluciones

## Dependencias
- US-ORD-003 (Estados del Pedido) - solo pedidos entregados
- US-ORD-007 (Ver Detalles) para acceso a devoluciones
- Epic 03 (Inventario) para actualización de stock
- US-ORD-004 (Pagos) para integración de reembolsos

## Tags
`orders`, `returns`, `inventory-integration`, `customer-service`, `medium-priority`
