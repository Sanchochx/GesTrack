# US-ORD-014: Descuentos en Pedidos

## Historia de Usuario
**Como** personal de ventas,
**quiero** poder aplicar descuentos a los pedidos,
**para** ofrecer promociones a los clientes.

## Prioridad
**Baja**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Tipos de Descuento
- Dos tipos de descuento disponibles:
  1. **Porcentaje**: descuento del X% sobre el subtotal
  2. **Monto fijo**: descuento de $XXX sobre el subtotal
- Selector o toggle para elegir tipo de descuento
- Solo se puede aplicar un tipo a la vez (no ambos simultáneamente)

### CA-2: Campo de Descuento por Porcentaje
- Campo numérico para ingresar porcentaje (0-100)
- Sufijo o label: "%"
- Validación: debe estar entre 0 y 100
- No permite valores negativos
- Permite decimales (ej: 15.5%)
- Cálculo automático: Descuento = Subtotal × (Porcentaje / 100)

### CA-3: Campo de Descuento por Monto Fijo
- Campo numérico para ingresar monto
- Prefijo: símbolo de moneda ($)
- Validación: debe ser positivo o cero
- No puede exceder el subtotal del pedido
- Si se ingresa monto mayor al subtotal: error "El descuento no puede ser mayor al subtotal"
- Formato con 2 decimales

### CA-4: Aplicación del Descuento
- El descuento se aplica sobre el subtotal (antes de impuestos y envío)
- Orden de cálculo:
  1. Subtotal = suma de productos
  2. Descuento (sobre subtotal)
  3. Subtotal después de descuento
  4. Impuestos (sobre subtotal con descuento)
  5. Envío
  6. Total final
- Los cálculos se actualizan en tiempo real

### CA-5: Descuento a Nivel de Pedido vs Productos
- **Prioridad**: Descuento a nivel de pedido completo (más simple)
- Opcional (futuro): Descuento por producto individual
  - Cada producto tendría su propio campo de descuento
  - Se aplica al subtotal de ese producto específicamente
  - Más complejo de implementar y visualizar

### CA-6: Justificación del Descuento
- Campo requerido: "Motivo del descuento"
- Dropdown con opciones comunes:
  - Promoción especial
  - Cliente frecuente / VIP
  - Liquidación
  - Compensación por inconveniente
  - Descuento autorizado por gerencia
  - Otro (especificar)
- Si selecciona "Otro": campo de texto libre obligatorio (max 200 caracteres)
- El motivo se almacena en el pedido

### CA-7: Autorización de Descuentos Altos
- Descuentos ≤ 20%: Personal de Ventas puede aplicar directamente
- Descuentos > 20%: requiere aprobación de Admin
  - Muestra advertencia: "Descuentos mayores al 20% requieren autorización de administrador"
  - Abre modal para ingresar usuario y contraseña de Admin
  - O solicitud de aprobación (workflow más complejo)
- Se registra quién autorizó el descuento

### CA-8: Visualización del Descuento
- Panel de totales muestra claramente el descuento:
  - Subtotal: $500.00
  - **Descuento (15%)**: -$75.00  [en rojo o color distintivo]
  - Subtotal con descuento: $425.00
  - Impuesto (10%): $42.50
  - Envío: $20.00
  - **TOTAL**: $487.50
- El descuento se muestra con signo negativo
- Formato destacado para que sea obvio

### CA-9: Registro del Descuento
- El pedido almacena:
  - `discount_type`: "percentage" o "fixed"
  - `discount_value`: el valor ingresado (15 para 15%, o 75 para $75)
  - `discount_amount`: el monto calculado en dinero ($75.00)
  - `discount_reason`: motivo textual
  - `discount_authorized_by`: usuario que autorizó (si aplica)
- Visible en vista de detalles del pedido
- Incluido en impresión/PDF

### CA-10: Edición de Descuento
- Se puede modificar o eliminar el descuento mientras el pedido es editable (Pendiente/Confirmado)
- Si se elimina el descuento: recalcular totales
- Si se modifica: requiere nueva justificación
- Si se aumenta el descuento y excede 20%: requiere nueva autorización
- Cambios registrados en auditoría

### CA-11: Restricciones y Validaciones
- No se puede aplicar descuento a pedidos sin productos
- No se puede aplicar descuento mayor al subtotal
- El total final no puede ser negativo
- Si hay descuento y se eliminan todos los productos: remover descuento
- Validaciones tanto en frontend como backend

### CA-12: Reportes de Descuentos
- Métrica en dashboard: total de descuentos otorgados este mes
- Reporte de pedidos con descuento:
  - Número de pedido
  - Cliente
  - Subtotal original
  - Descuento aplicado
  - Total final
  - Motivo
- Útil para análisis de rentabilidad

## Notas Técnicas
- Frontend: componente reutilizable para selector de descuento
- Cálculos usando aritmética decimal precisa (evitar errores de punto flotante)
  - JavaScript: use decimal.js o similar
  - Python: use Decimal
- Validación de porcentaje: 0 ≤ valor ≤ 100
- Validación de monto: 0 ≤ valor ≤ subtotal
- Autorización de Admin:
  - Opción 1: Modal con login de Admin (re-authentication)
  - Opción 2: Sistema de aprobaciones asíncronas (más complejo)
  - Opción 3: Solo Admin puede aplicar descuentos >20% (más simple)
- Almacenamiento:
  ```python
  order.discount_type = "percentage"  # o "fixed"
  order.discount_value = 15.0  # porcentaje o monto
  order.discount_amount = 75.00  # monto calculado final
  order.discount_reason = "Cliente VIP"
  order.discount_authorized_by = admin_user_id  # si aplica
  ```
- Considerar sistema de códigos de descuento (cupones) en futuro
- Logs de auditoría de descuentos aplicados

## Definición de Hecho
- [ ] Frontend: Selector de tipo de descuento (porcentaje/monto)
- [ ] Frontend: Campos de descuento con validaciones
- [ ] Frontend: Campo de justificación/motivo
- [ ] Frontend: Sistema de autorización para descuentos >20%
- [ ] Frontend: Visualización clara del descuento en desglose
- [ ] Frontend: Recalculo automático de totales
- [ ] Frontend: Edición y eliminación de descuento
- [ ] Backend: Validación de tipo y valor de descuento
- [ ] Backend: Validación de autorización para descuentos altos
- [ ] Backend: Almacenamiento de información del descuento
- [ ] Backend: Cálculo preciso con Decimal
- [ ] Backend: API para verificar permisos de descuento
- [ ] Base de datos: Campos de descuento en tabla orders
- [ ] Pruebas de cálculos con descuentos
- [ ] Pruebas de validaciones (límites, autorizaciones)
- [ ] Pruebas de casos edge (descuento = subtotal, etc.)
- [ ] Documentación de políticas de descuento
- [ ] Documentación de API

## Dependencias
- US-ORD-001 (Crear Pedido) - integración en formulario
- US-ORD-002 (Cálculo de Totales) - modificación de cálculos
- US-ORD-008 (Editar Pedido) - para modificar descuentos
- Sistema de roles y permisos para autorización

## Tags
`orders`, `discounts`, `pricing`, `authorization`, `low-priority`
