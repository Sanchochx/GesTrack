# Historias de Usuario - Gestión de Clientes

## US-CUST-001: Registrar Nuevo Cliente
**Como** personal de ventas,
**quiero** registrar nuevos clientes en el sistema,
**para** mantener una base de datos de compradores.

### Criterios de Aceptación:
- El formulario incluye: nombre completo, email, teléfono, dirección completa (calle, ciudad, código postal, país)
- El email debe ser único en el sistema
- Se valida formato de email y teléfono
- Todos los campos son obligatorios excepto teléfono secundario
- Se puede agregar notas adicionales sobre el cliente (opcional)
- Se captura fecha de registro automáticamente
- Se muestra mensaje de confirmación al registrar exitosamente

**Prioridad:** Alta

---

## US-CUST-002: Listar Clientes
**Como** personal de ventas,
**quiero** ver una lista de todos los clientes registrados,
**para** acceder rápidamente a su información.

### Criterios de Aceptación:
- Se muestra tabla con: nombre, email, teléfono, ciudad, total de compras, última compra
- La lista está paginada (20 clientes por página)
- Se puede ordenar por: nombre, fecha de registro, total de compras, última compra
- Se muestra indicador visual de clientes activos vs inactivos
- Existe botón para agregar nuevo cliente
- Se muestra total de clientes registrados

**Prioridad:** Alta

---

## US-CUST-003: Buscar Clientes
**Como** personal de ventas,
**quiero** buscar clientes por nombre, email o teléfono,
**para** encontrar rápidamente la información que necesito.

### Criterios de Aceptación:
- Campo de búsqueda que filtra en tiempo real
- Busca coincidencias en: nombre, email, teléfono
- La búsqueda no es sensible a mayúsculas/minúsculas
- Se muestran resultados mientras se escribe (debounce de 300ms)
- Se muestra cantidad de resultados encontrados
- Si no hay resultados, se muestra mensaje claro y opción de crear nuevo cliente

**Prioridad:** Alta

---

## US-CUST-004: Ver Perfil del Cliente
**Como** personal de ventas,
**quiero** ver toda la información detallada de un cliente,
**para** revisar su historial y datos de contacto.

### Criterios de Aceptación:
- Se muestra: nombre, email, teléfono(s), dirección completa
- Se muestra fecha de registro
- Se incluyen métricas: total de pedidos, monto total de compras, promedio de compra, última compra
- Se muestra lista de últimos 5 pedidos
- Se puede acceder al historial completo de pedidos
- Existen botones para: editar información, ver todos los pedidos, crear nuevo pedido
- Se muestran notas sobre el cliente (si existen)

**Prioridad:** Alta

---

## US-CUST-005: Editar Información del Cliente
**Como** personal de ventas,
**quiero** actualizar la información de contacto de un cliente,
**para** mantener los datos actualizados.

### Criterios de Aceptación:
- El formulario se precarga con los datos actuales
- Se pueden editar todos los campos
- Se mantienen las mismas validaciones que en registro
- Si se cambia el email, se valida que no esté en uso por otro cliente
- Se registra fecha de última actualización
- Se muestra mensaje de confirmación al guardar cambios
- Se puede cancelar la edición sin guardar

**Prioridad:** Media

---

## US-CUST-006: Eliminar Cliente
**Como** administrador,
**quiero** poder eliminar clientes del sistema,
**para** limpiar registros de clientes que ya no son relevantes.

### Criterios de Aceptación:
- Solo el rol Admin puede eliminar clientes
- No se puede eliminar un cliente que tiene pedidos asociados (se debe inactivar en su lugar)
- Se solicita confirmación antes de eliminar
- Si el cliente no tiene pedidos, se elimina permanentemente
- Si tiene pedidos, se ofrece opción de inactivar
- Se muestra mensaje de confirmación al completar la acción

**Prioridad:** Baja

---

## US-CUST-007: Historial de Compras del Cliente
**Como** personal de ventas,
**quiero** ver el historial completo de compras de un cliente,
**para** conocer su comportamiento de compra y ofrecer mejor servicio.

### Criterios de Aceptación:
- Se accede desde el perfil del cliente
- Se muestran todos los pedidos ordenados por fecha (más reciente primero)
- Para cada pedido: número, fecha, productos, total, estado
- Se calcula y muestra: total gastado, promedio de compra, frecuencia de compra
- Se puede filtrar por rango de fechas
- Se puede filtrar por estado de pedido
- Se puede exportar el historial a CSV/Excel

**Prioridad:** Media

---

## US-CUST-008: Inactivar/Activar Cliente
**Como** administrador,
**quiero** poder inactivar clientes sin eliminarlos,
**para** mantener el historial pero indicar que ya no están activos.

### Criterios de Aceptación:
- Existe botón para "Inactivar Cliente" en el perfil
- Al inactivar, el cliente ya no aparece en búsquedas por defecto
- No se pueden crear nuevos pedidos para clientes inactivos
- Los pedidos históricos siguen siendo accesibles
- Se puede reactivar un cliente inactivado en cualquier momento
- Se muestra claramente el estado (Activo/Inactivo) en el perfil
- Se registra fecha de inactivación/reactivación

**Prioridad:** Media

---

## US-CUST-009: Notas sobre el Cliente
**Como** personal de ventas,
**quiero** agregar notas sobre preferencias o situaciones especiales del cliente,
**para** brindar mejor atención personalizada.

### Criterios de Aceptación:
- Se puede agregar múltiples notas al perfil del cliente
- Cada nota incluye: fecha/hora, usuario que la creó, contenido
- Se muestran en orden cronológico (más reciente primero)
- Se pueden editar notas propias
- No se pueden eliminar notas, solo editar (para mantener historial)
- Las notas se muestran visiblemente en el perfil del cliente
- Máximo 500 caracteres por nota

**Prioridad:** Baja

---

## US-CUST-010: Crear Cliente desde Pedido
**Como** personal de ventas,
**quiero** poder crear un nuevo cliente mientras creo un pedido,
**para** agilizar el proceso de venta.

### Criterios de Aceptación:
- En el formulario de crear pedido, existe opción "+ Nuevo Cliente"
- Se abre modal con formulario de registro rápido
- Campos requeridos: nombre, email, teléfono, dirección
- Al guardar, el cliente se crea y se selecciona automáticamente en el pedido
- No se interrumpe el flujo de creación del pedido
- Se validan los datos igual que en registro normal
- Se puede cancelar sin crear el cliente

**Prioridad:** Media

---

## US-CUST-011: Segmentación de Clientes
**Como** administrador,
**quiero** ver clientes segmentados por nivel de compra,
**para** identificar clientes más valiosos.

### Criterios de Aceptación:
- Se clasifican automáticamente en: VIP (>$10,000), Frecuente ($5,000-$10,000), Regular (<$5,000)
- Se muestra badge de categoría en el perfil del cliente
- Se puede filtrar lista de clientes por categoría
- La categoría se recalcula automáticamente con cada compra
- En el dashboard se muestra distribución de clientes por categoría
- Se puede personalizar los rangos de montos por administrador

**Prioridad:** Baja

---

## US-CUST-012: Exportar Lista de Clientes
**Como** administrador,
**quiero** exportar la lista de clientes a Excel/CSV,
**para** análisis externos o campañas de marketing.

### Criterios de Aceptación:
- Existe botón "Exportar" en la vista de clientes
- Se puede elegir formato: CSV o Excel (.xlsx)
- El archivo incluye: nombre, email, teléfono, dirección, fecha registro, total compras, última compra
- Se exportan solo los clientes filtrados actualmente (o todos si no hay filtro)
- El nombre del archivo incluye fecha de exportación
- El archivo se descarga automáticamente

**Prioridad:** Baja
