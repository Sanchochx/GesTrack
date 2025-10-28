# US-INV-002: Ajustes Manuales de Inventario

## Historia de Usuario
**Como** gerente de almacen,
**quiero** poder realizar ajustes manuales al stock de productos,
**para** corregir discrepancias encontradas en conteos físicos.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Formulario de Ajuste
El formulario de ajuste incluye:
- **Producto**: Selector con búsqueda (por nombre o SKU)
- **Stock Actual**: Campo de solo lectura mostrando stock antes del ajuste
- **Tipo de Ajuste**: Selector (Aumento / Disminución)
- **Cantidad**: Campo numérico positivo
- **Nuevo Stock**: Calculado automáticamente (solo lectura)
- **Razón/Motivo**: Campo de texto obligatorio (max 500 caracteres)
- Preview del ajuste antes de confirmar

### CA-2: Tipos de Razón Predefinidos
Lista desplegable con razones comunes:
- "Conteo físico"
- "Producto dañado"
- "Merma"
- "Error de registro"
- "Devolución de cliente"
- "Pérdida"
- "Otro" (permite texto libre adicional)

### CA-3: Validaciones
- No se permite stock negativo resultante
- La cantidad de ajuste debe ser mayor a 0
- El motivo es obligatorio (mínimo 10 caracteres si es texto libre)
- Si la disminución es >50% del stock actual, se requiere doble confirmación

### CA-4: Confirmación de Ajuste
- Modal de confirmación muestra:
  - Stock actual
  - Ajuste a realizar (+X o -X)
  - Nuevo stock
  - Motivo
  - Advertencia si el ajuste es significativo
- Botones: "Cancelar" / "Confirmar Ajuste"

### CA-5: Registro en Historial
Al confirmar el ajuste:
- Se crea registro en `inventory_movements`:
  - movement_type: 'manual_adjustment'
  - quantity: positivo o negativo según el tipo
  - stock_before: stock anterior
  - stock_after: nuevo stock
  - reason: motivo ingresado
  - user_id: usuario que realizó el ajuste
  - timestamp: fecha y hora actual

### CA-6: Actualización de Valor de Inventario
- Se recalcula el valor total del inventario
- Si el producto tiene precio de costo, se actualiza el valor
- Se muestra el impacto monetario del ajuste

### CA-7: Confirmación de Éxito
- Mensaje: "Ajuste de inventario realizado correctamente"
- Muestra resumen: "Stock de [Producto] ajustado de X a Y unidades"
- Opción: "Realizar otro ajuste" / "Ver historial de movimientos"
- Se envía notificación al administrador si el ajuste es significativo (>20% del stock)

## Notas Técnicas
- API endpoint: `POST /api/inventory/adjustments`
- Validación de permisos: solo Admin y Gerente de Almacén
- Transacción atómica: actualizar stock + crear movimiento
- Log de auditoría para todos los ajustes manuales
- Considerar límite de ajustes masivos por día (prevención de errores)

```python
# Ejemplo de lógica backend
def create_manual_adjustment(product_id, adjustment_type, quantity, reason, user_id):
    with db.transaction():
        product = Product.get(product_id, lock=True)
        stock_before = product.stock

        if adjustment_type == 'increase':
            new_stock = stock_before + quantity
        else:  # decrease
            new_stock = stock_before - quantity

        if new_stock < 0:
            raise ValueError("Stock resultante no puede ser negativo")

        # Crear movimiento
        movement = InventoryMovement.create(
            product_id=product_id,
            movement_type='manual_adjustment',
            quantity=quantity if adjustment_type == 'increase' else -quantity,
            stock_before=stock_before,
            stock_after=new_stock,
            reason=reason,
            user_id=user_id
        )

        # Actualizar stock
        product.stock = new_stock
        product.save()

        # Notificar si es ajuste significativo
        if abs(quantity) > stock_before * 0.2:
            notify_admins(f"Ajuste significativo en {product.name}")

        return movement
```

## Definición de Hecho
- [ ] Frontend: Formulario de ajuste de inventario
- [ ] Frontend: Validaciones en tiempo real
- [ ] Frontend: Modal de confirmación con resumen
- [ ] Frontend: Razones predefinidas + opción personalizada
- [ ] Backend: API POST /api/inventory/adjustments
- [ ] Backend: Validación de permisos (solo Admin/Gerente)
- [ ] Backend: Transacción atómica para stock + movimiento
- [ ] Backend: Validación de stock no negativo
- [ ] Backend: Notificaciones para ajustes significativos
- [ ] Base de datos: Tabla inventory_movements
- [ ] Pruebas unitarias de validaciones
- [ ] Pruebas de integración de ajustes
- [ ] Documentación de API

## Dependencias
- US-PROD-001 (Crear Producto)
- US-INV-001 (Seguimiento de Stock) - tabla inventory_movements
- Sistema de notificaciones básico

## Tags
`inventory`, `manual-adjustment`, `audit`, `high-priority`
