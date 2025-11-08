# US-PROD-010: Cálculo de Margen de Ganancia

## Historia de Usuario
**Como** gerente de almacén,
**quiero** ver el margen de ganancia calculado automáticamente,
**para** evaluar la rentabilidad de cada producto.

## Prioridad
**Media**

## Estimación
3 Story Points

## Criterios de Aceptación

### CA-1: Fórmula de Cálculo
El margen de ganancia se calcula con la fórmula:
```
Margen (%) = ((Precio de Venta - Precio de Costo) / Precio de Costo) × 100
```
Ejemplos:
- Costo: $100, Venta: $150 → Margen: 50%
- Costo: $50, Venta: $60 → Margen: 20%
- Costo: $80, Venta: $80 → Margen: 0%
- Costo: $100, Venta: $90 → Margen: -10%

### CA-2: Formato de Visualización
El margen se muestra con:
- Formato: "X.XX%" (dos decimales)
- Signo positivo/negativo explícito:
  - Positivo: "+25.50%" (opcional el +)
  - Negativo: "-10.00%"
- Ejemplos: "50.00%", "25.50%", "0.00%", "-10.00%"

### CA-3: Código de Colores
Se aplica código de colores según el valor del margen:
- **Verde** (éxito): Margen > 30%
  - Indica excelente rentabilidad
  - Color: #22c55e o similar
- **Amarillo** (advertencia): Margen entre 15% y 30%
  - Indica rentabilidad moderada
  - Color: #eab308 o similar
- **Rojo** (peligro): Margen < 15%
  - Indica baja rentabilidad o pérdida
  - Color: #ef4444 o similar
- Badge o chip con color de fondo y texto contrastante

### CA-4: Cálculo en Tiempo Real
En formularios de crear/editar producto:
- El margen se calcula automáticamente al:
  - Ingresar precio de costo
  - Ingresar precio de venta
  - Modificar cualquiera de los dos precios
- Actualización instantánea (sin necesidad de guardar)
- Se muestra debajo o al lado de los campos de precio
- Label: "Margen de Ganancia:" seguido del porcentaje

### CA-5: Visualización en Lista de Productos
En la tabla de productos (opcional, según espacio):
- Columna "Margen" que muestra el porcentaje
- Con código de colores aplicado
- Ordenable: clic en encabezado ordena por margen
- Permite identificar rápidamente productos de baja rentabilidad

### CA-6: Visualización en Detalles de Producto
En la vista de detalles:
- Sección dedicada a "Rentabilidad" o "Precios"
- Muestra:
  - Precio de Costo: $XX.XX
  - Precio de Venta: $XX.XX
  - **Margen de Ganancia: XX.XX%** (destacado, con color)
- Información adicional:
  - Ganancia por unidad: $XX.XX
    - Calculado: Precio Venta - Precio Costo
  - Ejemplo visual: "Por cada $100 de costo, ganas $XX"

### CA-7: Alertas de Margen Bajo o Negativo
Si el margen es < 0% (negativo):
- Alerta visible:
  - Icono ⚠️
  - Texto: "El precio de venta es menor al costo. Este producto genera pérdidas."
  - Color rojo
- En formulario de crear/editar:
  - Modal de confirmación antes de guardar
  - "¿Estás seguro de que deseas guardar con un margen negativo?"

Si el margen es 0-5%:
- Warning suave:
  - "Margen muy bajo. Considera ajustar el precio de venta."

### CA-8: Comparación de Márgenes (Opcional)
En vista de lista o dashboard:
- Estadísticas de márgenes:
  - Margen promedio de todos los productos: XX.XX%
  - Producto con mejor margen: {Nombre} (XX.XX%)
  - Producto con peor margen: {Nombre} (XX.XX%)
  - Cantidad de productos con margen < 15%
- Gráfico de distribución de márgenes (opcional)

### CA-9: Edición Rápida desde Margen
En la vista de detalles o lista:
- Si el margen es bajo:
  - Botón o enlace: "Ajustar Precio"
  - Abre modal para editar precio de venta rápidamente
  - Muestra cálculo en tiempo real del nuevo margen
  - Sugerencia: "Para lograr un margen del 30%, el precio de venta debería ser $XX.XX"

### CA-10: Calculadora de Precio Sugerido (Opcional)
En formulario de crear/editar:
- Campo adicional: "Margen deseado: ____%"
- Al ingresar margen deseado:
  - Calcula automáticamente precio de venta necesario
  - Fórmula: `Precio Venta = Precio Costo × (1 + Margen/100)`
  - Botón: "Aplicar precio sugerido"
- Útil para establecer precios basados en margen objetivo

### CA-11: Historial de Márgenes (Opcional)
Si se guarda histórico de cambios de precios:
- Gráfico de evolución del margen en el tiempo
- Muestra cómo ha variado el margen con cambios de precio
- Útil para análisis de rentabilidad histórica

## Notas Técnicas
- Cálculo en backend y frontend:
  - Backend: Al guardar producto, calcular y almacenar
  - Frontend: Cálculo en tiempo real para UX
- Campo `profit_margin` en tabla `products` (decimal, nullable)
  - Almacenar valor calculado para consultas rápidas
  - Actualizar automáticamente al cambiar precios
- Trigger o hook en base de datos (opcional):
  - Actualiza `profit_margin` automáticamente al UPDATE de precios
- Función reutilizable para cálculo:
  ```javascript
  function calculateMargin(costPrice, salePrice) {
    if (costPrice === 0) return 0;
    return ((salePrice - costPrice) / costPrice) * 100;
  }
  ```
- Manejar casos especiales:
  - Precio de costo = 0: Margen = 0% o N/A
  - Precios negativos: Validar que no ocurra
- Redondeo consistente: 2 decimales en todo el sistema
- Índice en campo `profit_margin` para ordenamiento rápido

## Definición de Hecho
- [x] Backend: Campo profit_margin en tabla products
- [x] Backend: Función de cálculo de margen
- [x] Backend: Actualización automática al cambiar precios
- [x] Frontend: Cálculo en tiempo real en formularios
- [x] Frontend: Visualización con código de colores
- [x] Frontend: Mostrar margen en lista de productos (opcional)
- [x] Frontend: Sección de rentabilidad en detalles
- [x] Frontend: Alertas de margen bajo o negativo
- [ ] Frontend: Calculadora de precio sugerido (opcional)
- [x] Validación de márgenes negativos con confirmación
- [x] Formato consistente (X.XX%)
- [ ] Estadísticas de márgenes en dashboard (opcional)
- [x] Pruebas unitarias de función de cálculo
- [x] Pruebas de casos extremos (costo = 0, precios iguales, etc.)
- [x] Documentación de fórmula y lógica

## Dependencias
- US-PROD-001 (Crear Producto) debe estar completo
- US-PROD-005 (Editar Producto) debe estar completo
- US-PROD-004 (Ver Detalles) debe estar completo

## Tags
`products`, `pricing`, `profitability`, `calculation`, `medium-priority`, `business-logic`
