# Historias de Usuario - Gestión de Productos

## US-PROD-001: Crear Producto
**Como** gerente de almacén,
**quiero** poder registrar nuevos productos en el sistema,
**para** mantener actualizado el catálogo de productos disponibles.

### Criterios de Aceptación:
- El formulario incluye: nombre, SKU, descripción, precio de costo, precio de venta, stock inicial, categoría, imagen
- El SKU debe ser único en el sistema
- Los precios deben ser valores numéricos positivos
- El precio de venta debe ser mayor o igual al precio de costo
- Se puede cargar una imagen del producto (formatos: JPG, PNG)
- Se calcula automáticamente el margen de ganancia
- Se muestra mensaje de confirmación al crear exitosamente
- El stock inicial se registra en el historial de movimientos

**Prioridad:** Alta

---

## US-PROD-002: Listar Productos
**Como** gerente de almacén,
**quiero** ver una lista de todos los productos registrados,
**para** tener una visión general del catálogo.

### Criterios de Aceptación:
- Se muestra una tabla con: imagen, nombre, SKU, categoría, precio de venta, stock actual
- La lista está paginada (20 productos por página)
- Se muestra indicador visual para productos con stock bajo
- Se puede ordenar por: nombre, SKU, categoría, precio, stock
- Existe un botón para acceder a crear nuevo producto
- Se muestra el total de productos registrados

**Prioridad:** Alta

---

## US-PROD-003: Buscar y Filtrar Productos
**Como** gerente de almacén,
**quiero** buscar productos por nombre, SKU o categoría,
**para** encontrar rápidamente la información que necesito.

### Criterios de Aceptación:
- Existe un campo de búsqueda que filtra por nombre o SKU en tiempo real
- Se puede filtrar por categoría mediante un selector desplegable
- Se puede filtrar por estado de stock (todos, stock normal, stock bajo, sin stock)
- Los filtros se pueden combinar
- Se muestra la cantidad de resultados encontrados
- Si no hay resultados, se muestra mensaje claro

**Prioridad:** Alta

---

## US-PROD-004: Ver Detalles de Producto
**Como** gerente de almacén,
**quiero** ver toda la información detallada de un producto,
**para** revisar sus características y estado actual.

### Criterios de Aceptación:
- Se muestra: imagen, nombre, SKU, descripción completa, categoría
- Se muestran: precio de costo, precio de venta, margen de ganancia
- Se muestra: stock actual, punto de reorden
- Se incluye fecha de creación y última actualización
- Existen botones para: editar, eliminar, ver historial de movimientos
- Se muestra alerta si el stock está por debajo del punto de reorden

**Prioridad:** Media

---

## US-PROD-005: Editar Producto
**Como** gerente de almacén,
**quiero** poder modificar la información de un producto existente,
**para** mantener los datos actualizados.

### Criterios de Aceptación:
- El formulario se precarga con los datos actuales del producto
- Se pueden editar todos los campos excepto el SKU
- Se validan los datos igual que en la creación
- Si se modifica el precio, se recalcula el margen de ganancia
- Se muestra mensaje de confirmación antes de guardar cambios importantes
- Se registra fecha de última actualización
- Se muestra mensaje de éxito al actualizar

**Prioridad:** Alta

---

## US-PROD-006: Eliminar Producto
**Como** administrador,
**quiero** poder eliminar productos del sistema,
**para** mantener limpio el catálogo de productos obsoletos.

### Criterios de Aceptación:
- Solo el rol Admin puede eliminar productos
- Se solicita confirmación antes de eliminar
- No se puede eliminar un producto que tiene pedidos asociados (se debe inactivar)
- Si el producto tiene stock, se alerta al usuario
- Al eliminar, se registra en el historial
- Se muestra mensaje de confirmación al eliminar exitosamente

**Prioridad:** Baja

---

## US-PROD-007: Gestionar Categorías de Productos
**Como** gerente de almacén,
**quiero** crear y gestionar categorías de productos,
**para** organizar mejor el catálogo.

### Criterios de Aceptación:
- Se puede crear nuevas categorías con nombre y descripción
- Se muestra lista de todas las categorías existentes
- Se puede editar el nombre y descripción de categorías
- No se puede eliminar una categoría que tiene productos asignados
- Las categorías aparecen en selectores al crear/editar productos
- Se muestra la cantidad de productos por categoría

**Prioridad:** Media

---

## US-PROD-008: Alertas de Stock Bajo
**Como** gerente de almacén,
**quiero** recibir alertas cuando productos estén por debajo del punto de reorden,
**para** poder reabastecer a tiempo.

### Criterios de Aceptación:
- Se configura un punto de reorden para cada producto
- Cuando el stock alcanza o está por debajo del punto de reorden, se marca con alerta
- En el listado de productos se muestra indicador visual de alerta
- Existe una vista de "Productos con Stock Bajo" que filtra solo productos en alerta
- El dashboard muestra contador de productos con stock bajo
- Se puede configurar notificación por email (opcional)

**Prioridad:** Alta

---

## US-PROD-009: Carga de Imagen de Producto
**Como** gerente de almacén,
**quiero** poder cargar y cambiar la imagen de un producto,
**para** tener una representación visual del mismo.

### Criterios de Aceptación:
- Se acepta formatos: JPG, PNG, WEBP
- El tamaño máximo del archivo es 5MB
- La imagen se optimiza automáticamente para web
- Se muestra preview de la imagen antes de guardar
- Se puede cambiar la imagen en cualquier momento
- Si no hay imagen, se muestra un placeholder por defecto

**Prioridad:** Media

---

## US-PROD-010: Cálculo de Margen de Ganancia
**Como** gerente de almacén,
**quiero** ver el margen de ganancia calculado automáticamente,
**para** evaluar la rentabilidad de cada producto.

### Criterios de Aceptación:
- El margen se calcula como: ((Precio Venta - Precio Costo) / Precio Costo) * 100
- El margen se muestra como porcentaje con 2 decimales
- El cálculo se actualiza automáticamente al cambiar precios
- Se usa código de colores: verde (>30%), amarillo (15-30%), rojo (<15%)
- El margen se muestra en la vista de lista y detalles del producto

**Prioridad:** Media
