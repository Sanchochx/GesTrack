# US-CUST-008: Inactivar/Activar Cliente

## Historia de Usuario
**Como** administrador,
**quiero** poder inactivar clientes sin eliminarlos,
**para** mantener el historial pero indicar que ya no están activos.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Botón de Inactivar
- Botón "Inactivar Cliente" en perfil del cliente
- Visible para Admin y Personal de Ventas
- Estilo distintivo pero no destructivo (amarillo/naranja, no rojo)
- Solo visible si el cliente está activo
- Si el cliente está inactivo: botón "Reactivar Cliente"

### CA-2: Confirmación de Inactivación
- Al hacer click en "Inactivar", muestra modal de confirmación:
  - Título: "¿Inactivar cliente [Nombre]?"
  - Mensaje: "El cliente ya no aparecerá en búsquedas por defecto y no se podrán crear nuevos pedidos"
  - Mensaje adicional: "Los pedidos históricos seguirán siendo accesibles"
  - Campo opcional: "Motivo de inactivación" (max 200 caracteres)
  - Botones: "Inactivar" y "Cancelar"
- No requiere confirmación textual (menos crítico que eliminar)

### CA-3: Proceso de Inactivación
- Al confirmar:
  - Campo `is_active` cambia a `false`
  - Se registra `inactivated_at` con timestamp actual
  - Se registra usuario que inactivó
  - Se guarda motivo de inactivación (si se proporcionó)
- El cliente permanece en la base de datos
- Todos los datos históricos se mantienen intactos

### CA-4: Restricciones para Clientes Inactivos
- Clientes inactivos **NO** aparecen en:
  - Búsqueda de clientes al crear pedidos
  - Lista principal de clientes (por defecto)
  - Autocompletado de clientes
- Clientes inactivos **SÍ** aparecen en:
  - Búsqueda si se activa filtro "Mostrar inactivos"
  - Listado si se filtra específicamente
  - Historial de pedidos existentes
- **NO** se pueden crear nuevos pedidos para clientes inactivos
  - Si se intenta: error "Este cliente está inactivo. Reactívalo para crear pedidos"

### CA-5: Visualización de Estado Inactivo
- En perfil del cliente:
  - Banner destacado: "Este cliente está inactivo desde [fecha]"
  - Badge rojo "Inactivo" junto al nombre
  - Sección de información: "Inactivado el [fecha] por [usuario]"
  - Motivo de inactivación (si existe)
- En lista de clientes (si se muestran inactivos):
  - Badge gris "Inactivo"
  - Texto en gris o atenuado
  - Icono distintivo

### CA-6: Reactivación de Cliente
- Botón "Reactivar Cliente" para clientes inactivos
- Modal de confirmación:
  - Título: "¿Reactivar cliente [Nombre]?"
  - Mensaje: "El cliente volverá a estar disponible para crear nuevos pedidos"
  - Campo opcional: "Motivo de reactivación"
  - Botones: "Reactivar" y "Cancelar"
- Al reactivar:
  - `is_active` = `true`
  - `inactivated_at` = `null`
  - Se registra reactivación con fecha y usuario
  - Motivo de reactivación (si se proporcionó)

### CA-7: Historial de Inactivaciones
- Registro de todos los cambios de estado:
  - Fecha de inactivación
  - Usuario que inactivó
  - Motivo
  - Fecha de reactivación (si aplica)
  - Usuario que reactivó
  - Motivo de reactivación
- Visible en sección "Historial de actividad" del perfil
- Útil si el cliente se inactiva/reactiva múltiples veces

### CA-8: Pedidos Históricos Accesibles
- Todos los pedidos del cliente inactivo siguen accesibles
- Se pueden ver detalles de pedidos anteriores
- Los pedidos siguen vinculados al cliente
- En vista de pedido, si el cliente está inactivo, mostrar indicador

### CA-9: Filtros en Lista de Clientes
- Toggle o checkbox "Mostrar clientes inactivos"
- Por defecto: ocultos (solo activos)
- Al activar: muestra tanto activos como inactivos con indicadores claros
- Filtro específico: solo inactivos
- Contador: "142 activos, 8 inactivos"

### CA-10: Notificación Post-Acción
- Al inactivar exitosamente:
  - Mensaje: "Cliente [Nombre] inactivado correctamente"
  - El estado cambia inmediatamente en UI
- Al reactivar exitosamente:
  - Mensaje: "Cliente [Nombre] reactivado correctamente"
  - El cliente vuelve a aparecer en búsquedas

## Notas Técnicas
- API endpoints:
  - `PATCH /api/customers/{id}/deactivate` - inactivar
  - `PATCH /api/customers/{id}/activate` - reactivar
- Request body (opcional):
  ```json
  {
    "reason": "Cliente solicitó no recibir más contacto"
  }
  ```
- Actualización de campos:
  ```python
  customer.is_active = False
  customer.inactivated_at = datetime.utcnow()
  customer.inactivated_by = current_user.id
  customer.inactivation_reason = reason
  ```
- Para reactivar:
  ```python
  customer.is_active = True
  customer.inactivated_at = None
  customer.reactivated_at = datetime.utcnow()
  customer.reactivated_by = current_user.id
  customer.reactivation_reason = reason
  ```
- Filtros en queries:
  - Lista de clientes: `WHERE is_active = true` por defecto
  - Búsqueda al crear pedido: solo clientes activos
- Índice en campo `is_active` para queries rápidas
- Considerar tabla de auditoría de cambios de estado (customer_status_history)

## Definición de Hecho
- [ ] Frontend: Botón "Inactivar Cliente"
- [ ] Frontend: Modal de confirmación de inactivación
- [ ] Frontend: Campo de motivo de inactivación
- [ ] Frontend: Botón "Reactivar Cliente" para inactivos
- [ ] Frontend: Modal de confirmación de reactivación
- [ ] Frontend: Banner de estado inactivo en perfil
- [ ] Frontend: Badge de estado en lista
- [ ] Frontend: Toggle "Mostrar inactivos" en lista
- [ ] Frontend: Filtro de clientes por estado
- [ ] Frontend: Restricción al crear pedidos (solo activos)
- [ ] Backend: API PATCH /api/customers/{id}/deactivate
- [ ] Backend: API PATCH /api/customers/{id}/activate
- [ ] Backend: Actualización de campos de estado
- [ ] Backend: Registro de usuario y timestamp
- [ ] Backend: Almacenamiento de motivos
- [ ] Backend: Filtros en queries (is_active)
- [ ] Base de datos: Campos inactivated_at, inactivated_by, inactivation_reason
- [ ] Base de datos: Campos para reactivación
- [ ] Base de datos: Índice en is_active
- [ ] Pruebas de inactivación
- [ ] Pruebas de reactivación
- [ ] Pruebas de restricciones (crear pedido con cliente inactivo)
- [ ] Pruebas de filtros
- [ ] Documentación de estados de cliente

## Dependencias
- US-CUST-004 (Ver Perfil) - acceso a botones
- US-CUST-006 (Eliminar) - inactivar como alternativa
- US-ORD-001 (Crear Pedido) - restricción de clientes inactivos

## Tags
`customers`, `status-management`, `soft-delete`, `medium-priority`
