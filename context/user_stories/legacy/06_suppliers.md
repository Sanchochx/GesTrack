# Historias de Usuario - Gestión de Proveedores

## US-SUPP-001: Registrar Proveedor
**Como** gerente de almacén,
**quiero** registrar proveedores en el sistema,
**para** mantener una base de datos de suministradores.

### Criterios de Aceptación:
- El formulario incluye: nombre de empresa, nombre de contacto, email, teléfono, dirección, sitio web (opcional)
- El email debe ser único en el sistema
- Se valida formato de email, teléfono y URL
- Se pueden especificar categorías de productos que provee
- Se puede agregar información de pago (banco, cuenta, condiciones)
- Se captura fecha de registro automáticamente
- Se muestra mensaje de confirmación al registrar exitosamente

**Prioridad:** Alta

---

## US-SUPP-002: Listar Proveedores
**Como** gerente de almacén,
**quiero** ver una lista de todos los proveedores registrados,
**para** acceder rápidamente a su información.

### Criterios de Aceptación:
- Se muestra tabla con: nombre, contacto, teléfono, email, categorías que provee, órdenes activas
- La lista está paginada (20 proveedores por página)
- Se puede ordenar por: nombre, fecha de registro
- Se muestra indicador de proveedores con órdenes de compra pendientes
- Existe botón para agregar nuevo proveedor
- Se muestra total de proveedores registrados

**Prioridad:** Alta

---

## US-SUPP-003: Ver Perfil del Proveedor
**Como** gerente de almacén,
**quiero** ver toda la información detallada de un proveedor,
**para** revisar su información de contacto y historial.

### Criterios de Aceptación:
- Se muestra: nombre empresa, contacto, email, teléfono, dirección, sitio web
- Se muestra fecha de registro
- Se listan categorías de productos que provee
- Se muestra información de pago y condiciones
- Se incluye lista de últimas 5 órdenes de compra
- Se muestran métricas: total de órdenes, monto total de compras, última orden
- Existen botones para: editar información, ver todas las órdenes, crear nueva orden

**Prioridad:** Media

---

## US-SUPP-004: Editar Proveedor
**Como** gerente de almacén,
**quiero** actualizar la información de un proveedor,
**para** mantener los datos actualizados.

### Criterios de Aceptación:
- El formulario se precarga con los datos actuales
- Se pueden editar todos los campos
- Se mantienen las mismas validaciones que en registro
- Si se cambia el email, se valida que no esté en uso
- Se registra fecha de última actualización
- Se muestra mensaje de confirmación al guardar
- Se puede cancelar sin guardar cambios

**Prioridad:** Media

---

## US-SUPP-005: Crear Orden de Compra
**Como** gerente de almacén,
**quiero** crear órdenes de compra a proveedores,
**para** solicitar reabastecimiento de productos.

### Criterios de Aceptación:
- Se selecciona el proveedor desde un listado
- Se pueden agregar múltiples productos a la orden
- Para cada producto se especifica cantidad solicitada y precio de compra
- Se calcula subtotal automáticamente
- Se puede agregar costo de envío
- Se calcula total de la orden
- Se asigna número de orden único automáticamente
- Estado inicial: "Pendiente"
- Se captura fecha de creación automáticamente
- Se puede establecer fecha estimada de entrega

**Prioridad:** Alta

---

## US-SUPP-006: Listar Órdenes de Compra
**Como** gerente de almacén,
**quiero** ver una lista de todas las órdenes de compra,
**para** dar seguimiento a pedidos a proveedores.

### Criterios de Aceptación:
- Se muestra tabla con: número de orden, proveedor, fecha, fecha estimada entrega, total, estado
- La lista está paginada (20 órdenes por página)
- Se puede ordenar por: fecha, proveedor, total, estado
- Se usa código de colores para estados
- Existe botón para crear nueva orden
- Se muestra total de órdenes y monto total
- Se destacan órdenes atrasadas (fecha estimada pasada)

**Prioridad:** Alta

---

## US-SUPP-007: Gestionar Estados de Orden de Compra
**Como** gerente de almacén,
**quiero** actualizar el estado de las órdenes de compra,
**para** mantener seguimiento del proceso de abastecimiento.

### Criterios de Aceptación:
- Estados disponibles: Pendiente → Confirmada → En Tránsito → Recibida → Cancelada
- Se puede avanzar o retroceder entre estados según sea necesario
- Se registra fecha/hora y usuario de cada cambio de estado
- Se muestra historial de cambios de estado
- Se pueden agregar notas al cambiar estado
- Solo el estado "Recibida" actualiza el inventario
- Estado "Cancelada" se puede establecer desde cualquier estado previo

**Prioridad:** Alta

---

## US-SUPP-008: Recibir Mercancía (Actualizar Inventario)
**Como** gerente de almacén,
**quiero** registrar la recepción de mercancía de una orden de compra,
**para** aumentar automáticamente el stock en inventario.

### Criterios de Aceptación:
- Solo se puede recibir órdenes en estado "En Tránsito"
- Se muestra lista de productos ordenados con cantidades
- Se puede ingresar cantidad realmente recibida (puede diferir de la solicitada)
- Si hay discrepancia, se solicita razón (faltantes, sobrantes, daños)
- Al confirmar recepción, el stock de cada producto se incrementa automáticamente
- La orden cambia a estado "Recibida"
- Se registra fecha de recepción
- Se actualiza el historial de movimientos de inventario
- Si hay productos faltantes, se puede crear incidencia

**Prioridad:** Alta

---

## US-SUPP-009: Ver Detalles de Orden de Compra
**Como** gerente de almacén,
**quiero** ver todos los detalles de una orden de compra,
**para** revisar la información completa.

### Criterios de Aceptación:
- Se muestra: número de orden, proveedor (con datos de contacto), fecha, fecha estimada entrega
- Se lista cada producto con: nombre, SKU, cantidad solicitada, precio unitario, subtotal
- Se muestra: subtotal, envío, total
- Se muestra estado actual de la orden
- Se incluye historial de cambios de estado
- Si está recibida, se muestra cantidad realmente recibida vs solicitada
- Existen botones para: editar (si está pendiente), cambiar estado, imprimir

**Prioridad:** Media

---

## US-SUPP-010: Editar Orden de Compra
**Como** gerente de almacén,
**quiero** modificar una orden de compra antes de confirmarla,
**para** corregir errores o ajustar cantidades.

### Criterios de Aceptación:
- Solo se pueden editar órdenes en estado "Pendiente"
- Se puede agregar o eliminar productos
- Se puede modificar cantidades y precios
- Se recalculan totales automáticamente
- Se registra la modificación con fecha/hora y usuario
- No se pueden editar órdenes confirmadas o recibidas
- Se muestra advertencia si hay cambios significativos

**Prioridad:** Media

---

## US-SUPP-011: Cancelar Orden de Compra
**Como** gerente de almacén,
**quiero** cancelar órdenes de compra,
**para** manejar situaciones donde ya no se necesita la mercancía.

### Criterios de Aceptación:
- Se puede cancelar órdenes en estado "Pendiente" o "Confirmada"
- Se solicita confirmación y motivo de cancelación
- No se puede cancelar órdenes "En Tránsito" o "Recibidas"
- La orden cambia a estado "Cancelada"
- Se registra fecha/hora, usuario y motivo de cancelación
- Las órdenes canceladas no se eliminan, solo se marcan
- Se puede filtrar para ocultar/mostrar órdenes canceladas

**Prioridad:** Media

---

## US-SUPP-012: Historial de Órdenes por Proveedor
**Como** gerente de almacén,
**quiero** ver el historial de órdenes de compra de un proveedor,
**para** evaluar su desempeño y confiabilidad.

### Criterios de Aceptación:
- Se accede desde el perfil del proveedor
- Se muestran todas las órdenes ordenadas por fecha (más reciente primero)
- Para cada orden: número, fecha, productos, total, estado
- Se calcula total de compras al proveedor
- Se calcula tasa de cumplimiento (órdenes a tiempo vs total)
- Se puede filtrar por rango de fechas
- Se puede filtrar por estado
- Se puede exportar a CSV/Excel

**Prioridad:** Baja

---

## US-SUPP-013: Buscar Proveedores y Órdenes
**Como** gerente de almacén,
**quiero** buscar proveedores y órdenes de compra,
**para** encontrar información específica rápidamente.

### Criterios de Aceptación:
- Campo de búsqueda para proveedores por nombre o email
- Campo de búsqueda para órdenes por número o proveedor
- Filtro de órdenes por estado
- Filtro de órdenes por rango de fechas
- Filtro de órdenes atrasadas (fecha estimada pasada)
- Los filtros se pueden combinar
- Se muestra cantidad de resultados

**Prioridad:** Media

---

## US-SUPP-014: Productos por Proveedor
**Como** gerente de almacén,
**quiero** ver qué productos provee cada proveedor,
**para** saber a quién pedir cuando necesite reabastecer.

### Criterios de Aceptación:
- En el perfil del proveedor se muestra lista de productos que provee
- Se puede vincular productos existentes al proveedor
- Se puede establecer precio preferencial por producto y proveedor
- Se muestra último precio de compra por producto
- Se puede indicar proveedor preferido para cada producto
- Al crear orden de compra, se sugieren productos del proveedor

**Prioridad:** Media

---

## US-SUPP-015: Notificaciones de Reabastecimiento
**Como** gerente de almacén,
**quiero** recibir sugerencias de productos a reordenar,
**para** facilitar la creación de órdenes de compra.

### Criterios de Aceptación:
- El sistema identifica productos con stock bajo
- Se muestra lista de productos que necesitan reabastecimiento
- Para cada producto se sugiere proveedor preferido
- Se sugiere cantidad basada en promedio de ventas
- Se puede crear orden de compra directamente desde las sugerencias
- Se agrupan sugerencias por proveedor
- Se puede marcar sugerencias como procesadas

**Prioridad:** Baja
