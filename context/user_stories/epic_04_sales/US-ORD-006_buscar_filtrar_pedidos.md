# US-ORD-006: Buscar y Filtrar Pedidos

## Historia de Usuario
**Como** personal de ventas,
**quiero** buscar pedidos por número, cliente o fecha,
**para** encontrar rápidamente información específica.

## Prioridad
**Media**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Búsqueda por Texto
- Campo de búsqueda prominente en la parte superior de la lista
- Placeholder: "Buscar por número de pedido o nombre de cliente..."
- Búsqueda en tiempo real con debounce de 300ms
- Busca coincidencias en:
  - Número de pedido (ORD-XXXX)
  - Nombre completo del cliente
  - Email del cliente (opcional)
- No sensible a mayúsculas/minúsculas
- Resalta coincidencias en resultados (opcional)

### CA-2: Filtro por Rango de Fechas
- Selector de rango de fechas con dos campos:
  - Fecha inicio
  - Fecha fin
- Datepicker para facilitar selección
- Validación: fecha fin no puede ser menor a fecha inicio
- Botón "Aplicar" para ejecutar filtro
- Shortcuts predefinidos:
  - Hoy
  - Últimos 7 días
  - Últimos 30 días
  - Este mes
  - Mes anterior
  - Este año
- Muestra rango seleccionado como chip removible

### CA-3: Filtro por Estado del Pedido
- Checkbox múltiple o dropdown multiselección
- Estados disponibles:
  - Pendiente
  - Confirmado
  - Procesando
  - Enviado
  - Entregado
  - Cancelado
- Se pueden seleccionar múltiples estados simultáneamente
- Por defecto: todos los estados activos (excepto Cancelado)
- Opción "Mostrar cancelados" como toggle separado

### CA-4: Filtro por Estado de Pago
- Checkbox múltiple o segmented control
- Estados:
  - Pendiente
  - Pagado Parcial
  - Pagado Completo
- Se pueden combinar múltiples selecciones
- Por defecto: todos seleccionados

### CA-5: Combinación de Filtros
- Todos los filtros se pueden aplicar simultáneamente
- Lógica AND entre diferentes tipos de filtros
- Lógica OR dentro del mismo tipo de filtro (ej: Estado = Pendiente OR Confirmado)
- Los filtros se aplican automáticamente al cambiar (excepto fecha que requiere "Aplicar")
- La búsqueda por texto se combina con filtros activos

### CA-6: Visualización de Filtros Activos
- Chips/tags muestran filtros aplicados:
  - "Cliente: Juan Pérez" [x]
  - "Fecha: 2025-01-01 a 2025-01-31" [x]
  - "Estado: Pendiente, Confirmado" [x]
  - "Pago: Pendiente" [x]
- Click en [x] remueve ese filtro específico
- Contador: "4 filtros activos"

### CA-7: Cantidad de Resultados
- Indicador claro del número de resultados encontrados
- Formato: "Mostrando 15 pedidos" o "15 resultados encontrados"
- Si no hay resultados:
  - Mensaje: "No se encontraron pedidos con los criterios seleccionados"
  - Sugerencias: "Intenta modificar o limpiar los filtros"
  - Botón "Limpiar filtros"

### CA-8: Limpiar Filtros
- Botón "Limpiar filtros" o "Restablecer" visible cuando hay filtros activos
- Remueve todos los filtros de una vez
- Restaura vista por defecto (todos los pedidos activos, ordenados por fecha desc)
- Feedback visual de que los filtros fueron limpiados

### CA-9: Persistencia de Filtros
- Los filtros se mantienen al navegar entre páginas de paginación
- Los filtros se mantienen al cambiar ordenamiento
- Opcional: guardar filtros en localStorage para próxima sesión
- Al regresar de ver detalles de un pedido, mantener filtros aplicados

### CA-10: Filtros Avanzados (Opcional)
- Panel colapsable de "Filtros Avanzados"
- Filtros adicionales:
  - Rango de monto (Total entre $X y $Y)
  - Productos específicos en el pedido
  - Usuario que creó el pedido
  - Método de pago
- Se muestran solo si se necesitan (no sobrecargar la UI)

## Notas Técnicas
- API endpoint: `GET /api/orders?search=texto&date_from=2025-01-01&date_to=2025-01-31&status=Pendiente,Confirmado&payment_status=Pendiente`
- Backend debe construir query SQL dinámica según parámetros
- Usar full-text search o LIKE para búsqueda por texto
- Índices en columnas filtradas: `order_date`, `status`, `payment_status`
- Considerar Elasticsearch para búsqueda avanzada si el volumen es muy alto
- Frontend: debounce en búsqueda por texto (300ms)
- Validar parámetros en backend (SQL injection prevention)
- Cachear resultados de filtros comunes (30 segundos)

## Definición de Hecho
- [ ] Frontend: Campo de búsqueda por texto con debounce
- [ ] Frontend: Selector de rango de fechas con shortcuts
- [ ] Frontend: Filtro multi-selección de estado de pedido
- [ ] Frontend: Filtro de estado de pago
- [ ] Frontend: Visualización de filtros activos (chips)
- [ ] Frontend: Botón limpiar filtros
- [ ] Frontend: Contador de resultados
- [ ] Frontend: Estado vacío cuando no hay resultados
- [ ] Frontend: Persistencia de filtros en navegación
- [ ] Backend: API con soporte de múltiples filtros combinados
- [ ] Backend: Query builder dinámico
- [ ] Backend: Validación de parámetros
- [ ] Backend: Optimización de queries con índices
- [ ] Pruebas de combinaciones de filtros
- [ ] Pruebas de búsqueda por texto
- [ ] Pruebas de validación de fechas
- [ ] Pruebas de performance con muchos registros

## Dependencias
- US-ORD-005 (Listar Pedidos) debe estar completo
- Biblioteca de datepicker (ej: react-datepicker, vuetify)

## Tags
`orders`, `search`, `filters`, `medium-priority`, `ux`
