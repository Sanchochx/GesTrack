# US-PROD-003: Buscar y Filtrar Productos

## Historia de Usuario
**Como** gerente de almacén,
**quiero** buscar productos por nombre, SKU o categoría,
**para** encontrar rápidamente la información que necesito.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Campo de Búsqueda
- Campo de búsqueda visible en la parte superior de la lista de productos
- Placeholder: "Buscar por nombre o SKU..."
- Búsqueda en tiempo real (debounce de 300ms)
- Filtra resultados mientras el usuario escribe
- Icono de búsqueda (🔍) dentro del campo
- Botón para limpiar búsqueda (X) cuando hay texto

### CA-2: Búsqueda por Nombre y SKU
- La búsqueda funciona en los campos: nombre y SKU
- No distingue entre mayúsculas y minúsculas (case-insensitive)
- Búsqueda parcial: encuentra "prod" en "Producto"
- Resalta el texto encontrado en los resultados (opcional)
- Búsqueda desde el primer carácter ingresado

### CA-3: Filtro por Categoría
- Selector desplegable de categorías
- Opción por defecto: "Todas las categorías"
- Lista alfabética de categorías disponibles
- Muestra cantidad de productos entre paréntesis: "Electrónica (15)"
- Al seleccionar, filtra instantáneamente la lista
- Se puede combinar con búsqueda de texto

### CA-4: Filtro por Estado de Stock
- Selector desplegable de estado de stock:
  - **Todos**: Muestra todos los productos
  - **Stock Normal**: Productos con stock > punto de reorden
  - **Stock Bajo**: Productos con stock ≤ punto de reorden y > 0
  - **Sin Stock**: Productos con stock = 0
- Filtro se aplica instantáneamente
- Se puede combinar con otros filtros

### CA-5: Combinación de Filtros
- Todos los filtros se pueden aplicar simultáneamente:
  - Búsqueda de texto + Categoría + Estado de stock
- Los filtros actúan como operador AND
- Al cambiar cualquier filtro, la paginación vuelve a la página 1
- Se mantienen los filtros al navegar entre páginas

### CA-6: Contador de Resultados
- Muestra cantidad de resultados encontrados
- Formato: "Se encontraron X productos" o "X resultados"
- Si hay filtros activos: "X de Y productos"
- Se actualiza en tiempo real al modificar filtros

### CA-7: Estado Sin Resultados
- Si no hay resultados, muestra mensaje claro:
  - Icono de búsqueda vacía
  - Texto: "No se encontraron productos"
  - Sugerencia: "Intenta con otros términos o filtros"
  - Botón: "Limpiar todos los filtros"
- Verificar que los filtros estén escritos correctamente

### CA-8: Indicadores Visuales de Filtros Activos
- Muestra chips o badges con filtros activos
- Ejemplo: [Categoría: Electrónica] [Stock: Bajo]
- Cada chip tiene una (X) para remover ese filtro específico
- Botón "Limpiar todo" para resetear todos los filtros
- Los filtros activos persisten en la URL (query params)

### CA-9: Persistencia de Filtros
- Los filtros se mantienen en la URL como query parameters
- Ejemplo: `/products?search=laptop&category=3&stock=low`
- Al compartir o recargar la página, se mantienen los filtros
- Al navegar atrás/adelante, se restauran los filtros

## Notas Técnicas
- API endpoint: `GET /api/products?search={text}&category={id}&stockStatus={status}&page={page}&limit={limit}`
- Implementar debounce en búsqueda de texto (300ms)
- Búsqueda en backend usando LIKE o full-text search
- Indexar columnas name y sku para mejorar performance
- Usar query params en URL para filtros
- Cache de resultados de búsqueda (2 minutos)
- Considerar implementar búsqueda avanzada en el futuro

## Definición de Hecho
- [ ] Frontend: Campo de búsqueda con debounce implementado
- [ ] Frontend: Selector de categorías funcional
- [ ] Frontend: Selector de estado de stock
- [ ] Frontend: Combinación de filtros funcionando correctamente
- [ ] Frontend: Contador de resultados actualizado
- [ ] Frontend: Estado sin resultados con mensaje claro
- [ ] Frontend: Chips de filtros activos con opción de remover
- [ ] Frontend: Persistencia de filtros en URL
- [ ] Backend: API con soporte para múltiples filtros
- [ ] Backend: Búsqueda case-insensitive y parcial
- [ ] Backend: Optimización con índices en BD
- [ ] Pruebas unitarias y de integración
- [ ] Pruebas de performance con datasets grandes
- [ ] Documentación de API

## Dependencias
- US-PROD-002 (Listar Productos) debe estar completo
- US-PROD-007 (Categorías) debe estar completo

## Tags
`products`, `search`, `filter`, `high-priority`, `ux`
