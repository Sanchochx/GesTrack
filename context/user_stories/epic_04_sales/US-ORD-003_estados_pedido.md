# US-ORD-003: Gestión de Estados del Pedido

## Historia de Usuario
**Como** personal de ventas,
**quiero** cambiar el estado del pedido a lo largo de su ciclo de vida,
**para** mantener seguimiento del proceso de entrega.

## Prioridad
**Alta**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Estados Disponibles
- Estados del pedido en orden secuencial:
  1. **Pendiente**: pedido recién creado, sin confirmar
  2. **Confirmado**: pedido verificado y confirmado con el cliente
  3. **Procesando**: pedido en preparación para envío
  4. **Enviado**: pedido despachado al cliente
  5. **Entregado**: pedido recibido por el cliente
  6. **Cancelado**: pedido cancelado (estado final)
- Cada estado tiene color distintivo para identificación visual

### CA-2: Flujo de Estados
- Solo se puede avanzar al siguiente estado en orden secuencial
- No se puede retroceder a un estado anterior (excepto a "Cancelado")
- Desde cualquier estado (excepto "Entregado") se puede cambiar a "Cancelado"
- Validación en frontend y backend del flujo permitido
- Transiciones permitidas:
  - Pendiente → Confirmado, Cancelado
  - Confirmado → Procesando, Cancelado
  - Procesando → Enviado, Cancelado
  - Enviado → Entregado, Cancelado
  - Entregado → (estado final, no cambia)
  - Cancelado → (estado final, no cambia)

### CA-3: Cambio de Estado
- Botón "Cambiar Estado" en vista de detalles del pedido
- Muestra modal/dropdown con estados permitidos según estado actual
- No muestra estados no permitidos por el flujo
- Requiere confirmación antes de cambiar estado
- Diálogo de confirmación muestra: estado actual → nuevo estado

### CA-4: Notas al Cambiar Estado
- Campo de texto opcional para agregar notas al cambiar estado
- Máximo 500 caracteres
- Placeholder sugiere agregar información relevante
  - Ej: "Número de guía de envío", "Nombre de quien recibió"
- Las notas se muestran en el historial de estados

### CA-5: Registro de Cambios
- Cada cambio de estado se registra en tabla `order_status_history`
- Se almacena:
  - Estado anterior
  - Estado nuevo
  - Fecha/hora del cambio (timestamp)
  - Usuario que realizó el cambio
  - Notas adicionales (si se proporcionaron)
- El historial es inmutable (no se puede editar o eliminar)

### CA-6: Visualización de Historial
- Sección "Historial de Estados" en vista de detalles del pedido
- Lista cronológica de todos los cambios (más reciente primero)
- Para cada entrada muestra:
  - Estado
  - Fecha y hora
  - Usuario
  - Notas (si existen)
- Formato timeline visual (línea vertical con puntos)
- Iconos distintivos para cada estado

### CA-7: Impacto en Inventario al Confirmar
- Al cambiar de "Pendiente" a "Confirmado":
  - Si el stock no se redujo al crear el pedido, se reduce ahora
  - Se valida disponibilidad de stock nuevamente
  - Si no hay stock suficiente, el cambio se rechaza con mensaje claro
  - Se crean movimientos de inventario si no existían
- Configurable: reducir stock al crear o al confirmar pedido

### CA-8: Restauración de Stock al Cancelar
- Al cambiar a estado "Cancelado":
  - El stock de todos los productos del pedido se restaura automáticamente
  - Se crean movimientos de inventario inversos (tipo: "Devolución por cancelación")
  - Se registra motivo de cancelación (campo requerido)
  - Se actualiza campo `cancelled_at` con timestamp
  - No se puede cancelar pedidos ya "Entregados"

### CA-9: Restricciones de Estado de Pago
- Configurable: no permitir cambiar a "Entregado" si el pago está "Pendiente"
- Muestra advertencia si se intenta entregar con pago pendiente
- Admin puede forzar el cambio de estado con justificación
- La configuración se puede ajustar según política de negocio

### CA-10: Notificaciones
- Al cambiar estado, opcionalmente notificar al cliente por email (futuro)
- Registro en logs del sistema de todos los cambios de estado
- Dashboard muestra resumen de pedidos por estado

## Notas Técnicas
- API endpoint: `PATCH /api/orders/{id}/status`
- Request body: `{ "new_status": "Confirmado", "notes": "..." }`
- Validar transición de estado permitida en backend
- Transacción de base de datos para:
  1. Actualizar estado del pedido
  2. Crear registro en order_status_history
  3. Actualizar inventario si es necesario (confirmar o cancelar)
- Usar enum para estados en backend y frontend
- Implementar máquina de estados (state machine) para validar transiciones
- Colores sugeridos:
  - Pendiente: amarillo (#FFC107)
  - Confirmado: azul (#2196F3)
  - Procesando: naranja (#FF9800)
  - Enviado: púrpura (#9C27B0)
  - Entregado: verde (#4CAF50)
  - Cancelado: rojo (#F44336)

## Definición de Hecho
- [ ] Frontend: Componente de cambio de estado
- [ ] Frontend: Modal de confirmación con campo de notas
- [ ] Frontend: Visualización de historial de estados (timeline)
- [ ] Frontend: Validación de transiciones permitidas
- [ ] Frontend: Código de colores para estados
- [ ] Backend: API PATCH /api/orders/{id}/status
- [ ] Backend: Validación de transiciones de estado (state machine)
- [ ] Backend: Lógica de actualización de inventario al confirmar
- [ ] Backend: Lógica de restauración de inventario al cancelar
- [ ] Backend: Creación de registros en order_status_history
- [ ] Base de datos: Tabla order_status_history creada
- [ ] Base de datos: Enum de estados definido
- [ ] Pruebas unitarias de state machine
- [ ] Pruebas de transacciones de inventario
- [ ] Pruebas de restricciones de flujo
- [ ] Documentación de flujo de estados

## Dependencias
- US-ORD-001 (Crear Pedido) debe estar completo
- Epic 03 (Inventario) debe estar completa
- Sistema de movimientos de inventario operativo

## Tags
`orders`, `status-management`, `workflow`, `inventory-integration`, `high-priority`
