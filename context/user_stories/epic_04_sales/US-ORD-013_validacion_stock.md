# US-ORD-013: Validación de Stock al Crear Pedido

## Historia de Usuario
**Como** sistema,
**quiero** validar que hay stock suficiente antes de confirmar un pedido,
**para** evitar sobreventa de productos.

## Prioridad
**Alta**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Validación en Tiempo Real al Agregar Producto
- Al agregar un producto al carrito/pedido, el sistema valida stock disponible inmediatamente
- Consulta el stock actual en la base de datos en tiempo real
- Si hay stock suficiente: el producto se agrega correctamente
- Si no hay stock suficiente: muestra mensaje de error y no permite agregar

### CA-2: Mensaje de Error Claro
- Cuando no hay stock suficiente, mostrar mensaje específico:
  - "Stock insuficiente para [Nombre Producto]"
  - "Disponible: X unidades. Solicitado: Y unidades"
- Mensaje visible junto al producto o en notificación destacada
- Color rojo o warning para llamar la atención
- No bloquear el formulario, solo ese producto específico

### CA-3: Indicador de Stock Disponible
- Junto a cada producto en el buscador/selector, mostrar stock disponible:
  - "Stock: 25 unidades"
  - Si stock bajo (<10): color amarillo/naranja
  - Si sin stock (0): color rojo y texto "Sin stock"
- Deshabilitar productos sin stock para selección
- Tooltip con información adicional al hacer hover

### CA-4: Validación al Cambiar Cantidad
- Al aumentar la cantidad de un producto ya agregado, revalidar stock
- Si la nueva cantidad excede el stock: mostrar error y no permitir cambio
- El campo de cantidad se revierte al valor anterior
- Sugerencia: "Máximo disponible: X unidades"
- Botón de "Máximo" para establecer cantidad al stock disponible

### CA-5: Consideración de Stock Reservado
- El stock disponible debe considerar:
  - Stock físico en almacén
  - Menos: stock reservado en otros pedidos "Pendientes" o "Confirmados" no entregados
- Fórmula: Stock Disponible = Stock Total - Stock Reservado
- No considerar pedidos "Cancelados" o "Entregados" como reservados
- Pedidos "Enviados" pueden o no considerarse según política (configurable)

### CA-6: Revalidación al Confirmar Pedido (Backend)
- Cuando se envía el formulario para crear el pedido, revalidar stock en backend
- Verificar que ningún otro usuario haya comprado el producto mientras se creaba el pedido
- Usar transacción de base de datos con nivel de aislamiento apropiado
- Si el stock cambió y ya no es suficiente:
  - Rechazar la creación del pedido
  - Mensaje de error: "El stock de [Producto] se agotó mientras creabas el pedido"
  - Indicar stock disponible actual
  - No crear el pedido parcialmente

### CA-7: Bloqueo de Stock (Opcional)
- Opción avanzada: reservar stock temporalmente mientras se crea el pedido
- Al agregar producto al carrito: "soft lock" del stock por X minutos (ej: 10 min)
- Si no se confirma en ese tiempo, se libera automáticamente
- Requiere sistema de gestión de reservas temporales
- Evita conflictos pero añade complejidad

### CA-8: Manejo de Concurrencia
- Usar bloqueo pesimista o optimista en la tabla de productos durante la transacción
- Bloqueo pesimista (SELECT FOR UPDATE):
  - Bloquea los registros de productos durante la transacción
  - Evita actualizaciones concurrentes
  - Puede causar contención en alta concurrencia
- Bloqueo optimista (versioning):
  - Valida que el stock no cambió entre lectura y escritura
  - Si cambió, rechaza la operación
  - Requiere columna de versión o timestamp

### CA-9: Mensajes de Advertencia de Stock Bajo
- Si el stock disponible es bajo pero suficiente, mostrar advertencia:
  - "Solo quedan X unidades disponibles"
  - Color amarillo/naranja para advertencia
- Permite crear el pedido pero informa al usuario
- Útil para evitar agotar completamente el stock

### CA-10: Logs y Auditoría
- Registrar intentos de sobreventa en logs:
  - Usuario que intentó
  - Producto y cantidad solicitada
  - Stock disponible en ese momento
  - Timestamp
- Útil para analizar demanda no satisfecha
- Ayuda a identificar productos que necesitan reabastecimiento

## Notas Técnicas
- **Validación en Frontend**:
  - API: `GET /api/products/{id}/available-stock`
  - Response: `{ "stock": 25, "reserved": 5, "available": 20 }`
  - Llamada debounced al escribir cantidad (300ms)
  - Validación local para mejorar UX

- **Validación en Backend (crítica)**:
  - No confiar solo en validación de frontend
  - Siempre revalidar al crear el pedido
  - Transacción de base de datos:
    ```python
    with db.transaction():
        # Opción 1: Bloqueo pesimista
        product = Product.query.filter_by(id=product_id).with_for_update().first()

        # Validar stock
        if product.stock < quantity:
            raise InsufficientStockError()

        # Reducir stock
        product.stock -= quantity

        # Crear pedido
        order = Order(...)
        db.session.add(order)
    ```

- **Cálculo de Stock Reservado**:
  ```sql
  SELECT
    p.id,
    p.stock as total_stock,
    COALESCE(SUM(oi.quantity), 0) as reserved_stock,
    p.stock - COALESCE(SUM(oi.quantity), 0) as available_stock
  FROM products p
  LEFT JOIN order_items oi ON oi.product_id = p.id
  LEFT JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('Pendiente', 'Confirmado', 'Procesando')
  GROUP BY p.id
  ```

- Considerar índices en:
  - `products.stock`
  - `orders.status`
  - `order_items.product_id`

- Para alta concurrencia, considerar:
  - Queue de procesamiento de pedidos
  - Redis para bloqueos distribuidos
  - Eventos de stock bajo con notificaciones

## Definición de Hecho
- [ ] Frontend: Validación de stock al agregar producto
- [ ] Frontend: Indicador de stock disponible
- [ ] Frontend: Validación al cambiar cantidad
- [ ] Frontend: Mensajes de error claros
- [ ] Frontend: Advertencias de stock bajo
- [ ] Frontend: Deshabilitar productos sin stock
- [ ] Backend: API de consulta de stock disponible
- [ ] Backend: Cálculo de stock reservado
- [ ] Backend: Revalidación en creación de pedido
- [ ] Backend: Transacción con bloqueo apropiado
- [ ] Backend: Manejo de errores de stock insuficiente
- [ ] Backend: Logs de intentos de sobreventa
- [ ] Base de datos: Índices en tablas relevantes
- [ ] Pruebas de validación de stock
- [ ] Pruebas de concurrencia (dos usuarios comprando mismo producto)
- [ ] Pruebas de transacciones y rollback
- [ ] Pruebas de cálculo de stock reservado
- [ ] Documentación de lógica de validación

## Dependencias
- US-ORD-001 (Crear Pedido) - parte integral
- Epic 02 (Productos) - tabla de productos
- Epic 03 (Inventario) - gestión de stock

## Tags
`orders`, `inventory`, `validation`, `concurrency`, `high-priority`, `critical`
