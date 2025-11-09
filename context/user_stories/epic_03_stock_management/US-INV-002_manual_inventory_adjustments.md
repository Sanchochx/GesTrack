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

### CA-1: Formulario de Ajuste ✅
El formulario de ajuste incluye:
- [x] **Producto**: Selector con búsqueda (por nombre o SKU)
- [x] **Stock Actual**: Campo de solo lectura mostrando stock antes del ajuste
- [x] **Tipo de Ajuste**: Selector (Aumento / Disminución)
- [x] **Cantidad**: Campo numérico positivo
- [x] **Nuevo Stock**: Calculado automáticamente (solo lectura)
- [x] **Razón/Motivo**: Campo de texto obligatorio (max 500 caracteres)
- [x] Preview del ajuste antes de confirmar

### CA-2: Tipos de Razón Predefinidos ✅
Lista desplegable con razones comunes:
- [x] "Conteo físico"
- [x] "Producto dañado"
- [x] "Merma"
- [x] "Error de registro"
- [x] "Devolución de cliente"
- [x] "Pérdida"
- [x] "Otro" (permite texto libre adicional)

### CA-3: Validaciones ✅
- [x] No se permite stock negativo resultante
- [x] La cantidad de ajuste debe ser mayor a 0
- [x] El motivo es obligatorio (mínimo 10 caracteres si es texto libre)
- [x] Si la disminución es >50% del stock actual, se requiere doble confirmación

### CA-4: Confirmación de Ajuste ✅
- Modal de confirmación muestra:
  - [x] Stock actual
  - [x] Ajuste a realizar (+X o -X)
  - [x] Nuevo stock
  - [x] Motivo
  - [x] Advertencia si el ajuste es significativo
- [x] Botones: "Cancelar" / "Confirmar Ajuste"

### CA-5: Registro en Historial ✅
Al confirmar el ajuste:
- Se crea registro en `inventory_movements`:
  - [x] movement_type: 'Ajuste Manual'
  - [x] quantity: positivo o negativo según el tipo
  - [x] stock_before: stock anterior (previous_stock)
  - [x] stock_after: nuevo stock (new_stock)
  - [x] reason: motivo ingresado
  - [x] user_id: usuario que realizó el ajuste
  - [x] timestamp: fecha y hora actual (created_at)

### CA-6: Actualización de Valor de Inventario ✅
- [x] Se recalcula el valor total del inventario
- [x] Si el producto tiene precio de costo, se actualiza el valor
- [x] Se muestra el impacto monetario del ajuste

### CA-7: Confirmación de Éxito ✅
- [x] Mensaje: "Ajuste de inventario realizado correctamente"
- [x] Muestra resumen: "Stock de [Producto] ajustado de X a Y unidades"
- [x] Opción: "Realizar otro ajuste" / "Ver historial de movimientos"
- [x] Se envía notificación al administrador si el ajuste es significativo (>20% del stock) - implementado como log en consola

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
- [x] Frontend: Formulario de ajuste de inventario
- [x] Frontend: Validaciones en tiempo real
- [x] Frontend: Modal de confirmación con resumen
- [x] Frontend: Razones predefinidas + opción personalizada
- [x] Backend: API POST /api/inventory/adjustments
- [x] Backend: Validación de permisos (solo Admin/Gerente)
- [x] Backend: Transacción atómica para stock + movimiento
- [x] Backend: Validación de stock no negativo
- [x] Backend: Notificaciones para ajustes significativos (log simplificado)
- [x] Base de datos: Tabla inventory_movements (ya existía de US-INV-001)
- [ ] Pruebas unitarias de validaciones (opcional para v1.0)
- [ ] Pruebas de integración de ajustes (opcional para v1.0)
- [ ] Documentación de API (opcional para v1.0)

## Dependencias
- US-PROD-001 (Crear Producto)
- US-INV-001 (Seguimiento de Stock) - tabla inventory_movements
- Sistema de notificaciones básico

## Tags
`inventory`, `manual-adjustment`, `audit`, `high-priority`
