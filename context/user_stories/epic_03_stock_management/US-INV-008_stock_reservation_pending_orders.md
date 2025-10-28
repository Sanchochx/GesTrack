# US-INV-008: Reserva de Stock para Pedidos Pendientes

## Historia de Usuario
**Como** sistema,
**quiero** reservar el stock cuando se crea un pedido,
**para** evitar sobreventa de productos.

## Prioridad
**Alta**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Reserva al Crear Pedido
Cuando se crea un pedido en estado "Pendiente":
- El stock del producto se reduce inmediatamente
- Se crea movimiento de inventario tipo 'order_reservation'
- El pedido queda vinculado al movimiento
- La cantidad reservada se registra en el pedido
- No se permite crear pedido si stock insuficiente

### CA-2: Validación de Stock Disponible
Antes de confirmar un pedido:
- Validación en tiempo real de stock disponible
- Mensaje de error si stock insuficiente: "Stock insuficiente para [Producto]. Disponible: X, Solicitado: Y"
- Se valida CADA producto del pedido antes de procesar
- Se muestra stock disponible en tiempo real en formulario
- Bloqueo del botón "Crear Pedido" si hay productos sin stock

### CA-3: Cancelación de Pedido Pendiente
Cuando se cancela un pedido en estado "Pendiente":
- El stock se restaura automáticamente
- Se crea movimiento tipo 'order_cancellation' con cantidad positiva
- Se marca el movimiento original de reserva como cancelado
- Se actualiza el stock en tiempo real
- Confirmación al usuario: "Stock restaurado para los productos del pedido"

### CA-4: NO Modificar Stock en Estado Entregado
Cuando un pedido pasa de "Pendiente" a "Entregado":
- NO se modifica el stock (ya fue reducido al crear el pedido)
- Solo se actualiza el estado del pedido
- Se registra timestamp de entrega
- El movimiento de reserva queda como definitivo

### CA-5: Manejo de Concurrencia
Si dos usuarios intentan crear pedidos simultáneos con el mismo producto:
- Se utiliza transacción con nivel de aislamiento SERIALIZABLE
- Lock pesimista en tabla products durante la transacción
- El segundo usuario recibe error si el primero consumió el stock
- Mensaje: "El stock de este producto fue modificado. Por favor, recarga la página y vuelve a intentar"
- Opción de recargar automáticamente el formulario

### CA-6: Stock Disponible vs Stock Reservado
Visualización en detalles de producto:
- **Stock Total**: cantidad física total
- **Stock Reservado**: cantidad asignada a pedidos pendientes
- **Stock Disponible**: Stock Total - Stock Reservado
- Fórmula visible: "Disponible = Total - Reservado"
- Solo el stock disponible puede usarse para nuevos pedidos

### CA-7: Vista de Pedidos con Reservas
En lista de pedidos pendientes:
- Indicador de productos reservados
- Al expandir pedido, mostrar stock reservado por producto
- Botón "Liberar Reserva" (cancela el pedido y restaura stock)
- Advertencia si un producto reservado llega a stock 0 disponible

### CA-8: Logs de Auditoría
Registro completo en inventory_movements:
- Tipo: 'order_reservation' (al crear pedido)
- Tipo: 'order_cancellation' (al cancelar pedido pendiente)
- Vinculado a related_order_id
- Usuario que creó el pedido
- Timestamp exacto
- Permite rastrear todo el ciclo de vida de reservas

## Notas Técnicas
- Campo `reserved_stock` en tabla products
- Transacciones con nivel SERIALIZABLE para operaciones críticas
- Locks durante creación/cancelación de pedidos
- Trigger para mantener consistencia entre stock y reserved_stock

```sql
-- Añadir campo de stock reservado
ALTER TABLE products ADD COLUMN reserved_stock INTEGER DEFAULT 0;

-- Stock disponible siempre debe ser >= 0
ALTER TABLE products ADD CONSTRAINT check_available_stock
CHECK (stock - reserved_stock >= 0);

-- Función para reservar stock
CREATE OR REPLACE FUNCTION reserve_stock_for_order(
    p_order_id INTEGER,
    p_product_id INTEGER,
    p_quantity INTEGER,
    p_user_id INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_current_stock INTEGER;
    v_available_stock INTEGER;
BEGIN
    -- Lock del producto para evitar race conditions
    SELECT stock, (stock - reserved_stock)
    INTO v_current_stock, v_available_stock
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    -- Validar stock disponible
    IF v_available_stock < p_quantity THEN
        RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %',
            v_available_stock, p_quantity;
    END IF;

    -- Reducir stock y aumentar reservado
    UPDATE products
    SET stock = stock - p_quantity,
        reserved_stock = reserved_stock + p_quantity
    WHERE id = p_product_id;

    -- Registrar movimiento
    INSERT INTO inventory_movements (
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        user_id,
        related_order_id
    ) VALUES (
        p_product_id,
        'order_reservation',
        -p_quantity,
        v_current_stock,
        v_current_stock - p_quantity,
        p_user_id,
        p_order_id
    );
END;
$$ LANGUAGE plpgsql;

-- Función para liberar stock al cancelar
CREATE OR REPLACE FUNCTION release_stock_from_order(
    p_order_id INTEGER,
    p_product_id INTEGER,
    p_quantity INTEGER,
    p_user_id INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_current_stock INTEGER;
BEGIN
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    -- Restaurar stock y reducir reservado
    UPDATE products
    SET stock = stock + p_quantity,
        reserved_stock = reserved_stock - p_quantity
    WHERE id = p_product_id;

    -- Registrar movimiento de cancelación
    INSERT INTO inventory_movements (
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        user_id,
        related_order_id
    ) VALUES (
        p_product_id,
        'order_cancellation',
        p_quantity,
        v_current_stock,
        v_current_stock + p_quantity,
        p_user_id,
        p_order_id
    );
END;
$$ LANGUAGE plpgsql;
```

## Definición de Hecho
- [ ] Backend: Campo reserved_stock en tabla products
- [ ] Backend: Funciones de reserva/liberación de stock
- [ ] Backend: Transacciones con locks optimistas
- [ ] Backend: Validación de stock disponible
- [ ] Backend: API para crear pedido con reserva
- [ ] Backend: API para cancelar pedido con liberación
- [ ] Backend: Constraint de stock disponible >= 0
- [ ] Frontend: Validación de stock en formulario de pedido
- [ ] Frontend: Mostrar stock disponible vs reservado
- [ ] Frontend: Mensaje de error si stock insuficiente
- [ ] Frontend: Confirmación al cancelar pedido
- [ ] Base de datos: Migración para reserved_stock
- [ ] Base de datos: Constraints de integridad
- [ ] Pruebas de concurrencia (múltiples pedidos simultáneos)
- [ ] Pruebas de reserva y liberación
- [ ] Pruebas de validación de stock
- [ ] Documentación de API

## Dependencias
- US-INV-001 (sistema de stock)
- US-PROD-001 (tabla products)
- Epic 04 (sistema de pedidos completo)
- US-INV-003 (tabla inventory_movements)

## Tags
`inventory`, `orders`, `reservation`, `concurrency`, `high-priority`, `critical`
