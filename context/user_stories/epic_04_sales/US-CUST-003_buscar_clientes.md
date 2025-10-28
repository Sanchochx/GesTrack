# US-CUST-003: Buscar Clientes

## Historia de Usuario
**Como** personal de ventas,
**quiero** buscar clientes por nombre, email o teléfono,
**para** encontrar rápidamente la información que necesito.

## Prioridad
**Alta**

## Estimación
3 Story Points

## Criterios de Aceptación

### CA-1: Campo de Búsqueda
- Campo de búsqueda prominente en la parte superior de la lista de clientes
- Placeholder: "Buscar por nombre, email o teléfono..."
- Icono de lupa (🔍) dentro o junto al campo
- Tamaño apropiado, fácilmente visible
- Accesible por atajo de teclado: Ctrl/Cmd + F (opcional)

### CA-2: Búsqueda en Tiempo Real
- Filtrado mientras el usuario escribe (live search)
- Debounce de 300ms para evitar requests excesivos
- Spinner o indicador de "Buscando..." durante la consulta
- Resultados se actualizan automáticamente sin presionar Enter

### CA-3: Campos de Búsqueda
- Busca coincidencias en:
  1. **Nombre completo** del cliente
  2. **Email**
  3. **Teléfono principal**
  4. Opcionalmente: teléfono secundario
- Coincidencia parcial (no requiere texto completo)
- Ejemplo: buscar "juan" encuentra "Juan Pérez", "Juana García", "juan@mail.com"

### CA-4: Búsqueda No Sensible a Mayúsculas
- Búsqueda case-insensitive
- "JUAN", "juan", "JuAn" producen los mismos resultados
- Mejora la experiencia del usuario

### CA-5: Coincidencias Parciales
- No requiere palabra completa
- Buscar "pere" encuentra "Juan Pérez"
- Buscar "555" encuentra teléfonos con "555-1234"
- Usar operador LIKE o ILIKE en SQL: `WHERE name ILIKE '%search%'`

### CA-6: Resaltado de Coincidencias (Opcional)
- Texto coincidente resaltado en los resultados
- Fondo amarillo o negrita en el texto que coincide
- Ayuda a identificar rápidamente por qué apareció ese resultado
- Ejemplo: "**Juan** Pérez" si se buscó "juan"

### CA-7: Contador de Resultados
- Muestra cantidad de resultados encontrados
- Formato: "5 clientes encontrados" o "Mostrando 5 resultados"
- Si no hay resultados: "No se encontraron clientes"
- Actualiza en tiempo real con la búsqueda

### CA-8: Limpiar Búsqueda
- Botón "X" o "Limpiar" dentro del campo de búsqueda
- Aparece solo cuando hay texto ingresado
- Al hacer click: limpia el campo y muestra todos los clientes
- También se puede presionar Escape para limpiar

### CA-9: Sin Resultados
- Si la búsqueda no encuentra coincidencias:
  - Mensaje: "No se encontraron clientes que coincidan con '[texto]'"
  - Sugerencias:
    - "Verifica la ortografía"
    - "Intenta con menos palabras"
    - "Usa términos más generales"
  - Opción: "Limpiar búsqueda"
  - Botón: "Registrar nuevo cliente" (para crear si no existe)

### CA-10: Performance
- Búsqueda rápida incluso con miles de clientes
- Límite de resultados: primeros 100 clientes (paginación si es necesario)
- Índices en base de datos para campos de búsqueda
- Caché de búsquedas comunes (opcional)

## Notas Técnicas
- API endpoint: `GET /api/customers/search?q=texto`
- Query SQL con full-text search o LIKE:
  ```sql
  SELECT * FROM customers
  WHERE
    full_name ILIKE '%texto%' OR
    email ILIKE '%texto%' OR
    phone LIKE '%texto%' OR
    secondary_phone LIKE '%texto%'
  ORDER BY full_name
  LIMIT 100
  ```
- Para mejor performance con muchos registros:
  - Usar índices GIN o GiST para full-text search en PostgreSQL
  - O biblioteca de búsqueda como Elasticsearch
  - Índices en columnas: `full_name`, `email`, `phone`

- Frontend: debounce con lodash o custom hook
  ```javascript
  const debouncedSearch = debounce((query) => {
    fetchSearchResults(query);
  }, 300);
  ```

- Considerar búsqueda fonética (Soundex) para errores de ortografía (avanzado)
- Normalizar texto: remover acentos, convertir a minúsculas para mejor matching

## Definición de Hecho
- [ ] Frontend: Campo de búsqueda con icono
- [ ] Frontend: Búsqueda en tiempo real con debounce
- [ ] Frontend: Indicador de carga (spinner)
- [ ] Frontend: Contador de resultados
- [ ] Frontend: Botón para limpiar búsqueda
- [ ] Frontend: Estado sin resultados con sugerencias
- [ ] Frontend: Opcional: resaltado de coincidencias
- [ ] Backend: API GET /api/customers/search
- [ ] Backend: Query con búsqueda en múltiples campos
- [ ] Backend: Búsqueda case-insensitive (ILIKE)
- [ ] Backend: Límite de resultados (100)
- [ ] Base de datos: Índices en campos de búsqueda
- [ ] Pruebas de búsqueda por nombre
- [ ] Pruebas de búsqueda por email
- [ ] Pruebas de búsqueda por teléfono
- [ ] Pruebas de coincidencias parciales
- [ ] Pruebas de case-insensitive
- [ ] Pruebas de performance con muchos registros
- [ ] Documentación de API

## Dependencias
- US-CUST-002 (Listar Clientes) - integración en la misma vista
- Clientes registrados en el sistema

## Tags
`customers`, `search`, `ux`, `high-priority`
