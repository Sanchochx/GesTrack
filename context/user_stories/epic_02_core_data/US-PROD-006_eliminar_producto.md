# US-PROD-006: Eliminar Producto

## Historia de Usuario
**Como** administrador,
**quiero** poder eliminar productos del sistema,
**para** mantener limpio el catálogo de productos obsoletos.

## Prioridad
**Baja**

## Estimación
3 Story Points

## Criterios de Aceptación

### CA-1: Restricción por Rol
- Solo usuarios con rol **Admin** pueden eliminar productos
- Para otros roles, el botón de eliminar:
  - No se muestra, o
  - Está visible pero deshabilitado con tooltip: "No tienes permisos para eliminar productos"
- Validación tanto en frontend como en backend

### CA-2: Modal de Confirmación
Antes de eliminar, muestra modal de confirmación que incluye:
- Título: "⚠️ ¿Eliminar Producto?"
- Información del producto:
  - Imagen thumbnail
  - Nombre del producto
  - SKU
  - Stock actual
- Texto: "Esta acción no se puede deshacer. ¿Estás seguro?"
- Botones:
  - "Cancelar" (secundario, cerrar modal)
  - "Eliminar" (peligro/rojo, ejecutar eliminación)

### CA-3: Validación de Pedidos Asociados
- Antes de permitir eliminación, verificar si el producto tiene pedidos asociados
- Si tiene pedidos (compra o venta):
  - **No** se puede eliminar
  - Mostrar mensaje: "❌ No se puede eliminar este producto porque tiene pedidos asociados."
  - Sugerencia: "Puedes marcarlo como inactivo en su lugar."
  - Mostrar cantidad de pedidos: "X pedidos de compra, Y pedidos de venta"
  - Botón alternativo: "Inactivar Producto"

### CA-4: Alerta de Stock Existente
- Si el producto tiene stock > 0:
  - Mostrar alerta en el modal: "⚠️ Este producto tiene X unidades en stock."
  - Pregunta adicional: "¿Deseas eliminarlo de todas formas?"
  - Requerir confirmación adicional:
    - Checkbox: "Confirmo que deseo eliminar este producto con stock"
    - El botón "Eliminar" solo se habilita si marca el checkbox

### CA-5: Registro en Historial
Al eliminar un producto:
- Se registra en tabla de auditoría/logs:
  - ID del producto eliminado
  - Información del producto (JSON)
  - Usuario que eliminó
  - Fecha y hora
  - Razón (opcional, campo de texto en modal)
- Este registro permite auditoría y potencial recuperación

### CA-6: Eliminación de Recursos Asociados
Al eliminar un producto:
- Eliminar imagen del servidor (si existe)
- Eliminar movimientos de inventario asociados
- Considerar eliminación en cascada o soft delete según diseño
- Mantener integridad referencial

### CA-7: Confirmación de Eliminación Exitosa
Después de eliminar:
- Mensaje: "✓ Producto eliminado correctamente"
- Duración: 3 segundos
- Opción de deshacer (opcional, si se implementa soft delete)
- Redirige a la lista de productos
- El producto ya no aparece en la lista

### CA-8: Manejo de Errores
- Si la eliminación falla:
  - Mensaje de error específico
  - "No se pudo eliminar el producto. Intenta nuevamente."
  - Log de error en backend para debugging
- Si el producto no existe (ya fue eliminado):
  - Mensaje: "Este producto ya no existe en el sistema"
  - Redirige a lista de productos

### CA-9: Alternativa - Inactivar Producto
En lugar de eliminar físicamente:
- Opción de "Inactivar" en lugar de "Eliminar"
- Soft delete: marca producto como inactivo/eliminado
- Campo `deleted_at` o `is_active = false`
- Productos inactivos:
  - No aparecen en lista normal
  - No disponibles para nuevos pedidos
  - Pedidos antiguos mantienen referencia
- Opción de "Ver productos inactivos" para Admin

## Notas Técnicas
- API endpoint: `DELETE /api/products/{id}`
- Considerar implementar soft delete en lugar de hard delete:
  - Agregar campo `deleted_at` (timestamp nullable)
  - Productos con `deleted_at != null` se consideran eliminados
  - Permite recuperación y auditoría
- Verificar relaciones antes de eliminar:
  - Pedidos de compra
  - Pedidos de venta
  - Movimientos de inventario
- Usar transacciones para asegurar consistencia
- Eliminar archivo de imagen del servidor de forma asíncrona
- Implementar política de retención de datos eliminados
- Logs de auditoría obligatorios para eliminaciones

## Definición de Hecho
- [ ] Frontend: Botón de eliminar visible solo para Admin
- [ ] Frontend: Modal de confirmación implementado
- [ ] Frontend: Validación y alerta de pedidos asociados
- [ ] Frontend: Alerta de stock existente con confirmación
- [ ] Frontend: Campo de razón de eliminación (opcional)
- [ ] Frontend: Mensaje de confirmación de eliminación exitosa
- [ ] Frontend: Manejo de errores
- [ ] Backend: API DELETE /api/products/{id}
- [ ] Backend: Verificación de permisos (solo Admin)
- [ ] Backend: Validación de pedidos asociados
- [ ] Backend: Registro en tabla de auditoría
- [ ] Backend: Eliminación de imagen del servidor
- [ ] Backend: Soft delete o hard delete implementado
- [ ] Backend: Manejo de relaciones y cascada
- [ ] Pruebas unitarias y de integración
- [ ] Pruebas de permisos y restricciones
- [ ] Documentación de API

## Dependencias
- US-PROD-001 (Crear Producto) debe estar completo
- US-PROD-002 (Listar Productos) debe estar completo
- US-PROD-004 (Ver Detalles) debe estar completo
- Epic 01 (Autenticación y permisos) debe estar completa
- Epic 03 (Pedidos) debe estar diseñado para validar relaciones

## Tags
`products`, `crud`, `delete`, `low-priority`, `admin-only`, `soft-delete`
