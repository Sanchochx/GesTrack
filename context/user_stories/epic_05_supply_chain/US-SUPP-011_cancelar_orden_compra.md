## US-SUPP-011: Cancelar Orden de Compra
**Como** gerente de almacén,
**quiero** cancelar órdenes de compra,
**para** manejar situaciones donde ya no se necesita la mercancía.

### Criterios de Aceptación:
- Se puede cancelar órdenes en estado "Pendiente" o "Confirmada"
- Se solicita confirmación y motivo de cancelación
- No se puede cancelar órdenes "En Tránsito" o "Recibidas"
- La orden cambia a estado "Cancelada"
- Se registra fecha/hora, usuario y motivo de cancelación
- Las órdenes canceladas no se eliminan, solo se marcan
- Se puede filtrar para ocultar/mostrar órdenes canceladas

**Prioridad:** Media
