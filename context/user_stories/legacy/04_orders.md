# Historias de Usuario - Gestión de Pedidos

## US-ORD-001: Crear Pedido
**Como** personal de ventas,
**quiero** crear pedidos para clientes con múltiples productos,
**para** registrar las ventas en el sistema.

### Criterios de Aceptación:
- Se selecciona el cliente desde un listado o se puede crear uno nuevo
- Se pueden agregar múltiples productos al pedido
- Para cada producto se especifica la cantidad deseada
- El sistema valida que hay stock suficiente antes de agregar el producto
- Se calcula automáticamente el subtotal por producto
- Se puede eliminar productos del pedido antes de confirmar
- Se captura fecha del pedido automáticamente
- Se asigna número de pedido único automáticamente

**Prioridad:** Alta

---

## US-ORD-002: Cálculo Automático de Totales
**Como** personal de ventas,
**quiero** que el sistema calcule automáticamente subtotal, impuestos, envío y total,
**para** no tener que hacer cálculos manuales.

### Criterios de Aceptación:
- Subtotal = suma de (precio de venta × cantidad) de todos los productos
- Se puede configurar porcentaje de impuesto (por defecto 0%)
- Se puede agregar costo de envío manualmente
- Total = subtotal + impuestos + envío
- Los cálculos se actualizan en tiempo real al modificar cantidades
- Los montos se muestran con 2 decimales
- Se muestra desglose claro de cada componente del total

**Prioridad:** Alta

---

## US-ORD-003: Gestión de Estados del Pedido
**Como** personal de ventas,
**quiero** cambiar el estado del pedido a lo largo de su ciclo de vida,
**para** mantener seguimiento del proceso de entrega.

### Criterios de Aceptación:
- Estados disponibles: Pendiente → Confirmado → Procesando → Enviado → Entregado
- Solo se puede avanzar al siguiente estado en orden
- Se registra fecha/hora y usuario de cada cambio de estado
- Se muestra historial de cambios de estado
- Al cambiar a "Confirmado", se reduce el stock automáticamente (si no se hizo al crear)
- Si el pedido se cancela, se restaura el stock
- Se pueden agregar notas al cambiar el estado

**Prioridad:** Alta

---

## US-ORD-004: Estado de Pago del Pedido
**Como** personal de ventas,
**quiero** registrar el estado de pago del pedido,
**para** llevar control de cobros pendientes.

### Criterios de Aceptación:
- Estados de pago: Pendiente, Pagado Parcial, Pagado Completo
- Se puede registrar monto pagado
- Se calcula saldo pendiente automáticamente
- Se puede registrar método de pago (efectivo, tarjeta, transferencia)
- Se puede registrar múltiples pagos parciales
- Se muestra historial de pagos con fecha y monto
- No se puede marcar como "Entregado" si el pago está pendiente (configurable)

**Prioridad:** Alta

---

## US-ORD-005: Listar Pedidos
**Como** personal de ventas,
**quiero** ver una lista de todos los pedidos registrados,
**para** dar seguimiento a las ventas.

### Criterios de Aceptación:
- Se muestra tabla con: número de pedido, cliente, fecha, total, estado del pedido, estado de pago
- La lista está paginada (20 pedidos por página)
- Se puede ordenar por: fecha, total, cliente, estado
- Se usa código de colores para estados (ej: verde=entregado, amarillo=procesando, rojo=pendiente)
- Existe botón para crear nuevo pedido
- Se muestra total de pedidos y monto total

**Prioridad:** Alta

---

## US-ORD-006: Buscar y Filtrar Pedidos
**Como** personal de ventas,
**quiero** buscar pedidos por número, cliente o fecha,
**para** encontrar rápidamente información específica.

### Criterios de Aceptación:
- Campo de búsqueda por número de pedido o nombre de cliente
- Filtro por rango de fechas
- Filtro por estado del pedido (múltiple selección)
- Filtro por estado de pago
- Los filtros se pueden combinar
- Se muestra cantidad de resultados encontrados
- Se puede limpiar todos los filtros con un botón

**Prioridad:** Media

---

## US-ORD-007: Ver Detalles del Pedido
**Como** personal de ventas,
**quiero** ver todos los detalles de un pedido específico,
**para** revisar la información completa de la venta.

### Criterios de Aceptación:
- Se muestra: número de pedido, fecha, cliente (con datos de contacto)
- Se lista cada producto con: nombre, cantidad, precio unitario, subtotal
- Se muestra: subtotal, impuestos, envío, total
- Se muestra estado actual del pedido y estado de pago
- Se incluye historial de cambios de estado
- Se muestra historial de pagos (si aplica)
- Existen botones para: editar, imprimir, cambiar estado, registrar pago

**Prioridad:** Alta

---

## US-ORD-008: Editar Pedido
**Como** personal de ventas,
**quiero** poder modificar un pedido existente antes de entregarlo,
**para** corregir errores o cambios solicitados por el cliente.

### Criterios de Aceptación:
- Solo se pueden editar pedidos en estado "Pendiente" o "Confirmado"
- Se puede agregar o eliminar productos
- Se puede modificar cantidades de productos existentes
- Se valida disponibilidad de stock al aumentar cantidades
- Si se reduce cantidad o elimina producto, el stock se restaura
- Se recalculan totales automáticamente
- Se registra la modificación con fecha/hora y usuario
- No se puede editar pedidos en estado "Enviado" o "Entregado"

**Prioridad:** Media

---

## US-ORD-009: Cancelar Pedido
**Como** personal de ventas,
**quiero** poder cancelar un pedido,
**para** manejar situaciones donde el cliente ya no desea la compra.

### Criterios de Aceptación:
- Se puede cancelar pedidos en cualquier estado excepto "Entregado"
- Se solicita confirmación y motivo de cancelación
- Al cancelar, el stock de todos los productos se restaura automáticamente
- El pedido cambia a estado "Cancelado"
- Se registra fecha/hora, usuario y motivo de cancelación
- Los pedidos cancelados no se eliminan, solo se marcan como cancelados
- Se puede filtrar para ocultar/mostrar pedidos cancelados en listados

**Prioridad:** Media

---

## US-ORD-010: Historial de Pedidos por Cliente
**Como** personal de ventas,
**quiero** ver el historial de pedidos de un cliente específico,
**para** conocer su comportamiento de compra.

### Criterios de Aceptación:
- Desde el perfil del cliente se accede a su historial de pedidos
- Se muestran todos los pedidos del cliente ordenados por fecha (más reciente primero)
- Se muestra: número de pedido, fecha, total, estado
- Se calcula total de compras del cliente
- Se muestra promedio de compra
- Se puede acceder a detalles de cada pedido
- Se puede filtrar por rango de fechas

**Prioridad:** Media

---

## US-ORD-011: Procesamiento de Devoluciones
**Como** personal de ventas,
**quiero** procesar devoluciones de productos,
**para** manejar situaciones donde el cliente regresa mercancía.

### Criterios de Aceptación:
- Se puede crear una devolución desde un pedido entregado
- Se seleccionan los productos y cantidades a devolver
- Se especifica motivo de la devolución (producto defectuoso, error en pedido, cambio de opinión)
- Al confirmar la devolución, el stock se incrementa automáticamente
- Se genera nota de crédito o reembolso según configuración
- Se registra la devolución con fecha y motivo
- La devolución queda vinculada al pedido original
- Se actualiza el estado de pago si aplica

**Prioridad:** Media

---

## US-ORD-012: Imprimir/Exportar Pedido
**Como** personal de ventas,
**quiero** imprimir o exportar la información del pedido,
**para** entregar documentación al cliente o para archivo.

### Criterios de Aceptación:
- Existe botón "Imprimir" en la vista de detalles del pedido
- Se genera formato imprimible con: logo de empresa, número de pedido, fecha, datos del cliente
- Se incluye tabla de productos con cantidades, precios y totales
- Se muestra desglose de subtotal, impuestos, envío y total
- El formato es limpio y profesional
- Se puede exportar a PDF
- Se puede enviar por email al cliente (opcional)

**Prioridad:** Baja

---

## US-ORD-013: Validación de Stock al Crear Pedido
**Como** sistema,
**quiero** validar que hay stock suficiente antes de confirmar un pedido,
**para** evitar sobreventa de productos.

### Criterios de Aceptación:
- Al agregar un producto al pedido, se valida stock disponible en tiempo real
- Si no hay stock suficiente, se muestra mensaje de error claro
- Se indica cuántas unidades hay disponibles
- No se permite agregar cantidad mayor al stock disponible
- La validación considera stock reservado en otros pedidos pendientes
- Si otro usuario compra el producto mientras se crea el pedido, se revalida al confirmar

**Prioridad:** Alta

---

## US-ORD-014: Descuentos en Pedidos
**Como** personal de ventas,
**quiero** poder aplicar descuentos a los pedidos,
**para** ofrecer promociones a los clientes.

### Criterios de Aceptación:
- Se puede aplicar descuento por porcentaje o monto fijo
- El descuento se puede aplicar al total del pedido o a productos específicos
- Se recalcula el total automáticamente al aplicar el descuento
- Se muestra claramente el descuento aplicado en el resumen
- Se requiere justificación/motivo del descuento
- Se registra quién autorizó el descuento
- Los descuentos mayores al 20% requieren aprobación de administrador

**Prioridad:** Baja
