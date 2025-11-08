# US-INV-001: Seguimiento de Stock en Tiempo Real

## Historia de Usuario
**Como** gerente de almacen,
**quiero** ver los niveles de stock actualizados en tiempo real,
**para** tomar decisiones informadas sobre reabastecimiento.

## Prioridad
**Alta**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Actualización Automática en Pedidos
> **DIFERIDO:** Este criterio está pendiente hasta completar Epic 04 (Sistema de Pedidos).
> La infraestructura de actualización de stock está lista para integrarse cuando se implemente el sistema de órdenes.
- [ ] El stock se reduce automáticamente al crear un pedido
- [ ] El stock se restaura si se cancela un pedido pendiente
- [ ] El stock NO se modifica si se marca pedido como "Entregado" (ya fue reducido al crearlo)
- [ ] La actualización se refleja inmediatamente en todas las vistas del sistema

### CA-2: Actualización en Recepciones de Proveedor
> **DIFERIDO:** Este criterio está pendiente hasta completar Epic 05 (Sistema de Proveedores).
> La infraestructura de actualización de stock está lista para integrarse cuando se implemente el sistema de compras.
- [ ] El stock aumenta automáticamente al recibir una orden de compra de proveedor
- [ ] Se valida que la cantidad recibida coincida con lo esperado
- [ ] Si hay discrepancia, se requiere confirmación del usuario
- [ ] Se registra el movimiento en el historial

### CA-3: Sincronización en Tiempo Real
- [x] Los cambios de stock se reflejan inmediatamente en todas las sesiones activas
- [x] Múltiples usuarios ven la misma información actualizada simultáneamente
- [x] Se utiliza WebSockets o polling para actualizaciones en tiempo real
- [x] Indicador visual cuando hay actualizaciones pendientes de sincronizar

### CA-4: Timestamp de Última Actualización
- [x] Cada producto muestra fecha y hora de última actualización de stock
- [x] Formato: "Actualizado: DD/MM/YYYY HH:MM"
- [x] Se muestra el usuario que realizó la última modificación
- [x] Al hacer hover sobre el timestamp, se muestra detalle del último movimiento

### CA-5: Manejo de Concurrencia
- [x] Si dos usuarios intentan modificar stock simultáneamente, se maneja con locks
- [x] Se muestra error si el stock cambió antes de completar la operación
- [x] Opción de recargar y reintentar con valores actualizados
- [x] Las transacciones garantizan consistencia de datos

### CA-6: Vistas Actualizadas
Las siguientes vistas deben reflejar stock en tiempo real:
- [x] Lista de productos
- [ ] Detalles de producto (pendiente de creación en futuras US)
- [ ] Dashboard de inventario (pendiente de creación en US-INV-010)
- [ ] Vista de categorías (actualización automática mediante ProductList)
- [ ] Formulario de creación de pedidos (pendiente hasta Epic 04)

## Notas Técnicas
- Implementar transacciones ACID para operaciones de stock
- Nivel de aislamiento: SERIALIZABLE o REPEATABLE READ
- WebSockets para notificaciones en tiempo real (Socket.io o similar)
- Alternativa: Polling cada 10-15 segundos si WebSockets no es viable
- Triggers en BD para validar consistencia de stock
- Locks optimistas usando version numbers o timestamps

```sql
-- Trigger para validar stock no negativo
CREATE OR REPLACE FUNCTION check_stock_not_negative()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock < 0 THEN
        RAISE EXCEPTION 'Stock cannot be negative for product %', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_stock_positive
BEFORE UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION check_stock_not_negative();
```

## Definición de Hecho
- [ ] Backend: Endpoint para obtener stock en tiempo real
- [ ] Backend: Sistema de WebSockets o polling implementado
- [ ] Backend: Transacciones con nivel de aislamiento adecuado
- [ ] Backend: Triggers de validación de stock
- [ ] Frontend: Actualización automática de vistas sin refrescar página
- [ ] Frontend: Indicador visual de sincronización
- [ ] Frontend: Timestamp de última actualización visible
- [ ] Base de datos: Índices optimizados para consultas de stock
- [ ] Pruebas de concurrencia y condiciones de carrera
- [ ] Pruebas de carga con múltiples usuarios simultáneos
- [ ] Documentación de arquitectura de sincronización

## Dependencias
- US-PROD-001 (Crear Producto) - tabla products con campo stock
- Epic 01 completa (autenticación de usuarios)
- Sistema de pedidos (Epic 04) para integración
- Sistema de proveedores (Epic 05) para recepciones

## Tags
`inventory`, `real-time`, `stock-tracking`, `high-priority`, `websockets`
