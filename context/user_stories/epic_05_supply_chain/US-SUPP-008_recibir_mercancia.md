## US-SUPP-008: Recibir Mercancía (Actualizar Inventario)
**Como** gerente de almacén,
**quiero** registrar la recepción de mercancía de una orden de compra,
**para** aumentar automáticamente el stock en inventario.

### Criterios de Aceptación:
- Solo se puede recibir órdenes en estado "En Tránsito"
- Se muestra lista de productos ordenados con cantidades
- Se puede ingresar cantidad realmente recibida (puede diferir de la solicitada)
- Si hay discrepancia, se solicita razón (faltantes, sobrantes, daños)
- Al confirmar recepción, el stock de cada producto se incrementa automáticamente
- La orden cambia a estado "Recibida"
- Se registra fecha de recepción
- Se actualiza el historial de movimientos de inventario
- Si hay productos faltantes, se puede crear incidencia

**Prioridad:** Alta
