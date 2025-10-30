# US-PROD-007: Gestionar Categorías de Productos

## Historia de Usuario
**Como** gerente de almacén,
**quiero** crear y gestionar categorías de productos,
**para** organizar mejor el catálogo.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Vista de Lista de Categorías ✅
Página dedicada a gestión de categorías que muestra:
- Tabla con columnas:
  - **Nombre**: Nombre de la categoría
  - **Descripción**: Descripción breve (truncada si es larga)
  - **Cantidad de Productos**: Contador de productos asignados
  - **Acciones**: Botones de editar y eliminar
- Botón "+ Nueva Categoría" en la parte superior
- Ordenamiento alfabético por nombre por defecto
- Búsqueda simple por nombre de categoría

### CA-2: Crear Nueva Categoría ✅
Modal o formulario para crear categoría:
- Campos:
  - **Nombre**: Campo de texto (requerido, max 100 caracteres, único)
  - **Descripción**: Área de texto (opcional, max 500 caracteres)
  - **Color** (opcional): Selector de color para identificación visual
  - **Icono** (opcional): Selector de icono predefinido
- Validaciones:
  - Nombre requerido y único (case-insensitive)
  - Si ya existe: "Esta categoría ya existe"
- Botones:
  - "Crear" (primario)
  - "Cancelar" (secundario)

### CA-3: Editar Categoría ✅
Modal o formulario precargado con datos actuales:
- Permite modificar nombre, descripción, color e icono
- Validación de nombre único (excepto el actual)
- Si se intenta usar nombre existente: "Este nombre ya está en uso"
- Confirmación antes de guardar si hay muchos productos asociados
- Mensaje: "✓ Categoría actualizada correctamente"

### CA-4: Validación para Eliminar Categoría ✅
Antes de eliminar una categoría:
- Verificar si tiene productos asignados
- Si tiene productos:
  - **No** se puede eliminar
  - Mensaje: "❌ No se puede eliminar esta categoría porque tiene X productos asignados."
  - Sugerencia: "Reasigna los productos a otra categoría primero."
  - Botón alternativo: "Ver productos" (filtra lista de productos por esa categoría)
- Si NO tiene productos:
  - Solicitar confirmación: "¿Estás seguro de eliminar esta categoría?"
  - Permitir eliminación

### CA-5: Categorías en Selectores ✅
Las categorías aparecen en selectores al crear/editar productos:
- Ordenadas alfabéticamente
- Muestra nombre y opcionalmente color/icono
- Formato: "Categoría (X productos)"
- Opción de "Crear nueva categoría" desde el selector (opcional)

### CA-6: Contador de Productos por Categoría ✅
En la lista de categorías:
- Muestra cantidad de productos asignados
- Formato: "15 productos" o "1 producto"
- Si es 0: "Sin productos"
- El número es clickeable y filtra productos de esa categoría
- Se actualiza automáticamente al crear/eliminar productos

### CA-7: Categoría por Defecto ✅
- Existe una categoría "Sin Categoría" o "General" por defecto
- Esta categoría no se puede eliminar
- Se asigna automáticamente si no se selecciona categoría al crear producto
- Permite tener productos sin categorización específica

### CA-8: Visualización con Color e Icono ✅
- Cada categoría puede tener color asociado:
  - Usado en badges, chips, cards
  - Mejora identificación visual
- Icono opcional para categoría:
  - Biblioteca de iconos predefinidos
  - Se muestra junto al nombre en lista de productos

### CA-9: Búsqueda y Filtrado de Categorías ✅
- Campo de búsqueda para filtrar categorías por nombre
- Filtro por cantidad de productos:
  - Todas
  - Con productos
  - Sin productos
- Ordenamiento:
  - Alfabético A-Z / Z-A
  - Cantidad de productos (mayor a menor / menor a mayor)

### CA-10: Reasignar Productos en Masa (Opcional)
Para categorías con productos:
- Opción de reasignar todos los productos a otra categoría
- Modal: "Reasignar X productos de '{Categoría A}' a:"
- Selector de categoría destino
- Confirmación: "¿Reasignar X productos?"
- Después de reasignar, permite eliminar categoría original

## Notas Técnicas
- API endpoints:
  - `GET /api/categories` - Listar todas las categorías
  - `POST /api/categories` - Crear categoría
  - `GET /api/categories/{id}` - Obtener categoría
  - `PUT /api/categories/{id}` - Actualizar categoría
  - `DELETE /api/categories/{id}` - Eliminar categoría
- Validación de unicidad de nombre (case-insensitive)
- Índice en columna `name` para búsquedas rápidas
- Relación con productos: Foreign Key con ON DELETE RESTRICT
- Crear categoría "General" o "Sin Categoría" en seeds/migrations
- Cache de lista de categorías (10 minutos)
- Considerar jerarquía de categorías (subcategorías) en futuro

## Definición de Hecho
- [x] Frontend: Página de gestión de categorías
- [x] Frontend: Lista de categorías con búsqueda y ordenamiento
- [x] Frontend: Modal/formulario de crear categoría
- [x] Frontend: Modal/formulario de editar categoría
- [x] Frontend: Validación para eliminar con productos
- [x] Frontend: Contador de productos por categoría
- [x] Frontend: Selector de color e icono
- [x] Frontend: Categorías en selectores de productos
- [x] Backend: API completa de CRUD categorías
- [x] Backend: Validación de unicidad de nombre
- [x] Backend: Restricción de eliminación con productos
- [x] Backend: Contador de productos por categoría
- [x] Base de datos: Tabla categories creada
- [x] Base de datos: Categoría por defecto en seeds
- [x] Relación Foreign Key con productos
- [ ] Pruebas unitarias y de integración
- [ ] Documentación de API

## Dependencias
- Epic 01 (Autenticación) debe estar completa
- Base de datos debe estar configurada

## Tags
`products`, `categories`, `crud`, `medium-priority`, `organization`
