## US-SUPP-007: Gestionar Estados de Orden de Compra
**Como** gerente de almacén,
**quiero** actualizar el estado de las órdenes de compra,
**para** mantener seguimiento del proceso de abastecimiento.

### Criterios de Aceptación:
- Estados disponibles: Pendiente → Confirmada → En Tránsito → Recibida → Cancelada
- Se puede avanzar o retroceder entre estados según sea necesario
- Se registra fecha/hora y usuario de cada cambio de estado
- Se muestra historial de cambios de estado
- Se pueden agregar notas al cambiar estado
- Solo el estado "Recibida" actualiza el inventario
- Estado "Cancelada" se puede establecer desde cualquier estado previo

**Prioridad:** Alta
