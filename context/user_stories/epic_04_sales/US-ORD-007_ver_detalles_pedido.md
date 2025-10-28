# US-ORD-007: Ver Detalles del Pedido

## Historia de Usuario
**Como** personal de ventas,
**quiero** ver todos los detalles de un pedido específico,
**para** revisar la información completa de la venta.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Cabecera del Pedido
- Información destacada en la parte superior:
  - Número de pedido (grande, prominente)
  - Fecha del pedido
  - Estado actual del pedido (badge con color)
  - Estado de pago (badge con color)
- Botones de acción principales:
  - Editar (si el estado lo permite)
  - Cambiar estado
  - Registrar pago
  - Imprimir
  - Cancelar pedido

### CA-2: Información del Cliente
- Sección "Cliente":
  - Nombre completo (link al perfil del cliente)
  - Email
  - Teléfono(s)
  - Dirección completa de envío
- Botón para ver historial de pedidos del cliente
- Icono para contactar cliente (email, teléfono)

### CA-3: Detalle de Productos
- Tabla con todos los productos del pedido:
  - Imagen miniatura del producto (si existe)
  - Nombre del producto
  - SKU
  - Cantidad
  - Precio unitario
  - Subtotal por producto
- Totales claramente identificados
- Layout responsive (colapsa en mobile)

### CA-4: Desglose Financiero
- Panel de totales con desglose completo:
  - **Subtotal**: suma de productos
  - **Descuento** (si aplica): -$XXX.XX o XX%
  - Subtotal después de descuento
  - **Impuesto** (XX%): $XXX.XX
  - **Envío**: $XXX.XX
  - **TOTAL**: destacado en grande
- Formato de moneda consistente
- Si hay descuento, mostrar motivo/justificación

### CA-5: Estado de Pago Detallado
- Sección "Estado de Pago":
  - Total del pedido
  - Total pagado
  - **Saldo pendiente** (destacado si > 0)
- Indicador visual: barra de progreso del pago
- Porcentaje pagado: "75% pagado"

### CA-6: Historial de Pagos
- Tabla "Pagos Recibidos" (si hay pagos):
  - Fecha de pago
  - Monto
  - Método de pago
  - Referencia/Notas
  - Registrado por
- Suma total de pagos
- Si no hay pagos: mensaje "No se han registrado pagos"
- Botón "Registrar nuevo pago"

### CA-7: Historial de Estados
- Timeline visual de cambios de estado:
  - Estado
  - Fecha y hora
  - Usuario que realizó el cambio
  - Notas (si existen)
- Formato chronológico (más reciente arriba o timeline vertical)
- Iconos distintivos por estado
- Línea conectando estados para visualizar flujo

### CA-8: Notas del Pedido
- Sección "Notas":
  - Muestra notas generales del pedido
  - Notas de cada cambio de estado
  - Fecha y autor de cada nota
- Si no hay notas: mensaje "Sin notas adicionales"

### CA-9: Información de Auditoría
- Sección colapsable "Información del Sistema":
  - Creado por: [Usuario]
  - Fecha de creación: [timestamp]
  - Última modificación: [timestamp]
  - Modificado por: [Usuario]
  - Si fue cancelado: fecha y motivo de cancelación

### CA-10: Navegación y Acciones
- Breadcrumb: Pedidos > Detalle > ORD-XXXX
- Botón "Volver a lista de pedidos"
- Navegación entre pedidos: ← Anterior | Siguiente →
- Opciones de compartir o enviar por email (futuro)
- Todas las acciones respetan permisos del usuario

## Notas Técnicas
- API endpoint: `GET /api/orders/{id}`
- Response incluye:
  - Datos del pedido completo
  - Items del pedido con detalles de productos
  - Información del cliente
  - Historial de estados
  - Historial de pagos
  - Usuario creador y modificador
- Usar eager loading para evitar N+1 queries:
  - order → order_items → products
  - order → customer
  - order → order_status_history → users
  - order → payments → users
- Cache de vista de detalles (invalidar al editar)
- Considerar permisos: algunos campos solo visibles para Admin

## Definición de Hecho
- [ ] Frontend: Layout de vista de detalles del pedido
- [ ] Frontend: Sección de cabecera con información clave
- [ ] Frontend: Sección de información del cliente
- [ ] Frontend: Tabla de productos del pedido
- [ ] Frontend: Panel de desglose financiero
- [ ] Frontend: Sección de estado de pago con barra de progreso
- [ ] Frontend: Tabla de historial de pagos
- [ ] Frontend: Timeline de historial de estados
- [ ] Frontend: Sección de notas
- [ ] Frontend: Panel de información de auditoría
- [ ] Frontend: Botones de acción con validación de permisos
- [ ] Frontend: Navegación (breadcrumb, volver, anterior/siguiente)
- [ ] Backend: API GET /api/orders/{id} con eager loading
- [ ] Backend: Validación de permisos de visualización
- [ ] Pruebas de carga de datos relacionados
- [ ] Pruebas de permisos
- [ ] Responsive design completo
- [ ] Documentación de API

## Dependencias
- US-ORD-001 (Crear Pedido) debe estar completo
- US-ORD-003 (Estados del Pedido) para mostrar historial
- US-ORD-004 (Estado de Pago) para mostrar pagos
- US-CUST-004 (Ver Perfil del Cliente) para link al cliente

## Tags
`orders`, `details-view`, `ui`, `high-priority`
