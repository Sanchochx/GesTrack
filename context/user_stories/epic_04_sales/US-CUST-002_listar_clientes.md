# US-CUST-002: Listar Clientes

## Historia de Usuario
**Como** personal de ventas,
**quiero** ver una lista de todos los clientes registrados,
**para** acceder rápidamente a su información.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Tabla de Clientes
- Tabla responsive con columnas:
  - Nombre completo
  - Email
  - Teléfono
  - Ciudad
  - Total de compras (monto acumulado)
  - Última compra (fecha)
  - Estado (Activo/Inactivo)
  - Acciones
- Headers clickeables para ordenamiento

### CA-2: Paginación
- Mostrar 20 clientes por página por defecto
- Controles de paginación: Primera, Anterior, Números, Siguiente, Última
- Indicador: "Mostrando 1-20 de 150 clientes"
- Selector de items por página: 10, 20, 50, 100
- Mantener filtros al cambiar de página

### CA-3: Ordenamiento
- Ordenar por cualquier columna (click en header)
- Indicadores visuales de orden: ↑ ↓
- Opciones de ordenamiento:
  - Nombre (alfabético A-Z, Z-A)
  - Email (alfabético)
  - Fecha de registro (cronológico)
  - Total de compras (numérico)
  - Última compra (cronológico)
  - Ciudad (alfabético)
- Por defecto: ordenado por nombre ascendente

### CA-4: Indicador Visual de Estado
- Badge o indicador de estado Activo/Inactivo
- Activo: verde, texto "Activo"
- Inactivo: gris, texto "Inactivo"
- Por defecto, la lista muestra solo clientes activos
- Toggle o filtro "Mostrar inactivos"

### CA-5: Categoría del Cliente
- Badge de categoría junto al nombre o en columna separada:
  - VIP: dorado o morado
  - Frecuente: azul
  - Regular: gris
- Tooltip con rango de compras al hacer hover
- Ayuda a identificar clientes importantes rápidamente

### CA-6: Botón de Crear Nuevo Cliente
- Botón "+ Nuevo Cliente" en parte superior derecha
- Estilo destacado (primary button)
- Redirige a formulario de registro (US-CUST-001)
- Siempre visible, incluso al hacer scroll (sticky)

### CA-7: Resumen de Totales
- Panel superior con métricas:
  - Total de clientes (según filtros)
  - Clientes activos
  - Clientes inactivos
  - Clientes VIP
- Formato: "150 clientes (142 activos, 8 inactivos, 12 VIP)"
- Actualiza según filtros aplicados

### CA-8: Acciones Rápidas por Cliente
- Botón/icono "Ver Perfil" → redirige a US-CUST-004
- Icono de email → abre cliente de email (mailto)
- Icono de teléfono → inicia llamada o muestra número
- Menú de acciones (⋮):
  - Ver perfil completo
  - Editar información
  - Ver historial de pedidos
  - Crear nuevo pedido
  - Inactivar/Activar
- Click en fila completa abre perfil del cliente

### CA-9: Información de Última Compra
- Columna "Última Compra" muestra:
  - Fecha en formato relativo: "Hace 2 días", "Hace 3 meses"
  - Tooltip con fecha exacta al hacer hover
- Si nunca compró: "Sin compras" en gris
- Color de alerta si hace mucho tiempo: >6 meses en amarillo/naranja

### CA-10: Estado Vacío
- Si no hay clientes registrados:
  - Mensaje: "No hay clientes registrados"
  - Ilustración o icono
  - Botón destacado "Registrar primer cliente"
- Si hay filtros sin resultados:
  - Mensaje: "No se encontraron clientes"
  - Botón "Limpiar filtros"

## Notas Técnicas
- API endpoint: `GET /api/customers?page=1&limit=20&sort=full_name&order=asc&include_inactive=false`
- Response:
  ```json
  {
    "items": [ /* array de clientes */ ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_active": 142,
    "total_inactive": 8,
    "total_vip": 12
  }
  ```
- Incluir información agregada de pedidos en la consulta:
  ```sql
  SELECT c.*,
    COUNT(o.id) as order_count,
    COALESCE(SUM(o.total), 0) as total_spent,
    MAX(o.order_date) as last_purchase
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id AND o.status != 'Cancelado'
  GROUP BY c.id
  ```
- Índices en: `full_name`, `email`, `is_active`, `registered_at`
- Considerar vista materializada si el cálculo es lento con muchos datos
- Cache de lista (30 segundos, invalidar al crear/editar cliente)

## Definición de Hecho
- [ ] Frontend: Componente de tabla de clientes
- [ ] Frontend: Paginación con controles
- [ ] Frontend: Ordenamiento por columnas
- [ ] Frontend: Badges de estado y categoría
- [ ] Frontend: Botón de crear nuevo cliente
- [ ] Frontend: Panel de resumen de totales
- [ ] Frontend: Menú de acciones rápidas
- [ ] Frontend: Indicadores de última compra
- [ ] Frontend: Toggle para mostrar inactivos
- [ ] Frontend: Estados vacíos
- [ ] Backend: API GET /api/customers con paginación
- [ ] Backend: Soporte de ordenamiento dinámico
- [ ] Backend: Cálculo de métricas agregadas
- [ ] Backend: Join con orders para total de compras
- [ ] Backend: Filtro de clientes activos/inactivos
- [ ] Base de datos: Índices creados
- [ ] Pruebas de paginación
- [ ] Pruebas de ordenamiento
- [ ] Pruebas de cálculo de métricas
- [ ] Responsive design

## Dependencias
- US-CUST-001 (Registrar Cliente) para botón de crear
- US-CUST-004 (Ver Perfil) para link
- Pedidos existentes para métricas de compras

## Tags
`customers`, `listing`, `ui`, `high-priority`
