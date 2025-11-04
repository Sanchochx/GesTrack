# US-PROD-005: Editar Producto

## Historia de Usuario
**Como** gerente de almacén,
**quiero** poder modificar la información de un producto existente,
**para** mantener los datos actualizados.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### [x] CA-1: Formulario Precargado
- El formulario se abre con todos los datos actuales del producto
- Todos los campos están poblados con valores existentes:
  - Nombre, SKU, descripción
  - Precio de costo, precio de venta
  - Stock actual (solo lectura)
  - Punto de reorden
  - Categoría seleccionada
  - Imagen actual mostrada
- Título del formulario: "Editar Producto: {Nombre del Producto}"

### [x] CA-2: Campo SKU No Editable
- El campo SKU está visible pero deshabilitado (read-only)
- Tooltip explicativo: "El SKU no puede modificarse una vez creado"
- Muestra visualmente que el campo no es editable (color gris, cursor not-allowed)
- Razón: Evitar problemas de integridad referencial

### [x] CA-3: Validación de Campos
Se validan todos los campos editables igual que en creación:
- **Nombre**: Requerido, max 200 caracteres
- **Descripción**: Opcional, max 1000 caracteres
- **Precio de Costo**: Requerido, positivo, 2 decimales, mayor a 0
- **Precio de Venta**: Requerido, positivo, 2 decimales, mayor a 0
- **Punto de Reorden**: Entero, ≥0
- **Categoría**: Requerida, debe existir
- Validaciones en tiempo real (frontend) y al guardar (backend)

### [x] CA-4: Validación de Precios
- Si precio de venta < precio de costo:
  - Muestra warning: "⚠️ El precio de venta es menor al costo. Esto generará pérdidas."
  - Permite continuar pero solicita confirmación
  - Modal de confirmación: "¿Estás seguro de que deseas guardar con precio de venta menor al costo?"
- Recalcula el margen de ganancia en tiempo real al modificar precios

### [x] CA-5: Recálculo de Margen
- El margen de ganancia se recalcula automáticamente al cambiar precios
- Fórmula: `((Precio Venta - Precio Costo) / Precio Costo) * 100`
- Se muestra en tiempo real mientras el usuario edita
- Formato: "Margen: X.XX%"
- Código de colores: verde (>30%), amarillo (15-30%), rojo (<15%)
- Comparación: "Margen anterior: Y.YY% → Nuevo: X.XX%"

### [x] CA-6: Actualización de Imagen
- Se muestra la imagen actual del producto
- Botón: "Cambiar imagen"
- Al seleccionar nueva imagen:
  - Preview de la nueva imagen
  - Opción de cancelar y mantener imagen anterior
  - Validación de formato (JPG, PNG, WEBP) y tamaño (max 5MB)
- La imagen anterior se mantiene si no se selecciona una nueva

### [x] CA-7: Confirmación de Cambios Importantes
Para cambios significativos, solicitar confirmación:
- Cambio de precio de costo/venta superior al 20%
- Cambio de categoría
- Modal de confirmación que muestra:
  - Campo modificado
  - Valor anterior vs valor nuevo
  - Botones: "Confirmar cambios" / "Cancelar"

### [x] CA-8: Registro de Auditoría
- Al guardar cambios exitosamente:
  - Se actualiza campo `updated_at` con timestamp actual
  - Se registra usuario que realizó la modificación
  - (Opcional) Se guarda log de cambios en tabla de auditoría

### [x] CA-9: Mensajes de Confirmación
- Al guardar exitosamente:
  - Mensaje: "✓ Producto actualizado correctamente"
  - Duración: 3 segundos
  - Opción: "Ver producto" (redirige a detalles) o "Volver a lista"
- Si hay errores:
  - Mensajes específicos junto a cada campo con error
  - Notificación general: "Por favor corrige los errores marcados"

### [x] CA-10: Manejo de Errores
- Validaciones en frontend antes de enviar
- Si falla la actualización, mantener datos en formulario
- Errores de backend se muestran claramente
- Botón de guardar se deshabilita mientras procesa (evitar doble envío)
- Loading spinner durante el guardado

### [x] CA-11: Botón Cancelar
- Botón "Cancelar" visible en todo momento
- Si hay cambios sin guardar:
  - Modal de confirmación: "¿Deseas descartar los cambios?"
  - Opciones: "Descartar" / "Seguir editando"
- Si no hay cambios, redirige directamente

## Notas Técnicas
- API endpoint: `PUT /api/products/{id}` o `PATCH /api/products/{id}`
- Usar PATCH si se permite actualización parcial
- Validar que el producto existe antes de actualizar
- Verificar permisos del usuario para editar
- Si se cambia imagen, eliminar imagen anterior del servidor
- Optimización de imagen antes de almacenar
- Considerar implementar versionado de productos para auditoría completa
- Bloqueo optimista: verificar `updated_at` para evitar conflictos de concurrencia

## Definición de Hecho
- [x] Frontend: Formulario de edición con datos precargados
- [x] Frontend: Campo SKU no editable
- [x] Frontend: Validaciones en tiempo real
- [x] Frontend: Recálculo automático de margen
- [x] Frontend: Actualización de imagen funcional
- [x] Frontend: Confirmación para cambios importantes
- [x] Frontend: Mensajes de confirmación y error
- [x] Frontend: Botón cancelar con confirmación
- [x] Backend: API PUT/PATCH /api/products/{id}
- [x] Backend: Validación de todos los campos
- [x] Backend: Registro de auditoría (updated_at, updated_by)
- [x] Backend: Manejo de actualización de imágenes
- [x] Backend: Verificación de permisos
- [x] Prevención de conflictos de concurrencia
- [ ] Pruebas unitarias y de integración (Opcional para v1.0)
- [x] Documentación de API

## Dependencias
- US-PROD-001 (Crear Producto) debe estar completo
- US-PROD-004 (Ver Detalles) debe estar completo
- US-PROD-007 (Categorías) debe estar completo
- Epic 01 (Autenticación y permisos) debe estar completa

## Tags
`products`, `crud`, `update`, `edit`, `high-priority`
