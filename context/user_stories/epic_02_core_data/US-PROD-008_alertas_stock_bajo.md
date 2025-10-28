# US-PROD-008: Alertas de Stock Bajo

## Historia de Usuario
**Como** gerente de almacén,
**quiero** recibir alertas cuando productos estén por debajo del punto de reorden,
**para** poder reabastecer a tiempo.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Configuración de Punto de Reorden
- Cada producto tiene un campo "Punto de Reorden" (reorder_point)
- Se configura al crear o editar producto
- Campo numérico entero, valor por defecto: 10 unidades
- Tooltip explicativo: "Cantidad mínima antes de alertar para reabastecer"
- Validación: debe ser ≥ 0

### CA-2: Detección de Stock Bajo
Un producto se considera "Stock Bajo" cuando:
- `stock_actual ≤ punto_de_reorden` y `stock_actual > 0`
- La verificación se realiza:
  - Al crear/actualizar producto
  - Al registrar movimiento de inventario (salida)
  - Al cargar lista de productos

### CA-3: Indicador Visual en Lista de Productos
En la tabla de productos, mostrar indicadores para stock bajo:
- **Icono de alerta**: ⚠️ en color naranja/rojo junto al stock
- **Clase CSS especial**: Resalta la fila con fondo tenue amarillo/naranja
- **Badge**: "Stock Bajo" en color naranja
- **Tooltip al hover**: "Stock bajo: X unidades (punto de reorden: Y)"
- Productos sin stock (stock = 0):
  - Badge "SIN STOCK" en rojo
  - Icono 🚫
  - Fila con fondo rojo tenue

### CA-4: Vista Dedicada de Productos con Stock Bajo
Crear página o filtro dedicado:
- Ruta: `/products/low-stock` o tab "Stock Bajo"
- Muestra solo productos con stock ≤ punto de reorden
- Tabla similar a lista de productos con:
  - Columnas adicionales: "Punto de Reorden", "Diferencia"
  - Ordenamiento por defecto: stock más bajo primero
  - Destacar productos con stock = 0 en la parte superior
- Botón de acción rápida: "Crear Pedido de Compra" por producto
- Opción de exportar lista a CSV/PDF

### CA-5: Contador en Dashboard
En el dashboard principal:
- Widget/card que muestra: "Productos con Stock Bajo"
- Número grande y destacado con cantidad de productos
- Colores:
  - Verde: 0 productos con stock bajo
  - Amarillo: 1-5 productos
  - Naranja: 6-10 productos
  - Rojo: >10 productos
- Clickeable: redirige a vista de productos con stock bajo
- Subtexto: "X productos sin stock" (si aplica)

### CA-6: Alerta en Detalles de Producto
En la vista de detalles de un producto con stock bajo:
- Banner de alerta en la parte superior:
  - Icono ⚠️
  - Texto: "Este producto tiene stock bajo. Stock actual: X | Punto de reorden: Y"
  - Color naranja/amarillo
  - Botón: "Crear Pedido de Compra"
- Si stock = 0:
  - Banner crítico en rojo
  - Texto: "Este producto NO tiene stock disponible"
  - Botón: "Reabastecer Urgente"

### CA-7: Notificaciones por Email (Opcional)
Sistema de notificaciones por email:
- Configuración por usuario: "Recibir alertas de stock bajo"
- Frecuencia: Diaria (resumen) o inmediata (cuando ocurre)
- Email incluye:
  - Lista de productos con stock bajo
  - Stock actual vs punto de reorden
  - Enlace directo a cada producto
  - Botón: "Ver todos los productos con stock bajo"
- Se envía solo si hay productos con stock bajo

### CA-8: Configuración de Alertas por Usuario
Panel de configuración de notificaciones:
- Checkbox: "Recibir alertas de stock bajo"
- Selector: "Frecuencia de alertas"
  - Inmediata (en el momento)
  - Resumen diario (una vez al día)
  - Resumen semanal
- Checkbox: "Solo alertar para productos críticos" (opcional)
- Guardar preferencias por usuario

### CA-9: Historial de Alertas
Registro de todas las alertas generadas:
- Tabla de auditoría con:
  - Producto
  - Fecha/hora de alerta
  - Stock en ese momento
  - Punto de reorden
  - Estado: Pendiente / Reabastecido
- Permite análisis de frecuencia de stock bajo por producto

### CA-10: Acciones Rápidas desde Alertas
Desde la vista de stock bajo o alertas:
- Botón "Crear Pedido de Compra" por producto
  - Abre formulario de pedido con producto preseleccionado
  - Sugiere cantidad: (punto_de_reorden * 2) - stock_actual
- Botón "Ajustar Punto de Reorden"
  - Permite modificar rápidamente el punto de reorden
  - Útil si las alertas son demasiado frecuentes o tardías

## Notas Técnicas
- Campo `reorder_point` en tabla `products` (integer, default 10)
- Índice en columna `stock` para consultas rápidas
- Query optimizada para detectar stock bajo:
  ```sql
  SELECT * FROM products WHERE stock <= reorder_point AND stock > 0
  ```
- Considerar vista materializada para dashboard si hay muchos productos
- Job/cron para enviar emails diarios (si se implementa notificaciones)
- Cache de contador de stock bajo (5 minutos)
- Evento en sistema al detectar stock bajo (para extensibilidad)
- Log de alertas en tabla separada para auditoría

## Definición de Hecho
- [ ] Base de datos: Campo reorder_point en tabla products
- [ ] Frontend: Configuración de punto de reorden en formulario
- [ ] Frontend: Indicadores visuales en lista de productos
- [ ] Frontend: Vista dedicada de productos con stock bajo
- [ ] Frontend: Contador en dashboard
- [ ] Frontend: Alerta en detalles de producto
- [ ] Frontend: Acciones rápidas desde alertas
- [ ] Backend: Query optimizada para detectar stock bajo
- [ ] Backend: API para obtener productos con stock bajo
- [ ] Backend: Actualización de estado de alerta al modificar stock
- [ ] Notificaciones por email (opcional)
- [ ] Panel de configuración de alertas por usuario (opcional)
- [ ] Tabla de historial de alertas (opcional)
- [ ] Pruebas unitarias y de integración
- [ ] Pruebas de performance con grandes datasets
- [ ] Documentación de API

## Dependencias
- US-PROD-001 (Crear Producto) debe estar completo
- US-PROD-002 (Listar Productos) debe estar completo
- US-PROD-004 (Ver Detalles) debe estar completo
- US-PROD-005 (Editar Producto) debe estar completo
- Epic Dashboard debe estar en desarrollo o completo
- Sistema de notificaciones (si se implementa emails)

## Tags
`products`, `inventory`, `alerts`, `notifications`, `high-priority`, `stock-management`
