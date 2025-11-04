# US-PROD-004: Ver Detalles de Producto

## Historia de Usuario
**Como** gerente de almacén,
**quiero** ver toda la información detallada de un producto,
**para** revisar sus características y estado actual.

## Prioridad
**Media**

## Estimación
3 Story Points

## Criterios de Aceptación

### CA-1: Información Básica del Producto
La vista de detalles muestra:
- **Imagen**: Imagen principal del producto en tamaño grande (400x400px)
- **Nombre**: Título destacado del producto
- **SKU**: Código único en formato destacado
- **Descripción**: Texto completo de la descripción
- **Categoría**: Nombre de la categoría con enlace a lista filtrada
- **Estado**: Badge visual (Activo/Inactivo)

### CA-2: Información de Precios
Sección de precios que muestra:
- **Precio de Costo**: Formato moneda con 2 decimales
- **Precio de Venta**: Formato moneda con 2 decimales, destacado
- **Margen de Ganancia**: Porcentaje con código de colores
  - Verde: >30%
  - Amarillo: 15-30%
  - Rojo: <15%
- Cálculo visual: "Ganancia por unidad: $X.XX"

### CA-3: Información de Inventario
Sección de inventario que muestra:
- **Stock Actual**: Cantidad disponible con tamaño de fuente grande
- **Punto de Reorden**: Cantidad de alerta configurada
- **Estado de Stock**: Badge visual
  - Verde: "Stock Normal" (stock > punto de reorden)
  - Naranja: "Stock Bajo" (stock ≤ punto de reorden)
  - Rojo: "Sin Stock" (stock = 0)
- Indicador visual de nivel de stock (barra de progreso)

### CA-4: Alertas y Notificaciones
- Si stock ≤ punto de reorden:
  - Alerta visible en la parte superior: "⚠️ Este producto tiene stock bajo. Considera reabastecer."
  - Color naranja/rojo según severidad
  - Botón: "Crear Pedido de Compra" (enlace rápido)
- Si stock = 0:
  - Alerta crítica: "🚫 Este producto NO tiene stock disponible"
  - Sugerencia de acciones

### CA-5: Metadatos
Sección de información adicional:
- **Fecha de Creación**: Formato legible (DD/MM/YYYY HH:mm)
- **Última Actualización**: Formato relativo ("hace 2 días") y absoluto al hover
- **Creado por**: Nombre del usuario (si disponible)
- **Última modificación por**: Nombre del usuario (si disponible)

### CA-6: Botones de Acción
Barra de acciones con botones:
- **Editar**: Botón primario, redirige a formulario de edición
- **Eliminar**: Botón secundario/peligro, solicita confirmación
- **Ver Historial de Movimientos**: Enlace/botón que abre historial de inventario
- **Crear Pedido**: Botón para crear pedido con este producto
- **Volver**: Enlace para regresar a la lista
- Los botones se muestran según permisos del usuario

### CA-7: Enlaces Relacionados
- **Categoría**: Clickeable, filtra productos de esa categoría
- **Productos Similares**: Sección que muestra 3-5 productos de la misma categoría (opcional)
- **Movimientos Recientes**: Lista de últimos 5 movimientos de inventario

### CA-8: Vista Responsive
- En desktop: Layout de 2 columnas (imagen + info | detalles)
- En tablets: Layout de 1 columna, imagen arriba
- En móviles: Stack vertical, imagen optimizada
- Botones de acción apilados en móvil

### CA-9: Manejo de Imagen No Disponible
- Si no hay imagen: muestra placeholder por defecto
- Placeholder acorde a la categoría del producto
- Mensaje: "Sin imagen disponible"
- Opción de "Agregar imagen" para usuarios con permisos

## Notas Técnicas
- API endpoint: `GET /api/products/{id}`
- Cargar imagen en resolución media (no full size para optimizar)
- Incluir información de relaciones: categoría, usuario creador
- Precalcular margen de ganancia en backend
- Implementar breadcrumbs: Inicio > Productos > {Nombre del Producto}
- SEO: Meta tags dinámicos con nombre y descripción del producto
- Caché de detalles de producto (10 minutos)

## Definición de Hecho
- [x] Frontend: Vista de detalles de producto implementada
- [x] Frontend: Secciones de información básica, precios, inventario
- [x] Frontend: Alertas de stock bajo visibles
- [x] Frontend: Metadatos de creación y actualización
- [x] Frontend: Botones de acción con permisos
- [x] Frontend: Enlaces relacionados funcionales
- [x] Frontend: Vista responsive
- [x] Frontend: Manejo de imagen no disponible
- [x] Backend: API GET /api/products/{id}
- [x] Backend: Incluir información de relaciones
- [x] Breadcrumbs de navegación
- [x] Código de colores para margen de ganancia
- [ ] Pruebas unitarias y de integración (opcional en v1.0)
- [x] Documentación de API (comentarios en código)

## Dependencias
- US-PROD-001 (Crear Producto) debe estar completo
- US-PROD-002 (Listar Productos) debe estar completo
- US-PROD-007 (Categorías) debe estar completo

## Tags
`products`, `details`, `crud`, `read`, `medium-priority`
