# US-ORD-002: Cálculo Automático de Totales

## Historia de Usuario
**Como** personal de ventas,
**quiero** que el sistema calcule automáticamente subtotal, impuestos, envío y total,
**para** no tener que hacer cálculos manuales.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Cálculo de Subtotal
- Subtotal = suma de (precio de venta × cantidad) de todos los productos
- Se actualiza automáticamente al agregar/eliminar productos
- Se actualiza al cambiar cantidades o precios unitarios
- Formato: dos decimales, separador de miles
- Etiqueta clara: "Subtotal: $X,XXX.XX"

### CA-2: Configuración y Cálculo de Impuestos
- Campo numérico para porcentaje de impuesto (0-100%)
- Por defecto: 0% (configurable por empresa)
- Monto de impuestos = subtotal × (porcentaje / 100)
- Se actualiza en tiempo real al cambiar subtotal o porcentaje
- Desglose visible: "Impuesto (XX%): $XXX.XX"
- Validación: porcentaje debe estar entre 0 y 100

### CA-3: Costo de Envío
- Campo numérico para costo de envío
- Por defecto: $0.00
- Valor editable manualmente
- Solo números positivos o 0
- Etiqueta: "Envío: $XXX.XX"
- Opcional: diferentes métodos de envío predefinidos con costos

### CA-4: Aplicación de Descuentos
- Opciones: descuento por monto fijo o por porcentaje
- Radio buttons o toggle: "Monto" / "Porcentaje"
- Si es porcentaje: validar rango 0-100%
- Si es monto: validar que no exceda el subtotal
- Descuento aplicado sobre el subtotal (antes de impuestos y envío)
- Muestra: "Descuento: -$XXX.XX" o "Descuento (XX%): -$XXX.XX"

### CA-5: Cálculo de Total
- Fórmula: Total = Subtotal + Impuestos + Envío - Descuento
- Se actualiza automáticamente cuando cambia cualquier componente
- Destacado visualmente (fuente más grande, negrita)
- Etiqueta: "TOTAL: $X,XXX.XX"
- Color verde si hay descuento aplicado

### CA-6: Desglose Completo
- Panel de resumen muestra todos los componentes:
  - Subtotal
  - Descuento (si aplica)
  - Subtotal después de descuento
  - Impuesto (XX%)
  - Envío
  - **TOTAL**
- Cada componente en línea separada
- Formato consistente y alineado

### CA-7: Formato de Montos
- Todos los montos con 2 decimales exactos
- Separador de miles (coma o punto según configuración regional)
- Símbolo de moneda ($, €, etc.) según configuración
- Formato: "$1,234.56"
- Descuentos con signo negativo: "-$123.45"

### CA-8: Actualización en Tiempo Real
- Los cálculos se ejecutan inmediatamente al cambiar cualquier valor
- No requiere botón de "Calcular" o "Actualizar"
- Debounce de 300ms en campos de texto para evitar cálculos excesivos
- Feedback visual durante el cálculo (opcional: spinner pequeño)

### CA-9: Validación de Valores
- Solo números en campos numéricos
- No permitir valores negativos (excepto descuento en visualización)
- Redondeo correcto a 2 decimales en todos los cálculos
- Manejo de casos edge: división por cero, valores muy grandes

### CA-10: Almacenamiento
- Al guardar el pedido, se almacenan todos los componentes:
  - subtotal
  - tax_rate (porcentaje)
  - tax_amount (monto calculado)
  - shipping_cost
  - discount_amount
  - total
- Los valores almacenados son los finales al momento de crear/editar
- No se recalculan automáticamente después de guardar

## Notas Técnicas
- Implementar función de cálculo reutilizable: `calculateOrderTotals(items, taxRate, shippingCost, discount)`
- Usar bibliotecas de precisión decimal para evitar errores de punto flotante
  - JavaScript: decimal.js o big.js
  - Python: Decimal
- Validar cálculos tanto en frontend como backend
- El backend debe recalcular todo antes de guardar (no confiar en valores del frontend)
- Considerar configuración global de:
  - Moneda por defecto
  - Símbolo de moneda
  - Tasa de impuesto por defecto
  - Posición del símbolo de moneda

## Definición de Hecho
- [ ] Frontend: Implementación de cálculo de subtotal
- [ ] Frontend: Campo de porcentaje de impuesto con cálculo
- [ ] Frontend: Campo de costo de envío
- [ ] Frontend: Campos de descuento (monto y porcentaje)
- [ ] Frontend: Cálculo de total combinado
- [ ] Frontend: Panel de desglose de totales
- [ ] Frontend: Formateo correcto de montos (2 decimales, separadores)
- [ ] Frontend: Actualización en tiempo real con debounce
- [ ] Frontend: Validaciones de campos numéricos
- [ ] Backend: Función de cálculo de totales
- [ ] Backend: Validación de valores recibidos
- [ ] Backend: Recálculo de totales antes de guardar
- [ ] Base de datos: Campos para almacenar componentes del total
- [ ] Pruebas unitarias de función de cálculo
- [ ] Pruebas de casos edge (valores extremos, decimales)
- [ ] Pruebas de precisión decimal
- [ ] Documentación de lógica de cálculo

## Dependencias
- US-ORD-001 (Crear Pedido) - parte integral del formulario
- Configuración de moneda del sistema

## Tags
`orders`, `calculations`, `business-logic`, `high-priority`
