# US-ORD-008: Editar Pedido

## Historia de Usuario
**Como** personal de ventas,
**quiero** poder modificar un pedido existente antes de entregarlo,
**para** corregir errores o cambios solicitados por el cliente.

## Prioridad
**Media**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Restricciones de Edición
- Solo se pueden editar pedidos en estado "Pendiente" o "Confirmado"
- Pedidos en estado "Procesando", "Enviado", "Entregado" o "Cancelado" NO se pueden editar
- Mensaje claro si el pedido no es editable: "Este pedido no puede editarse porque está en estado [Estado]"
- Botón "Editar" solo visible/habilitado si el pedido es editable

### CA-2: Modo de Edición
- Botón "Editar" en vista de detalles del pedido
- Al hacer click, carga formulario de edición similar al de creación
- Todos los campos precargados con valores actuales
- Título indica: "Editar Pedido ORD-XXXX"
- Botones: "Guardar Cambios" y "Cancelar"

### CA-3: Edición de Cliente
- Se puede cambiar el cliente del pedido
- Selector/buscador de clientes como en creación
- Validación: confirmar si hay cambio de cliente
- Diálogo de confirmación: "¿Estás seguro de cambiar el cliente de este pedido?"

### CA-4: Agregar Productos
- Se pueden agregar nuevos productos al pedido
- Mismo buscador de productos que en creación
- Validación de stock disponible para nuevos productos
- Los productos agregados se suman a la lista existente

### CA-5: Eliminar Productos
- Se pueden eliminar productos del pedido
- Botón "Eliminar" o icono [x] junto a cada producto
- Confirmación antes de eliminar: "¿Eliminar [Producto] del pedido?"
- Al eliminar, el stock de ese producto se restaura automáticamente
- Se crea movimiento de inventario inverso (tipo: "Ajuste por edición de pedido")
- No se puede eliminar todos los productos (mínimo 1 requerido)

### CA-6: Modificar Cantidades
- Se pueden cambiar cantidades de productos existentes
- Campo numérico editable por cada producto
- Al aumentar cantidad:
  - Validar stock disponible
  - Si no hay stock: mensaje "Stock insuficiente. Disponible: X unidades"
  - Si hay stock: reducir stock adicional
  - Crear movimiento de inventario del stock adicional
- Al reducir cantidad:
  - Restaurar stock liberado
  - Crear movimiento de inventario inverso

### CA-7: Modificar Precios Unitarios
- Se pueden editar precios unitarios de productos (casos especiales)
- Validación: precio debe ser positivo
- Justificación requerida si el precio cambia más del 10%
- Se recalcula subtotal por producto automáticamente

### CA-8: Recalculo de Totales
- Todos los totales se recalculan automáticamente al modificar:
  - Productos
  - Cantidades
  - Precios
  - Descuentos
  - Envío
  - Impuestos
- Muestra comparación: "Total anterior: $XXX | Nuevo total: $YYY"
- Si el nuevo total es mayor y hay pagos registrados, actualiza saldo pendiente

### CA-9: Validaciones al Guardar
- Validar disponibilidad de stock actual (por si cambió desde que se abrió el formulario)
- Si no hay stock suficiente: error específico por producto
- Validar que haya al menos un producto en el pedido
- Validar que todas las cantidades sean positivas
- Transacción completa: si falla algo, no se guarda nada

### CA-10: Registro de Cambios
- Se registra en logs/auditoría:
  - Fecha/hora de la modificación
  - Usuario que modificó
  - Qué campos cambiaron (antes/después)
  - Productos agregados/eliminados
  - Cambios en cantidades
- Opcional: campo de "Motivo de edición" para documentar
- Los movimientos de inventario incluyen referencia al pedido editado

## Notas Técnicas
- API endpoint: `PUT /api/orders/{id}` o `PATCH /api/orders/{id}`
- Validación en backend de estado permitido para edición
- Transacción de base de datos que incluye:
  1. Actualizar orden (order)
  2. Actualizar/crear/eliminar order_items
  3. Actualizar stock de productos afectados
  4. Crear movimientos de inventario (ajustes)
  5. Actualizar totales del pedido
  6. Crear registro de auditoría
- Bloqueo optimista: validar que el pedido no fue modificado por otro usuario
- Usar versioning del pedido (updated_at) para detectar conflictos
- Calcular diferencias (diff) entre estado original y editado
- Restaurar stock de productos eliminados o con cantidad reducida
- Reducir stock de productos nuevos o con cantidad aumentada

## Definición de Hecho
- [ ] Frontend: Formulario de edición de pedido
- [ ] Frontend: Precarga de datos actuales
- [ ] Frontend: Validación de estado editable
- [ ] Frontend: Agregar/eliminar productos
- [ ] Frontend: Edición de cantidades con validación
- [ ] Frontend: Edición de precios con justificación
- [ ] Frontend: Recalculo automático de totales
- [ ] Frontend: Comparación de totales (antes/después)
- [ ] Frontend: Confirmaciones de cambios críticos
- [ ] Backend: API PUT/PATCH /api/orders/{id}
- [ ] Backend: Validación de estado editable
- [ ] Backend: Validación de stock en tiempo real
- [ ] Backend: Transacción completa de actualización
- [ ] Backend: Ajustes de inventario (productos agregados/eliminados/modificados)
- [ ] Backend: Registro de auditoría de cambios
- [ ] Backend: Bloqueo optimista (detección de conflictos)
- [ ] Pruebas de edición con múltiples cambios
- [ ] Pruebas de validación de stock
- [ ] Pruebas de transacciones y rollback
- [ ] Pruebas de concurrencia (dos usuarios editando mismo pedido)

## Dependencias
- US-ORD-001 (Crear Pedido) debe estar completo
- US-ORD-007 (Ver Detalles) para acceder a edición
- Epic 03 (Inventario) para ajustes de stock

## Tags
`orders`, `crud`, `edit`, `inventory-integration`, `medium-priority`
