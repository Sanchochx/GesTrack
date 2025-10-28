# US-ORD-009: Cancelar Pedido

## Historia de Usuario
**Como** personal de ventas,
**quiero** poder cancelar un pedido,
**para** manejar situaciones donde el cliente ya no desea la compra.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Restricciones de Cancelación
- Se pueden cancelar pedidos en cualquier estado excepto "Entregado"
- Estados que permiten cancelación: Pendiente, Confirmado, Procesando, Enviado
- Pedidos "Entregados" NO se pueden cancelar (usar devolución en su lugar)
- Pedidos ya "Cancelados" no muestran opción de cancelar
- Mensaje claro si no se puede cancelar: "Los pedidos entregados no pueden cancelarse"

### CA-2: Botón de Cancelar
- Botón "Cancelar Pedido" en vista de detalles
- Estilo distintivo (rojo, warning)
- Ubicación clara pero no prominente (acción destructiva)
- Permisos: disponible para Personal de Ventas y Admin

### CA-3: Confirmación de Cancelación
- Al hacer click en "Cancelar Pedido", muestra modal de confirmación
- Título: "¿Cancelar pedido ORD-XXXX?"
- Mensaje de advertencia:
  - "Esta acción no se puede deshacer"
  - "El stock de todos los productos será restaurado"
  - Si hay pagos: "Este pedido tiene pagos registrados por $XXX.XX"
- Campo requerido: "Motivo de cancelación"
  - Dropdown con opciones predefinidas:
    - Cliente solicitó cancelación
    - Producto no disponible
    - Error en el pedido
    - Duplicado
    - Cliente no contactable
    - Otro (especificar)
  - Si selecciona "Otro": campo de texto libre (requerido, max 200 caracteres)
- Botones: "Confirmar Cancelación" (rojo) y "No cancelar" (gris)

### CA-4: Restauración de Stock
- Al confirmar cancelación, el stock de todos los productos se restaura automáticamente
- Para cada producto del pedido:
  - Stock actual = Stock actual + Cantidad del pedido
  - Se crea movimiento de inventario:
    - Tipo: "Devolución por cancelación"
    - Cantidad: positiva (incremento)
    - Referencia: order_id
    - Notas: motivo de cancelación
- Transacción atómica: si falla algo, no se cancela el pedido

### CA-5: Actualización del Pedido
- Estado del pedido cambia a "Cancelado"
- Se registra:
  - `cancelled_at`: timestamp de cancelación
  - `cancellation_reason`: motivo ingresado
  - Se crea registro en `order_status_history`:
    - Estado: Cancelado
    - Usuario: quien canceló
    - Notas: motivo de cancelación
- Todos los cambios en una transacción de base de datos

### CA-6: Manejo de Pagos Registrados
- Si el pedido tiene pagos registrados, mostrar advertencia clara
- Opciones según política de negocio:
  - Opción A: Permitir cancelación, pero marcar que se debe reembolsar
  - Opción B: Generar nota de crédito automática
  - Opción C: Requerir aprobación de Admin para cancelar pedidos con pagos
- Los registros de pago NO se eliminan, se mantienen para auditoría
- Se puede agregar nota de "Reembolso pendiente" al pedido cancelado

### CA-7: Visualización de Pedidos Cancelados
- En lista de pedidos, los cancelados se muestran con badge rojo "Cancelado"
- Texto tachado o gris para indicar cancelación visual
- Filtro "Mostrar cancelados" (por defecto ocultos)
- En detalles del pedido cancelado:
  - Banner rojo en la parte superior: "Este pedido fue cancelado"
  - Sección "Información de Cancelación":
    - Cancelado el: [fecha/hora]
    - Cancelado por: [usuario]
    - Motivo: [texto del motivo]
- No se pueden realizar acciones sobre pedidos cancelados (editar, cambiar estado, etc.)

### CA-8: Notificación de Cancelación
- Mensaje de confirmación al cancelar exitosamente:
  - "Pedido ORD-XXXX cancelado correctamente"
  - "El stock ha sido restaurado"
- Opcional: enviar email al cliente notificando la cancelación (futuro)
- Log de auditoría registra la cancelación

### CA-9: Reversión de Cancelación (Opcional)
- Solo Admin puede "reactivar" un pedido cancelado en casos excepcionales
- Requiere justificación
- Al reactivar:
  - Vuelve a estado "Pendiente"
  - Reduce el stock nuevamente
  - Valida disponibilidad de stock actual
  - Registra reactivación en historial
- Consideración: generalmente NO se debe permitir reactivar para mantener integridad

### CA-10: Reportes y Métricas
- Los pedidos cancelados se excluyen de métricas de ventas activas
- Se incluyen en reportes de "Pedidos cancelados" separados
- Mantener para análisis: tasa de cancelación, motivos más comunes
- En dashboard: métrica de "X pedidos cancelados este mes"

## Notas Técnicas
- API endpoint: `POST /api/orders/{id}/cancel` o `PATCH /api/orders/{id}` con action=cancel
- Request body: `{ "cancellation_reason": "texto", "notes": "..." }`
- Validación en backend:
  - Estado actual permite cancelación
  - Motivo es requerido y válido
  - Usuario tiene permisos
- Transacción de base de datos:
  1. Actualizar orden (status, cancelled_at, cancellation_reason)
  2. Crear registro en order_status_history
  3. Restaurar stock de todos los order_items
  4. Crear movimientos de inventario inversos
  5. Si hay pagos, marcar para reembolso (según política)
- Usar soft delete en vez de hard delete para mantener historial
- Índice en campo `cancelled_at` para filtros eficientes
- Considerar webhook o evento para notificaciones

## Definición de Hecho
- [ ] Frontend: Botón "Cancelar Pedido"
- [ ] Frontend: Modal de confirmación con advertencias
- [ ] Frontend: Campo de motivo de cancelación con opciones
- [ ] Frontend: Validación de estado cancelable
- [ ] Frontend: Advertencia si hay pagos registrados
- [ ] Frontend: Visualización de pedidos cancelados (badge, estilo)
- [ ] Frontend: Sección de información de cancelación en detalles
- [ ] Frontend: Filtro para mostrar/ocultar cancelados
- [ ] Backend: API POST /api/orders/{id}/cancel
- [ ] Backend: Validación de estado y permisos
- [ ] Backend: Transacción de cancelación completa
- [ ] Backend: Restauración automática de stock
- [ ] Backend: Creación de movimientos de inventario
- [ ] Backend: Registro en order_status_history
- [ ] Backend: Manejo de pedidos con pagos
- [ ] Base de datos: Campos cancelled_at, cancellation_reason
- [ ] Pruebas de cancelación con restauración de stock
- [ ] Pruebas de validaciones (estado, permisos)
- [ ] Pruebas de transacción completa
- [ ] Documentación de proceso de cancelación

## Dependencias
- US-ORD-003 (Estados del Pedido) debe estar completo
- US-ORD-007 (Ver Detalles) para acceder a cancelación
- Epic 03 (Inventario) para restauración de stock
- US-ORD-004 (Pagos) para manejo de pedidos con pagos

## Tags
`orders`, `cancellation`, `inventory-integration`, `medium-priority`
