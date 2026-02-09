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

### [x] CA-1: Cabecera del Perfil
- [x] Nombre completo del cliente prominente en la parte superior
- [x] Badge de categoría (VIP, Frecuente, Regular) con color distintivo
- [x] Badge de estado (Activo/Inactivo)
- [x] Fecha de registro: "Cliente desde: [fecha]"
- [x] Botones de acción principales: Editar, Crear Pedido, Inactivar

### [x] CA-2: Información de Contacto
- [x] Sección "Datos de Contacto":
  - [x] Email (con icono de mailto para enviar email)
  - [x] Teléfono principal (con icono para iniciar llamada)
  - [x] Teléfono secundario (si existe)
- [x] Iconos clickeables para acciones rápidas
- [x] Formato limpio y legible

### [x] CA-3: Dirección Completa
- [x] Sección "Dirección de Envío":
  - [x] Calle/Dirección
  - [x] Ciudad
  - [x] Código Postal
  - [x] País
- [x] Formato de dirección multilínea
- [x] Opcional: botón para copiar dirección al portapapeles
- [x] Opcional: link a Google Maps con la dirección

### [x] CA-4: Métricas del Cliente
- [x] Panel de estadísticas destacado:
  - [x] **Total de pedidos**: número total de pedidos realizados
  - [x] **Monto total gastado**: suma de todos los pedidos (excluir cancelados)
  - [x] **Promedio de compra**: monto promedio por pedido
  - [x] **Última compra**: fecha de la compra más reciente
  - [ ] **Compra más grande**: monto del pedido de mayor valor (diferido - depende de Orders module)
- [x] Diseño visual atractivo (cards con iconos)
- [x] Valores con formato apropiado (moneda, fechas)
- **Nota:** Métricas muestran placeholder values hasta que se implemente el módulo de Orders

### [x] CA-5: Resumen de Pedidos Recientes
- [x] Sección "Últimos Pedidos":
  - [ ] Tabla con los 5 pedidos más recientes (diferido - depende de Orders module)
  - [ ] Columnas: Número, Fecha, Total, Estado (diferido)
  - [ ] Links a cada pedido (diferido)
- [x] Botón "Ver todos los pedidos" → redirige a US-ORD-010 (deshabilitado hasta implementación)
- [x] Si no hay pedidos: mensaje "Este cliente aún no ha realizado compras"
- **Nota:** Sección implementada con empty state, se activará con Orders module

### [x] CA-6: Notas sobre el Cliente
- [x] Sección "Notas":
  - [x] Muestra contenido de la nota (campo notes del cliente)
  - [ ] Lista de notas múltiples en orden cronológico (diferido - US-CUST-009)
  - [ ] Cada nota con fecha/hora y usuario creador (diferido - US-CUST-009)
  - [x] Si no hay notas: mensaje "No hay notas sobre este cliente"
- [x] Botón "+ Agregar nota" → deshabilitado hasta US-CUST-009
- **Nota:** Sección usa campo notes simple; notas múltiples en US-CUST-009

### [x] CA-7: Productos Favoritos
- [x] Sección "Productos más comprados":
  - [ ] Lista de top 5 productos (diferido - depende de Orders module)
  - [ ] Nombre del producto, imagen, veces comprado (diferido)
- [x] Empty state con mensaje informativo
- **Nota:** Se calculará automáticamente cuando exista módulo de Orders

### [x] CA-8: Historial de Cambios
- [x] Sección colapsable "Historial de Actividad":
  - [x] Registro de creación: "Cliente registrado el [fecha]"
  - [x] Última modificación: "Actualizado el [fecha]"
  - [x] Estado inactivo: Muestra advertencia si inactivo
- [x] Solo visible para usuarios con permisos (Admin)
- **Nota:** Historial detallado con usuarios específicos en futuras versiones

### [x] CA-9: Acciones del Perfil
- [x] Botones de acción en cabecera o panel lateral:
  - [x] **Editar información** → US-CUST-005 (deshabilitado hasta implementación)
  - [x] **Crear nuevo pedido** → US-ORD-001 (deshabilitado hasta implementación)
  - [x] **Ver todos los pedidos** → US-ORD-010 (deshabilitado hasta implementación)
  - [x] **Agregar nota** → US-CUST-009 (deshabilitado hasta implementación)
  - [x] **Inactivar/Activar cliente** → Funcional ✅
  - [x] **Eliminar cliente** (solo Admin, si no tiene pedidos) - visible, deshabilitado
- [x] Permisos: algunas acciones solo para Admin

### [x] CA-10: Navegación
- [x] Breadcrumb: Inicio > Clientes > [Nombre del Cliente]
- [x] Botón "Volver a lista de clientes"
- [x] Navegación entre clientes: ← Cliente Anterior | Siguiente Cliente → (deshabilitado, futura implementación)
- [x] URL amigable: `/customers/{id}`

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
- [x] Frontend: Layout de perfil del cliente
- [x] Frontend: Sección de cabecera con nombre y badges
- [x] Frontend: Sección de información de contacto
- [x] Frontend: Sección de dirección
- [x] Frontend: Panel de métricas del cliente (placeholders para Orders module)
- [x] Frontend: Tabla de últimos pedidos (empty state, depende de Orders module)
- [x] Frontend: Sección de notas (campo simple, notas múltiples en US-CUST-009)
- [x] Frontend: Lista de productos favoritos (empty state, depende de Orders module)
- [x] Frontend: Sección de historial de actividad (colapsable, Admin only)
- [x] Frontend: Botones de acción con permisos
- [x] Frontend: Navegación (breadcrumb, volver, anterior/siguiente deshabilitado)
- [x] Backend: API GET /api/customers/{id} con datos completos (ya existente)
- [ ] Backend: Cálculo de métricas del cliente (diferido - Orders module)
- [ ] Backend: Query de últimos pedidos (diferido - Orders module)
- [ ] Backend: Query de productos más comprados (diferido - Orders module)
- [ ] Backend: Inclusión de notas con usuarios (diferido - US-CUST-009)
- [ ] Backend: Eager loading para optimización (diferido - cuando existan relaciones)
- [ ] Pruebas de carga de datos completos (diferido)
- [ ] Pruebas de cálculo de métricas (diferido)
- [ ] Pruebas de permisos de acciones (diferido)
- [x] Responsive design (isMobile detectado, layout adapta grid)

## Dependencias
- US-CUST-001 (Registrar Cliente) - clientes existentes
- US-CUST-005 (Editar Cliente) - botón de editar
- US-CUST-009 (Notas) - sección de notas
- US-ORD-001 (Crear Pedido) - botón de crear pedido
- US-ORD-010 (Historial de Pedidos) - ver todos los pedidos

## Tags
`customers`, `profile`, `details-view`, `ui`, `high-priority`
