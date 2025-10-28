# US-ORD-001: Crear Pedido

## Historia de Usuario
**Como** personal de ventas,
**quiero** crear pedidos para clientes con múltiples productos,
**para** registrar las ventas en el sistema.

## Prioridad
**Alta**

## Estimación
13 Story Points

## Criterios de Aceptación

### CA-1: Selección de Cliente
- Existe selector/buscador de clientes en la parte superior del formulario
- Se puede buscar cliente por nombre, email o teléfono
- La búsqueda filtra en tiempo real con debounce de 300ms
- Si el cliente no existe, botón "+ Nuevo Cliente" abre modal de registro rápido
- Al seleccionar cliente, se muestran sus datos de contacto y dirección

### CA-2: Agregar Productos al Pedido
- Interfaz para buscar y seleccionar productos
- Búsqueda de productos por nombre o SKU
- Al seleccionar un producto, se agrega a la lista del pedido
- Para cada producto se especifica:
  - Cantidad (campo numérico, mínimo 1)
  - Precio unitario (prellenado con precio de venta, editable)
  - Subtotal (calculado automáticamente: cantidad × precio unitario)

### CA-3: Validación de Stock en Tiempo Real
- Al agregar un producto, el sistema valida stock disponible
- Si no hay stock suficiente, muestra mensaje: "Stock insuficiente. Disponible: X unidades"
- No se permite agregar cantidad mayor al stock disponible
- Indicador visual de stock disponible junto a cada producto
- La validación considera stock reservado en otros pedidos pendientes

### CA-4: Gestión de Items del Pedido
- Se pueden agregar múltiples productos al pedido
- Lista de productos agregados muestra: nombre, SKU, cantidad, precio unitario, subtotal
- Se puede eliminar productos de la lista antes de confirmar
- Se puede editar cantidad de productos ya agregados
- Al cambiar cantidad, se revalida stock y recalcula subtotal

### CA-5: Información del Pedido
- Número de pedido se asigna automáticamente (formato: ORD-YYYYMMDD-XXXX)
- Fecha del pedido se captura automáticamente (fecha actual)
- Campo de notas/comentarios del pedido (opcional, max 500 caracteres)
- Estado inicial: "Pendiente"
- Estado de pago inicial: "Pendiente"

### CA-6: Cálculo de Totales
- Subtotal: suma de todos los subtotales de productos
- Campo para porcentaje de impuesto (opcional, por defecto 0%)
- Monto de impuestos: subtotal × (porcentaje impuesto / 100)
- Campo para costo de envío (opcional, por defecto 0)
- Campo para descuento (monto o porcentaje, opcional)
- Total: subtotal + impuestos + envío - descuento
- Todos los cálculos se actualizan en tiempo real
- Montos con formato de moneda (2 decimales)

### CA-7: Validaciones del Formulario
- Cliente es requerido
- Debe haber al menos un producto en el pedido
- Todas las cantidades deben ser números enteros positivos
- Los precios deben ser números positivos
- Si hay descuento mayor a 20%, requiere justificación

### CA-8: Guardado y Confirmación
- Botón "Guardar Pedido" al final del formulario
- Al guardar, se valida disponibilidad de stock nuevamente (backend)
- Si es exitoso, se reduce el stock de todos los productos
- Se crea registro de movimiento de inventario para cada producto (tipo: "Venta")
- Muestra mensaje de confirmación: "Pedido ORD-XXXX creado exitosamente"
- Redirige a vista de detalles del pedido
- Opción alternativa: "Guardar y crear otro"

### CA-9: Manejo de Errores
- Si no hay stock al momento de confirmar (otro usuario compró), mostrar error específico
- Si falla la conexión, mantener datos en formulario (localStorage)
- Mensajes de error claros y accionables
- Validaciones tanto en frontend como backend

### CA-10: Registro de Auditoría
- Se registra el usuario que crea el pedido (created_by)
- Se registra timestamp de creación (created_at)
- Se crea primer registro en historial de estados (Estado: Pendiente)

## Notas Técnicas
- API endpoint: `POST /api/orders`
- Transacción de base de datos para:
  1. Crear pedido
  2. Crear order_items
  3. Actualizar stock de productos
  4. Crear movimientos de inventario
  5. Crear registro en order_status_history
- En caso de error, hacer rollback completo
- Implementar bloqueo pesimista en tabla de productos durante la transacción
- Validar unicidad de order_number en backend
- Formato de order_number: `ORD-{YYYYMMDD}-{secuencial de 4 dígitos}`
- Si el cliente se crea desde el modal, incluirlo automáticamente en el pedido
- Cachear lista de productos para mejorar performance del buscador

## Definición de Hecho
- [ ] Frontend: Formulario de creación de pedido implementado
- [ ] Frontend: Buscador de clientes funcional
- [ ] Frontend: Modal de creación rápida de cliente
- [ ] Frontend: Buscador de productos con validación de stock
- [ ] Frontend: Lista de items del pedido con edición y eliminación
- [ ] Frontend: Cálculo automático de totales en tiempo real
- [ ] Frontend: Validaciones de formulario
- [ ] Backend: API POST /api/orders implementado
- [ ] Backend: Validación de disponibilidad de stock
- [ ] Backend: Generación automática de order_number único
- [ ] Backend: Transacción completa de creación de pedido
- [ ] Backend: Actualización de inventario
- [ ] Backend: Creación de movimientos de inventario
- [ ] Backend: Registro de auditoría y historial de estados
- [ ] Base de datos: Tablas orders, order_items, order_status_history creadas
- [ ] Pruebas unitarias de validaciones
- [ ] Pruebas de integración de transacción completa
- [ ] Pruebas de concurrencia (dos usuarios comprando mismo producto)
- [ ] Documentación de API

## Dependencias
- US-CUST-001 (Registrar Cliente) debe estar completo
- US-CUST-010 (Crear Cliente desde Pedido) debe estar completo
- Epic 02 (Productos) debe estar completa
- Epic 03 (Inventario) debe estar completa
- Sistema de movimientos de inventario debe estar operativo

## Tags
`orders`, `sales`, `crud`, `create`, `high-priority`, `inventory-integration`
