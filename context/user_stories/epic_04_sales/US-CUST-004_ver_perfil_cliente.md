# US-CUST-004: Ver Perfil del Cliente

## Historia de Usuario
**Como** personal de ventas,
**quiero** ver toda la información detallada de un cliente,
**para** revisar su historial y datos de contacto.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Cabecera del Perfil
- Nombre completo del cliente prominente en la parte superior
- Badge de categoría (VIP, Frecuente, Regular) con color distintivo
- Badge de estado (Activo/Inactivo)
- Fecha de registro: "Cliente desde: [fecha]"
- Botones de acción principales: Editar, Crear Pedido, Inactivar

### CA-2: Información de Contacto
- Sección "Datos de Contacto":
  - Email (con icono de mailto para enviar email)
  - Teléfono principal (con icono para iniciar llamada)
  - Teléfono secundario (si existe)
- Iconos clickeables para acciones rápidas
- Formato limpio y legible

### CA-3: Dirección Completa
- Sección "Dirección de Envío":
  - Calle/Dirección
  - Ciudad
  - Código Postal
  - País
- Formato de dirección multilínea
- Opcional: botón para copiar dirección al portapapeles
- Opcional: link a Google Maps con la dirección

### CA-4: Métricas del Cliente
- Panel de estadísticas destacado:
  - **Total de pedidos**: número total de pedidos realizados
  - **Monto total gastado**: suma de todos los pedidos (excluir cancelados)
  - **Promedio de compra**: monto promedio por pedido
  - **Última compra**: fecha de la compra más reciente
  - **Compra más grande**: monto del pedido de mayor valor
- Diseño visual atractivo (cards con iconos)
- Valores con formato apropiado (moneda, fechas)

### CA-5: Resumen de Pedidos Recientes
- Sección "Últimos Pedidos":
  - Tabla con los 5 pedidos más recientes
  - Columnas: Número, Fecha, Total, Estado
  - Links a cada pedido (ver detalles)
- Botón "Ver todos los pedidos" → redirige a US-ORD-010 (historial completo)
- Si no hay pedidos: mensaje "Este cliente aún no ha realizado compras"

### CA-6: Notas sobre el Cliente
- Sección "Notas":
  - Lista de notas en orden cronológico (más reciente primero)
  - Cada nota muestra:
    - Contenido de la nota
    - Fecha/hora de creación
    - Usuario que la creó
  - Si no hay notas: mensaje "No hay notas sobre este cliente"
- Botón "+ Agregar nota" → abre US-CUST-009
- Notas editables (si el usuario actual es quien la creó)

### CA-7: Productos Favoritos
- Sección "Productos más comprados":
  - Lista de top 5 productos que el cliente compra frecuentemente
  - Para cada producto:
    - Nombre del producto
    - Imagen pequeña (thumbnail)
    - Veces comprado
    - Cantidad total
  - Útil para sugerir productos en próximas ventas

### CA-8: Historial de Cambios
- Sección colapsable "Historial de Actividad":
  - Registro de creación: "Cliente registrado el [fecha] por [usuario]"
  - Última modificación: "Actualizado el [fecha] por [usuario]"
  - Si fue inactivado: "Inactivado el [fecha] por [usuario]"
  - Si fue reactivado: "Reactivado el [fecha] por [usuario]"
- Solo visible para usuarios con permisos (Admin)

### CA-9: Acciones del Perfil
- Botones de acción en cabecera o panel lateral:
  - **Editar información** → US-CUST-005
  - **Crear nuevo pedido** → US-ORD-001 con cliente pre-seleccionado
  - **Ver todos los pedidos** → US-ORD-010
  - **Agregar nota** → US-CUST-009
  - **Inactivar/Activar cliente** → US-CUST-008
  - **Eliminar cliente** (solo Admin, si no tiene pedidos)
- Permisos: algunas acciones solo para Admin

### CA-10: Navegación
- Breadcrumb: Clientes > [Nombre del Cliente]
- Botón "Volver a lista de clientes"
- Navegación entre clientes: ← Cliente Anterior | Siguiente Cliente →
- URL amigable: `/clientes/{id}/perfil` o `/clientes/{id}`

## Notas Técnicas
- API endpoint: `GET /api/customers/{id}`
- Response incluye:
  - Datos del cliente completo
  - Métricas calculadas (pedidos, gastos, promedio)
  - Últimos 5 pedidos
  - Top 5 productos más comprados
  - Notas del cliente
  - Información de auditoría (creado por, actualizado por)
- Usar eager loading para optimizar:
  ```python
  customer = Customer.query.options(
    joinedload(Customer.orders),
    joinedload(Customer.notes).joinedload(Note.created_by)
  ).get(id)
  ```
- Calcular métricas con query agregada:
  ```sql
  SELECT
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_spent,
    COALESCE(AVG(o.total), 0) as average_order,
    MAX(o.order_date) as last_purchase,
    MAX(o.total) as largest_order
  FROM orders o
  WHERE o.customer_id = ? AND o.status != 'Cancelado'
  ```
- Cachear perfil del cliente (invalidar al editar)
- Índices en `customer_id` en tabla orders para queries rápidas

## Definición de Hecho
- [ ] Frontend: Layout de perfil del cliente
- [ ] Frontend: Sección de cabecera con nombre y badges
- [ ] Frontend: Sección de información de contacto
- [ ] Frontend: Sección de dirección
- [ ] Frontend: Panel de métricas del cliente
- [ ] Frontend: Tabla de últimos pedidos
- [ ] Frontend: Sección de notas
- [ ] Frontend: Lista de productos favoritos
- [ ] Frontend: Sección de historial de actividad (colapsable)
- [ ] Frontend: Botones de acción con permisos
- [ ] Frontend: Navegación (breadcrumb, volver, anterior/siguiente)
- [ ] Backend: API GET /api/customers/{id} con datos completos
- [ ] Backend: Cálculo de métricas del cliente
- [ ] Backend: Query de últimos pedidos
- [ ] Backend: Query de productos más comprados
- [ ] Backend: Inclusión de notas con usuarios
- [ ] Backend: Eager loading para optimización
- [ ] Pruebas de carga de datos completos
- [ ] Pruebas de cálculo de métricas
- [ ] Pruebas de permisos de acciones
- [ ] Responsive design

## Dependencias
- US-CUST-001 (Registrar Cliente) - clientes existentes
- US-CUST-005 (Editar Cliente) - botón de editar
- US-CUST-009 (Notas) - sección de notas
- US-ORD-001 (Crear Pedido) - botón de crear pedido
- US-ORD-010 (Historial de Pedidos) - ver todos los pedidos

## Tags
`customers`, `profile`, `details-view`, `ui`, `high-priority`
