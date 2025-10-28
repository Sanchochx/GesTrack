# US-ORD-004: Estado de Pago del Pedido

## Historia de Usuario
**Como** personal de ventas,
**quiero** registrar el estado de pago del pedido,
**para** llevar control de cobros pendientes.

## Prioridad
**Alta**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Estados de Pago
- Estados disponibles:
  1. **Pendiente**: no se ha recibido ningún pago
  2. **Pagado Parcial**: se ha recibido pago parcial
  3. **Pagado Completo**: pago total recibido
- Indicador visual del estado de pago en lista y detalles de pedidos
- Código de colores: Pendiente (rojo), Parcial (amarillo), Completo (verde)

### CA-2: Registro de Pago
- Botón "Registrar Pago" en vista de detalles del pedido
- Modal con formulario de registro de pago:
  - Monto pagado (campo numérico requerido)
  - Método de pago (dropdown requerido): Efectivo, Tarjeta Débito, Tarjeta Crédito, Transferencia, Otro
  - Fecha del pago (por defecto: fecha actual)
  - Notas/Referencia (opcional, max 200 caracteres)
- Validación: monto debe ser positivo y no mayor al saldo pendiente

### CA-3: Cálculo de Saldo Pendiente
- Saldo pendiente = Total del pedido - Suma de pagos recibidos
- Se calcula automáticamente al registrar cada pago
- Se muestra en vista de detalles:
  - Total del pedido: $XXX.XX
  - Pagado: $XXX.XX
  - **Saldo pendiente: $XXX.XX**
- Formato destacado si hay saldo pendiente

### CA-4: Registro de Múltiples Pagos
- Se pueden registrar múltiples pagos parciales para un mismo pedido
- Cada pago se registra en tabla `payments` con:
  - order_id
  - amount
  - payment_method
  - payment_date
  - notes
  - created_by (usuario que registró)
  - created_at
- No hay límite en número de pagos parciales

### CA-5: Historial de Pagos
- Sección "Historial de Pagos" en vista de detalles del pedido
- Tabla con todos los pagos registrados:
  - Fecha de pago
  - Monto
  - Método de pago
  - Notas/Referencia
  - Registrado por (usuario)
- Orden cronológico (más reciente primero)
- Muestra suma total de pagos recibidos

### CA-6: Actualización Automática de Estado de Pago
- Al registrar un pago, el sistema actualiza automáticamente el estado:
  - Si saldo pendiente = $0.00 → "Pagado Completo"
  - Si saldo pendiente > $0 y hay al menos un pago → "Pagado Parcial"
  - Si no hay pagos → "Pendiente"
- La actualización es automática, no manual

### CA-7: Validaciones de Monto de Pago
- No se permite registrar pago de $0
- No se permite pagar más del saldo pendiente
- Si se intenta pagar más, muestra error: "El monto excede el saldo pendiente de $XXX.XX"
- Sugerencia automática: prellenar campo con saldo pendiente completo
- Opción "Pagar saldo completo" para agilizar

### CA-8: Restricción por Estado del Pedido
- Configurable: no permitir cambiar pedido a "Entregado" si hay saldo pendiente
- Muestra advertencia clara si se intenta entregar con saldo pendiente
- Admin puede forzar entrega con justificación (override)
- La política se puede configurar según modelo de negocio

### CA-9: Visualización en Lista de Pedidos
- Columna de "Estado de Pago" en tabla de pedidos
- Badge o chip con color distintivo
- Tooltip muestra monto pendiente al hacer hover
- Se puede filtrar pedidos por estado de pago

### CA-10: Confirmación y Feedback
- Al registrar pago exitoso:
  - Mensaje: "Pago de $XXX.XX registrado correctamente"
  - Actualización inmediata del historial de pagos
  - Actualización del saldo pendiente
  - Cierre automático del modal
- Si es el pago final: "Pedido pagado completamente"

## Notas Técnicas
- API endpoint: `POST /api/orders/{id}/payments`
- Request body: `{ "amount": 100.50, "payment_method": "Efectivo", "payment_date": "2025-01-15", "notes": "..." }`
- Transacción de base de datos para:
  1. Crear registro de pago
  2. Actualizar payment_status del pedido
  3. Calcular y actualizar saldo pendiente
- Usar Decimal para cálculos de montos (precisión)
- Validar que la suma de pagos no exceda el total del pedido
- Considerar zona horaria para payment_date
- Implementar soft delete para pagos (por si se necesita corregir)
- Métodos de pago configurables desde admin

## Definición de Hecho
- [ ] Frontend: Modal de registro de pago
- [ ] Frontend: Formulario con validaciones
- [ ] Frontend: Historial de pagos con tabla
- [ ] Frontend: Cálculo y visualización de saldo pendiente
- [ ] Frontend: Badge de estado de pago en lista y detalles
- [ ] Frontend: Opción "Pagar saldo completo"
- [ ] Backend: API POST /api/orders/{id}/payments
- [ ] Backend: Validación de monto vs saldo pendiente
- [ ] Backend: Cálculo automático de saldo
- [ ] Backend: Actualización automática de payment_status
- [ ] Backend: Lógica de restricción por estado de pago
- [ ] Base de datos: Tabla payments creada
- [ ] Base de datos: Enum de métodos de pago
- [ ] Base de datos: Campo payment_status en orders
- [ ] Pruebas unitarias de cálculos
- [ ] Pruebas de múltiples pagos parciales
- [ ] Pruebas de validaciones de monto
- [ ] Documentación de API

## Dependencias
- US-ORD-001 (Crear Pedido) debe estar completo
- US-ORD-002 (Cálculo de Totales) debe estar completo
- US-ORD-003 (Estados del Pedido) - integración con restricción de entrega

## Tags
`orders`, `payments`, `accounting`, `high-priority`
