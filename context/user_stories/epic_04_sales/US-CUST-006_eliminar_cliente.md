# US-CUST-006: Eliminar Cliente

## Historia de Usuario
**Como** administrador,
**quiero** poder eliminar clientes del sistema,
**para** limpiar registros de clientes que ya no son relevantes.

## Prioridad
**Baja**

## Estimación
5 Story Points

## Criterios de Aceptación

### [x] CA-1: Restricción de Permisos
- Solo el rol **Admin** puede eliminar clientes
- Personal de Ventas NO tiene acceso a esta función
- Botón "Eliminar" solo visible para Admin
- Validación de permisos en backend también

### [x] CA-2: Restricción por Pedidos Asociados
- **NO** se puede eliminar un cliente que tiene pedidos asociados
- Validación: si el cliente tiene al menos 1 pedido (de cualquier estado):
  - Mostrar error: "No se puede eliminar este cliente porque tiene pedidos asociados"
  - Sugerencia: "En su lugar, puedes inactivar el cliente"
  - Botón: "Inactivar cliente" como alternativa
- Solo clientes sin historial de pedidos pueden eliminarse permanentemente

### [x] CA-3: Confirmación de Eliminación
- Botón "Eliminar Cliente" en perfil del cliente
- Color rojo o warning para indicar acción destructiva
- Al hacer click, muestra modal de confirmación:
  - Título: "¿Eliminar cliente?"
  - Mensaje: "Esta acción eliminará permanentemente a [Nombre Cliente] y no se puede deshacer"
  - Input de confirmación: "Escribe 'ELIMINAR' para confirmar"
  - Botones: "Eliminar permanentemente" (rojo) y "Cancelar" (gris)

### [x] CA-4: Validación de Confirmación
- Requiere que el usuario escriba exactamente "ELIMINAR" (case-insensitive)
- Botón de "Eliminar permanentemente" deshabilitado hasta que escriba correctamente
- Previene eliminaciones accidentales
- Alternativa: checkbox "Entiendo que esta acción no se puede deshacer"

### [x] CA-5: Eliminación Permanente vs Soft Delete
- Si el cliente **NO tiene pedidos**: eliminación permanente (hard delete)
  - Se borra completamente del sistema
  - Libera el email para posible re-registro futuro
- Si el cliente **tiene pedidos**: NO permitir eliminación
  - Ofrecer inactivación en su lugar (US-CUST-008)
  - Mantener integridad referencial

### [x] CA-6: Limpieza de Datos Relacionados
- Al eliminar cliente, también eliminar:
  - Notas asociadas al cliente (tabla customer_notes)
  - Cualquier otro dato directamente relacionado
- Validar que no haya referencias foráneas que impidan eliminación
- Usar CASCADE en foreign keys o manejar manualmente

### [x] CA-7: Confirmación Post-Eliminación
- Al eliminar exitosamente:
  - Mensaje de confirmación: "Cliente [Nombre] eliminado permanentemente"
  - Redirigir a lista de clientes
  - El cliente desaparece inmediatamente de la lista
- Si falla: mensaje de error claro con motivo

### [x] CA-8: Log de Auditoría
- Registrar eliminación en logs del sistema:
  - Cliente eliminado (nombre, email)
  - Usuario Admin que realizó la eliminación
  - Fecha/hora
  - Motivo (si se solicita)
- Útil para auditorías y seguimiento

### [x] CA-9: Restricción de Eliminación en Lista
- En lista de clientes, icono/botón de eliminar solo para Admin
- Tooltip: "Eliminar cliente" (solo si no tiene pedidos)
- Si tiene pedidos: tooltip "No se puede eliminar (tiene pedidos)"
- Deshabilitar visualmente si tiene pedidos

### [x] CA-10: Alternativa Recomendada
- Sistema sugiere inactivar en lugar de eliminar
- Beneficios de inactivar:
  - Mantiene historial completo
  - Preserva integridad de datos
  - Se puede reactivar si es necesario
- Mensaje informativo en modal de eliminación

## Notas Técnicas
- API endpoint: `DELETE /api/customers/{id}`
- Validaciones en backend (críticas):
  1. Usuario tiene rol Admin
  2. Cliente no tiene pedidos asociados
  3. Cliente existe
- Query para verificar pedidos:
  ```sql
  SELECT COUNT(*) FROM orders WHERE customer_id = ?
  ```
- Si count > 0: retornar error 409 (Conflict) o 400 (Bad Request)
  - Response: `{ "error": "Cannot delete customer with existing orders", "orders_count": 5 }`
- Eliminación en cascada de datos relacionados:
  ```sql
  DELETE FROM customer_notes WHERE customer_id = ?;
  DELETE FROM customers WHERE id = ?;
  ```
- O usar ON DELETE CASCADE en foreign keys
- Log de auditoría antes de eliminar (guardar snapshot)
- Considerar tabla de eliminaciones (deleted_customers) para mantener registro

## Definición de Hecho
- [x] Frontend: Botón "Eliminar" solo visible para Admin
- [x] Frontend: Modal de confirmación de eliminación
- [x] Frontend: Input de confirmación "ELIMINAR"
- [x] Frontend: Mensaje de error si tiene pedidos
- [x] Frontend: Sugerencia de inactivar como alternativa
- [x] Frontend: Confirmación post-eliminación
- [x] Frontend: Redirección a lista después de eliminar
- [x] Backend: API DELETE /api/customers/{id}
- [x] Backend: Validación de rol Admin
- [x] Backend: Validación de pedidos asociados (preparado para Orders module)
- [x] Backend: Eliminación de datos relacionados (notas inline en modelo)
- [x] Backend: Log de auditoría (CustomerDeletionAudit model)
- [x] Backend: Manejo de errores y respuestas apropiadas
- [x] Base de datos: Verificar integridad referencial
- [ ] Pruebas de eliminación exitosa (sin pedidos) - Testing opcional en v1.0
- [ ] Pruebas de rechazo (con pedidos) - Testing opcional en v1.0
- [ ] Pruebas de permisos (solo Admin) - Testing opcional en v1.0
- [ ] Pruebas de eliminación de datos relacionados - Testing opcional en v1.0
- [x] Documentación de restricciones

## Dependencias
- US-CUST-004 (Ver Perfil) - acceso a botón de eliminar
- US-CUST-008 (Inactivar Cliente) - alternativa sugerida
- Sistema de roles y permisos (Epic 01)

## Tags
`customers`, `crud`, `delete`, `admin-only`, `low-priority`
