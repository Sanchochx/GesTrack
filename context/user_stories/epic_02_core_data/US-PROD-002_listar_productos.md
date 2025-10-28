# US-PROD-002: Listar Productos

## Historia de Usuario
**Como** gerente de almacén,
**quiero** ver una lista de todos los productos registrados,
**para** tener una visión general del catálogo.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Estructura de la Tabla
La tabla muestra las siguientes columnas:
- **Imagen**: Thumbnail del producto (100x100px)
- **Nombre**: Nombre completo del producto
- **SKU**: Código único del producto
- **Categoría**: Nombre de la categoría
- **Precio de Venta**: Formato moneda con 2 decimales
- **Stock Actual**: Cantidad disponible con indicador visual
- **Acciones**: Botones para ver, editar, eliminar

### CA-2: Paginación
- La lista muestra 20 productos por página
- Controles de navegación: Primera, Anterior, Siguiente, Última
- Muestra información: "Mostrando X-Y de Z productos"
- Se mantiene la página actual al realizar acciones
- Selector para cambiar cantidad de items por página (10, 20, 50, 100)

### CA-3: Indicador de Stock Bajo
- Productos con stock ≤ punto de reorden se marcan con:
  - Icono de alerta (⚠️) en color naranja/rojo
  - Clase CSS diferente para resaltar la fila
  - Tooltip al pasar mouse: "Stock bajo: reorden en X unidades"
- Productos sin stock (stock = 0):
  - Marcador "SIN STOCK" en rojo
  - Fila con fondo tenue rojo

### CA-4: Ordenamiento
Se puede ordenar la tabla por:
- **Nombre**: Alfabético A-Z / Z-A
- **SKU**: Alfabético A-Z / Z-A
- **Categoría**: Alfabético A-Z / Z-A
- **Precio**: Menor a Mayor / Mayor a Menor
- **Stock**: Menor a Mayor / Mayor a Menor
- Indicador visual de columna ordenada (flecha ↑↓)
- Orden por defecto: Nombre A-Z

### CA-5: Botón de Nuevo Producto
- Botón visible en la parte superior derecha: "+ Nuevo Producto"
- Color destacado (primario)
- Redirige al formulario de creación de producto
- Solo visible para usuarios con permisos de creación

### CA-6: Contador Total
- Se muestra el total de productos registrados: "Total: X productos"
- Se actualiza según filtros aplicados: "X de Y productos"
- Estadísticas adicionales:
  - Productos con stock normal
  - Productos con stock bajo
  - Productos sin stock

### CA-7: Acciones Rápidas
- **Ver**: Icono de ojo, abre vista de detalles
- **Editar**: Icono de lápiz, abre formulario de edición
- **Eliminar**: Icono de papelera, solicita confirmación
- Tooltips en cada icono
- Los iconos se deshabilitan según permisos del usuario

### CA-8: Vista Responsive
- En móviles, la tabla se adapta a cards
- Cada card muestra: imagen, nombre, SKU, precio, stock
- Acciones disponibles en menú desplegable (⋮)

## Notas Técnicas
- API endpoint: `GET /api/products?page={page}&limit={limit}&sort={field}&order={asc|desc}`
- Usar paginación del lado del servidor para mejor rendimiento
- Implementar lazy loading de imágenes
- Cache de lista de productos (5 minutos)
- Usar componente DataTable reutilizable
- Optimización: No cargar imágenes en alta resolución, solo thumbnails

## Definición de Hecho
- [ ] Frontend: Componente de tabla de productos implementado
- [ ] Frontend: Paginación funcional
- [ ] Frontend: Ordenamiento por columnas
- [ ] Frontend: Indicadores visuales de stock bajo
- [ ] Frontend: Botón de nuevo producto con permisos
- [ ] Frontend: Acciones rápidas (ver, editar, eliminar)
- [ ] Frontend: Vista responsive (cards en móvil)
- [ ] Backend: API GET /api/products con paginación
- [ ] Backend: Soporte para ordenamiento
- [ ] Backend: Cálculo de contadores y estadísticas
- [ ] Lazy loading de imágenes
- [ ] Pruebas unitarias y de integración
- [ ] Documentación de API

## Dependencias
- US-PROD-001 (Crear Producto) debe estar completo
- US-PROD-007 (Categorías) debe estar completo
- Epic 01 (Autenticación y permisos) debe estar completa

## Tags
`products`, `list`, `crud`, `read`, `high-priority`, `pagination`
