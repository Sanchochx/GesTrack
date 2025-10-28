# Epic 05: Supply Chain - Gestión de Proveedores y Compras

## Descripción
Esta épica implementa el módulo completo de gestión de proveedores y órdenes de compra, permitiendo un control efectivo de la cadena de suministro y el reabastecimiento de inventario.

## Objetivos
- Implementar CRUD completo de proveedores
- Gestionar órdenes de compra a proveedores
- Automatizar actualización de inventario al recibir mercancía
- Vincular productos con proveedores preferidos
- Generar sugerencias de reabastecimiento
- Controlar estados del proceso de compra

## Roles con Acceso
- **Admin**: Acceso completo
- **Gerente de Almacén**: Acceso completo (gestión de proveedores y órdenes)
- **Personal de Ventas**: Sin acceso (no involucrado en compras)

## Historias de Usuario

### Gestión de Proveedores
1. **US-SUPP-001**: Registrar Proveedor
2. **US-SUPP-002**: Listar Proveedores
3. **US-SUPP-003**: Ver Perfil del Proveedor
4. **US-SUPP-004**: Editar Proveedor
5. **US-SUPP-013**: Buscar Proveedores y Órdenes
6. **US-SUPP-014**: Productos por Proveedor

### Órdenes de Compra
7. **US-SUPP-005**: Crear Orden de Compra
8. **US-SUPP-006**: Listar Órdenes de Compra
9. **US-SUPP-007**: Gestionar Estados de Orden de Compra
10. **US-SUPP-008**: Recibir Mercancía (Actualizar Inventario)
11. **US-SUPP-009**: Ver Detalles de Orden de Compra
12. **US-SUPP-010**: Editar Orden de Compra
13. **US-SUPP-011**: Cancelar Orden de Compra
14. **US-SUPP-012**: Historial de Órdenes por Proveedor

### Automatización
15. **US-SUPP-015**: Notificaciones de Reabastecimiento

## Dependencias
- Epic 01 (Foundation) - Autenticación requerida
- Epic 02 (Core Data) - Productos deben existir
- Epic 03 (Stock Management) - Integración con inventario

## Modelo de Datos Principal
```
Supplier:
  - id (PK)
  - company_name
  - contact_name
  - email (único)
  - phone
  - address
  - website
  - payment_info
  - created_at
  - updated_at

PurchaseOrder:
  - id (PK)
  - order_number (único)
  - supplier_id (FK)
  - order_date
  - estimated_delivery_date
  - received_date
  - status (Pending, Confirmed, In Transit, Received, Cancelled)
  - subtotal
  - shipping_cost
  - total
  - notes
  - created_by (FK -> User)
  - created_at
  - updated_at

PurchaseOrderItem:
  - id (PK)
  - purchase_order_id (FK)
  - product_id (FK)
  - quantity_ordered
  - quantity_received
  - unit_price
  - subtotal

SupplierProduct:
  - id (PK)
  - supplier_id (FK)
  - product_id (FK)
  - preferred_supplier (boolean)
  - last_purchase_price
  - updated_at
```

## Flujo Principal
1. Gerente identifica productos con stock bajo (desde Epic 03)
2. Crea orden de compra seleccionando proveedor
3. Agrega productos y cantidades
4. Confirma orden (estado: Pendiente → Confirmada)
5. Proveedor envía mercancía (estado: En Tránsito)
6. Al recibir, registra cantidades reales
7. Sistema actualiza inventario automáticamente (estado: Recibida)

## Criterios de Éxito
- ✓ Proveedores pueden registrarse y gestionarse
- ✓ Órdenes de compra se crean y rastrean correctamente
- ✓ Estados de órdenes fluyen correctamente
- ✓ Inventario se actualiza automáticamente al recibir mercancía
- ✓ Validación de cantidades recibidas vs ordenadas
- ✓ Historial de compras por proveedor accesible
- ✓ Sugerencias de reabastecimiento funcionan
- ✓ Vinculación productos-proveedores operativa

## Stack Técnico
- Backend: Flask + SQLAlchemy
- Base de datos: PostgreSQL
- Validaciones: Backend y frontend
- Notificaciones: Sistema de alertas interno

## Prioridad
**MEDIA** - Puede desarrollarse en paralelo con Epic 04 (Sales)

## Estimación
- Duración: 3-4 semanas
- Complejidad: Media-Alta
- Puntos: 34 story points

## Notas Técnicas
- Implementar transacciones atómicas al recibir mercancía
- Considerar validación de stock negativo
- Mantener auditoría de cambios en órdenes
- Integración estrecha con módulo de inventario
