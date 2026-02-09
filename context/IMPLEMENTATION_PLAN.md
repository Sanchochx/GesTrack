# 🚀 GesTrack - Plan de Implementación

**Última actualización:** 2026-02-04
**Versión:** 1.0

---

## 📊 Dashboard General

```
┌─────────────────────────────────────────────────────────────┐
│  PROGRESO GLOBAL DEL PROYECTO                               │
├─────────────────────────────────────────────────────────────┤
│  Total Historias de Usuario:     82                         │
│  ✅ Completadas:                   27                        │
│  🔄 Parcialmente Completadas:     0                         │
│  ⏳ En Progreso:                   0                         │
│  ⏸️  Pendientes:                   55                        │
│                                                             │
│  Progreso: [███████░░░░░░░░░░░░░] 33% (27/82)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Progreso por Épica

| Epic | Nombre | Total US | Completadas | En Progreso | Pendientes | Progreso |
|------|--------|----------|-------------|-------------|------------|----------|
| 01 | Foundation | 6 | 6 | 0 | 0 | [██████████] 100% |
| 02 | Core Data | 10 | 10 | 0 | 0 | [██████████] 100% |
| 03 | Stock Management | 10 | 7 | 0 | 3 | [███████░░░] 70% |
| 04 | Sales | 26 | 3 | 0 | 23 | [█░░░░░░░░░] 12% |
| 05 | Supply Chain | 15 | 0 | 0 | 15 | [░░░░░░░░░░] 0% |
| 06 | Analytics | 15 | 0 | 0 | 15 | [░░░░░░░░░░] 0% |

---

## 📅 Plan de Implementación por Fases

---

# 🎯 FASE 1: FUNDACIÓN (Sprint 1-2)

**Objetivo:** Establecer base funcional del sistema
**Épicas:** 01 Foundation, 02 Core Data
**Total US:** 16
**Progreso:** [██████████] 100% (16/16 completadas) ✅ COMPLETADA

---

## Epic 01: Foundation - Autenticación y Configuración Base

**Prioridad:** ⭐⭐⭐ ALTA
**Progreso:** [██████████] 100% (6/6) ✅ COMPLETADA
**Carpeta:** `context/user_stories/epic_01_foundation/`

### ✅ Historias de Usuario

#### [x] US-AUTH-001: Registro de Usuario
- **Archivo:** `context/user_stories/epic_01_foundation/US-AUTH-001_user_registration.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ✅ Completada
- **Criterios de Aceptación:** 6 ✅
- **Fecha de completación:** 2025-10-28

#### [x] US-AUTH-002: Inicio de Sesión
- **Archivo:** `context/user_stories/epic_01_foundation/US-AUTH-002_user_login.md`
- **Prioridad:** ALTA
- **Estimación:** 3 pts
- **Estado:** ✅ Completada
- **Criterios de Aceptación:** 6 ✅
- **Fecha de completación:** 2025-10-28

#### [x] US-AUTH-003: Cierre de Sesión
- **Archivo:** `context/user_stories/epic_01_foundation/US-AUTH-003_user_logout.md`
- **Prioridad:** ALTA
- **Estimación:** 2 pts
- **Estado:** ✅ Completada
- **Criterios de Aceptación:** 4 ✅ (1 opcional no implementado)
- **Fecha de completación:** 2025-10-28

#### [x] US-AUTH-004: Gestión de Perfil de Usuario
- **Archivo:** `context/user_stories/epic_01_foundation/US-AUTH-004_profile_management.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ✅ Completada
- **Criterios de Aceptación:** 7 ✅
- **Fecha de completación:** 2025-10-28

#### [x] US-AUTH-005: Control de Acceso por Roles
- **Archivo:** `context/user_stories/epic_01_foundation/US-AUTH-005_role_based_access.md`
- **Prioridad:** ALTA
- **Estimación:** 8 pts
- **Estado:** ✅ Completada
- **Criterios de Aceptación:** 6 ✅ (testing opcional en v1.0)
- **Fecha de completación:** 2025-10-28

#### [x] US-AUTH-006: Recuperación de Contraseña
- **Archivo:** `context/user_stories/epic_01_foundation/US-AUTH-006_password_recovery.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ✅ Completada
- **Criterios de Aceptación:** 9 ✅
- **Progreso Backend:** 100% - API, DB, Email Service funcional
- **Progreso Frontend:** 100% - ForgotPassword, ResetPassword, rutas, navegación
- **Fecha de completación:** 2025-10-28

---

## Epic 02: Core Data - Gestión de Productos y Categorías

**Prioridad:** ⭐⭐⭐ ALTA
**Progreso:** [██████████] 100% (10/10 completadas)
**Carpeta:** `context/user_stories/epic_02_core_data/`

### ✅ Historias de Usuario

#### [x] US-PROD-001: Crear Producto
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-001_create_product.md`
- **Prioridad:** ALTA
- **Estimación:** 8 pts (actualizado de 5 pts por complejidad)
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 8 ✅
- **Progreso Backend:** ✅ 100% - Todos los CA implementados
  - CA-1: Schema con validaciones ✅
  - CA-2: Validación SKU único ✅
  - CA-3: Validación de precios ✅
  - CA-4: Cálculo de margen ✅
  - CA-5: Sistema de imágenes ✅
  - CA-6: InventoryMovement model ✅
  - CA-7 & CA-8: API endpoints + error handling ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - ProductForm component con todas las validaciones ✅
  - ImageUpload component con preview ✅
  - Validación en tiempo real (SKU, precios, imágenes) ✅
  - CreateProduct page con diálogo de confirmación ✅
  - ProductList placeholder page ✅
  - Rutas protegidas por rol ✅
  - productService con todos los métodos API ✅
- **Fecha de completación:** 2025-10-29

#### [x] US-PROD-002: Listar Productos
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-002_listar_productos.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 8 ✅
- **Progreso Frontend:** ✅ 100% - Todos los CA implementados
  - CA-1: Estructura de tabla con 7 columnas ✅
  - CA-2: Paginación completa (20 por defecto, selector 10/20/50/100) ✅
  - CA-3: Indicadores visuales de stock (badges, colores de fila) ✅
  - CA-4: Ordenamiento bidireccional en 5 columnas ✅
  - CA-5: Botón "Nuevo Producto" con navegación ✅
  - CA-6: ProductStats con 4 tarjetas de estadísticas ✅
  - CA-7: Acciones rápidas (Ver, Editar, Eliminar) con confirmación ✅
  - CA-8: Vista responsive con ProductCardView para móviles ✅
- **Progreso Backend:** ✅ 100% - API completa y optimizada
  - GET /api/products con paginación, filtros, ordenamiento ✅
  - Estadísticas calculadas con queries SQL agregadas (optimizado) ✅
  - Respuestas con datos completos de productos y categorías ✅
- **Mejoras Implementadas:**
  - Lazy loading de imágenes (loading="lazy") ✅
  - Vista responsive: cards en móvil (< 960px), tabla en desktop ✅
  - Optimización backend: queries agregadas en lugar de cargar en memoria ✅
  - ProductCardView: grid 1/2/3 columnas con menú dropdown ✅
- **Fecha de completación:** 2025-10-30

#### [x] US-PROD-003: Buscar y Filtrar Productos
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-003_buscar_filtrar_productos.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 9 ✅
- **Progreso Frontend:** ✅ 100% - Todos los CA implementados
  - CA-1 & CA-2: Campo de búsqueda con debounce (300ms) y clear button ✅
  - CA-3: Selector de categorías con product counts "Electrónica (15)" ✅
  - CA-4: Selector de stock status (Todos, Normal, Bajo, Sin Stock) ✅
  - CA-5: Combinación de filtros con paginación reset ✅
  - CA-6: Contador de resultados ("X de Y productos") ✅
  - CA-7: EmptyState component con botón de limpiar filtros ✅
  - CA-8: Active filters chips con remoción individual ✅
  - CA-9: Persistencia de filtros en URL query params ✅
- **Progreso Backend:** ✅ 100% - API mejorada
  - stock_status parameter (normal, low, out) ✅
  - Búsqueda case-insensitive y parcial (ya existente) ✅
  - Product counts en categories endpoint ✅
- **Fecha de completación:** 2025-10-30

#### [x] US-PROD-004: Ver Detalles de Producto
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-004_ver_detalles_producto.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 9 ✅
- **Progreso Backend:** ✅ 100% - API mejorada con info completa
  - GET /api/products/{id} con toda la información ✅
  - Información de categoría, estado de stock, margen de ganancia ✅
  - Últimos 5 movimientos de inventario ✅
  - Productos similares (misma categoría) ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - CA-1: Información básica (imagen, nombre, SKU, descripción, categoría, estado) ✅
  - CA-2: Precios con margen de ganancia y código de colores (verde >30%, amarillo 15-30%, rojo <15%) ✅
  - CA-3: Información de inventario con barra de progreso visual ✅
  - CA-4: Alertas de stock bajo y sin stock con botones de acción ✅
  - CA-5: Metadatos con fechas relativas ("hace 2 días") y absolutas en hover ✅
  - CA-6: Botones de acción (Volver, Ver Historial, Crear Pedido, Editar, Eliminar) ✅
  - CA-7: Enlaces relacionados (categoría clickeable, movimientos recientes, productos similares) ✅
  - CA-8: Vista responsive (desktop 2 columnas, tablet/móvil stack vertical) ✅
  - CA-9: Placeholder con icono "Sin imagen disponible" y botón "Agregar imagen" ✅
  - Breadcrumbs de navegación (Inicio > Productos > {Nombre}) ✅
- **Fecha de completación:** 2025-11-04

#### [x] US-PROD-005: Editar Producto
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-005_editar_producto.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 11 ✅
- **Progreso Backend:** ✅ 100% - API PUT/PATCH completa
  - CA-1: Formulario precargado con datos del producto ✅
  - CA-2: Campo SKU no editable con tooltip ✅
  - CA-3: Validación de campos editables ✅
  - CA-4: Validación de precios con confirmación ✅
  - CA-5: Recálculo automático de margen con comparación ✅
  - CA-6: Actualización de imagen con preview ✅
  - CA-7: Confirmación de cambios importantes (>20%, categoría) ✅
  - CA-8: Registro de auditoría (updated_at automático) ✅
  - CA-9: Mensajes de confirmación y navegación ✅
  - CA-10: Manejo completo de errores ✅
  - CA-11: Botón cancelar con confirmación de cambios ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - ProductForm mejorado con modo edición/creación ✅
  - EditProduct page funcional con carga de datos ✅
  - SKU read-only con estilos y tooltip ✅
  - Validaciones en tiempo real ✅
  - Diálogos de confirmación (precios, cambios significativos, cancelar) ✅
  - Navegación post-actualización ✅
- **Fecha de completación:** 2025-11-04

#### [x] US-PROD-006: Eliminar Producto
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-006_eliminar_producto.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 9 ✅
- **Progreso Backend:** ✅ 100% - Todos los CA implementados
  - CA-1: Restricción por rol Admin ✅
  - CA-3: Validación de pedidos asociados (preparado para futuros modelos) ✅
  - CA-4: Validación de stock existente ✅
  - CA-5: Registro en tabla de auditoría (ProductDeletionAudit) ✅
  - CA-6: Eliminación de imagen del servidor ✅
  - CA-9: Soft delete con campo deleted_at ✅
  - CA-7 & CA-8: Respuestas exitosas y manejo de errores ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - CA-1: Botón eliminar solo para Admin (deshabilitado para otros roles) ✅
  - CA-2: Modal de confirmación con información del producto ✅
  - CA-3: Manejo de error de pedidos asociados (preparado) ✅
  - CA-4: Alerta de stock con checkbox de confirmación ✅
  - CA-5: Campo opcional de razón de eliminación ✅
  - CA-7: Mensaje de éxito y redirección ✅
  - CA-8: Manejo completo de errores ✅
  - DeleteProductDialog component con todas las validaciones ✅
  - Integrado en ProductTable y ProductCardView ✅
- **Fecha de completación:** 2025-11-04

#### [x] US-PROD-007: Gestionar Categorías de Productos
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-007_gestionar_categorias.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 9 ✅ (CA-10 opcional no implementado)
- **Progreso Backend:** ✅ 100% - API completa
  - CA-1 a CA-9: Todos los endpoints implementados ✅
  - Validación de unicidad de nombre ✅
  - Restricción de eliminación con productos ✅
  - Contador de productos por categoría ✅
  - Categoría por defecto protegida ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - categoryService.js con todos los métodos CRUD ✅
  - Categories.jsx página principal con tabla y estadísticas ✅
  - CategoryDialog.jsx para crear/editar con color e icono ✅
  - DeleteCategoryDialog.jsx con validaciones ✅
  - Búsqueda y filtrado de categorías ✅
  - Ruta /categories protegida por rol ✅
  - Navegación en AppBar ✅
- **Fecha de completación:** 2025-10-29

#### [x] US-PROD-008: Alertas de Stock Bajo
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-008_alertas_stock_bajo.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 10 (6 core + 4 opcionales)
- **Progreso Backend:** ✅ 100% - Todos los CA core implementados
  - CA-1: Campo reorder_point en modelo Product y schemas ✅
  - CA-2: Métodos is_low_stock(), is_out_of_stock(), get_stock_status() ✅
  - CA-4: Endpoint GET /api/products/low-stock con paginación ✅
- **Progreso Frontend:** ✅ 95% - Mayoría implementada
  - CA-1: Campo reorder_point en ProductForm con validaciones ✅
  - CA-3: StockBadge actualizado, indicadores visuales en ProductTable y ProductCardView ✅
  - CA-4: Página LowStockProducts con tabla, estadísticas y alertas ✅
  - CA-4: Ruta /products/low-stock y navegación ✅
  - CA-6: Banners de alerta en ProductDetail ✅
  - CA-5: Contador en Dashboard ⏸️ (pendiente)
  - CA-10: Botones de acción presentes (funcionalidad completa en Epic 05) ⏸️
- **Características Opcionales No Implementadas (v1.0):**
  - CA-7: Notificaciones por email
  - CA-8: Configuración de alertas por usuario
  - CA-9: Historial de alertas
- **Fecha de completación:** 2025-11-04

#### [x] US-PROD-009: Carga de Imagen de Producto
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-009_carga_imagen_producto.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ✅ Completada
- **Criterios de Aceptación:** 12 (10 core implementados, 2 opcionales para v2.0)
- **Progreso Backend:** ✅ 100% - API completa
  - CA-1 & CA-2: Validación de formatos (JPG, PNG, WEBP) y tamaño (5MB) ✅
  - CA-5: Optimización automática de imágenes con Pillow ✅
  - CA-6: Nombrado con patrón SKU_timestamp ✅
  - CA-9: Endpoint DELETE /api/products/{id}/image ✅
  - Almacenamiento local en /uploads/products/ ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - CA-3: Componente ImageUpload con drag-and-drop ✅
  - CA-4: Preview con botones cambiar/quitar ✅
  - CA-7: Integrado en crear/editar producto ✅
  - CA-8: Placeholder por defecto generado ✅
  - CA-9: DeleteImageDialog component ✅
  - CA-10: Visualización en tabla, cards y detalles ✅
  - CA-11: ImageZoomModal con zoom in/out ✅
  - CA-12: Manejo robusto de errores ✅
- **Fecha de completación:** 2025-11-04

#### [x] US-PROD-010: Cálculo de Margen de Ganancia
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-010_calculo_margen_ganancia.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 7 obligatorios (todos completados)
  - CA-1: Fórmula de cálculo ✅
  - CA-2: Formato de visualización ✅
  - CA-3: Código de colores ✅
  - CA-4: Cálculo en tiempo real ✅
  - CA-5: Visualización en lista de productos ✅
  - CA-6: Visualización en detalles de producto ✅
  - CA-7: Alertas de margen bajo/negativo ✅
- **Fecha de completación:** 2025-11-08

---

# 🎯 FASE 2: OPERACIONES CORE (Sprint 3-5)

**Objetivo:** Implementar funcionalidades principales de negocio
**Épicas:** 03 Stock Management, 04 Sales
**Total US:** 36
**Progreso:** [███░░░░░░░] 28% (10/36 completadas) 🔄 EN PROGRESO

---

## Epic 03: Stock Management - Gestión de Inventario

**Prioridad:** ⭐⭐⭐ ALTA
**Progreso:** [███████░░░] 70% (7/10 completadas)
**Carpeta:** `context/user_stories/epic_03_stock_management/`

### ✅ Historias de Usuario

#### [x] US-INV-001: Seguimiento de Stock en Tiempo Real
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-001_real_time_stock_tracking.md`
- **Prioridad:** ALTA
- **Estimación:** 8 pts
- **Estado:** ✅ COMPLETADA (parcialmente - CA diferidos hasta Epic 04 y 05)
- **Criterios de Aceptación:** 7 (4 core completados, 2 diferidos, 1 parcialmente completado)
- **Progreso Backend:** ✅ 100% - Infraestructura completa
  - CA-5: StockService con optimistic locking implementado ✅
  - CA-5: Manejo de concurrencia con locks y transacciones ✅
  - CA-4: Timestamps de última actualización con usuario ✅
  - InventoryMovement model completo ✅
  - Soporte para WebSockets preparado ✅
- **Progreso Frontend:** ✅ 80% - Funcionalidad core lista
  - CA-6: ProductList muestra stock en tiempo real ✅
  - CA-4: Timestamps visibles en listados ✅
  - CA-3: Sincronización mediante polling preparada ⏸️
  - Dashboard de inventario (pendiente hasta US-INV-010) ⏸️
- **CA Diferidos:**
  - CA-1: Actualización automática en pedidos (Epic 04) ⏸️
  - CA-2: Actualización en recepciones de proveedor (Epic 05) ⏸️
- **Fecha de completación:** 2025-11-09

#### [x] US-INV-002: Ajustes Manuales de Inventario
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-002_manual_inventory_adjustments.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 7 (todos los core completados)
- **Progreso Backend:** ✅ 100% - API completa
  - CA-1 a CA-7: Todos los criterios implementados ✅
  - POST /api/inventory/adjustments con todas las validaciones ✅
  - GET /api/inventory/adjustment-reasons ✅
  - GET /api/inventory/adjustments/history ✅
  - InventoryAdjustmentService completo con validaciones ✅
  - Integración con StockService para optimistic locking ✅
  - Notificaciones de ajustes significativos (log en consola) ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - CA-1: ManualAdjustmentForm con todos los campos requeridos ✅
  - CA-2: Razones predefinidas cargadas desde API ✅
  - CA-3: Todas las validaciones implementadas ✅
  - CA-4: AdjustmentConfirmDialog con resumen completo ✅
  - CA-5: Registro en historial automático ✅
  - CA-6: Cálculo de valor de inventario e impacto monetario ✅
  - CA-7: Modal de éxito con resumen y opciones post-ajuste ✅
  - ManualAdjustments page funcional ✅
  - Ruta /inventory/adjustments protegida ✅
  - inventoryService.js completo ✅
- **Archivos Creados:**
  - Backend: `app/routes/inventory.py`, `app/services/inventory_adjustment_service.py`, `app/utils/constants.py`
  - Frontend: `pages/Inventory/ManualAdjustments.jsx`, `components/inventory/ManualAdjustmentForm.jsx`, `components/inventory/AdjustmentConfirmDialog.jsx`, `services/inventoryService.js`
- **Fecha de completación:** 2025-11-09

#### [x] US-INV-003: Historial de Movimientos de Stock
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-003_stock_movement_history.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 7 (todos completados)
- **Progreso Backend:** ✅ 100% - API completa
  - CA-1: Vista general con paginación (50 registros/página) ✅
  - CA-2: Indicadores visuales de tipos de movimiento con chips e iconos ✅
  - CA-3: Filtros avanzados (fechas, tipos, producto, usuario, categoría) ✅
  - CA-4: Gráfico de evolución de stock con Recharts (fallback a tabla) ✅
  - CA-5: Modal de detalles completo con toda la información ✅
  - CA-6: Exportación a CSV y Excel con límite de 10,000 registros ✅
  - CA-7: Performance optimizada con índices en BD ✅
  - InventoryMovementService completo con 6 métodos ✅
  - ExportHelper para generación de archivos ✅
  - 7 nuevos endpoints API implementados ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - MovementHistoryTable con paginación y visualización completa ✅
  - MovementFilters con date presets y multiselect ✅
  - MovementHistory página principal con estadísticas ✅
  - MovementDetailsModal con información completa ✅
  - StockEvolutionChart con gráfico/tabla adaptativo ✅
  - MovementTypeChip con 9 tipos configurados ✅
  - Ruta /inventory/history protegida y navegación ✅
  - inventoryService.js extendido con 6 nuevos métodos ✅
- **Archivos Creados:**
  - Backend: `services/inventory_movement_service.py` (320 líneas), `utils/export_helper.py` (210 líneas), migración de índices
  - Frontend: `pages/Inventory/MovementHistory.jsx` (290 líneas), `components/inventory/MovementHistoryTable.jsx` (313 líneas), `components/inventory/MovementFilters.jsx` (263 líneas), `components/inventory/MovementDetailsModal.jsx` (218 líneas), `components/inventory/StockEvolutionChart.jsx` (178 líneas), `components/inventory/MovementTypeChip.jsx` (82 líneas)
- **Fecha de completación:** 2025-11-09

#### [x] US-INV-004: Configuración de Puntos de Reorden
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-004_reorder_point_configuration.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 7 (todos completados)
- **Progreso Backend:** ✅ 100% - Todos los CA implementados
  - CA-1: Campo reorder_point en modelo Product y schemas con validación 0-10,000 ✅
  - CA-4: Configuración masiva por categoría (BulkReorderPointDialog, API endpoints) ✅
  - CA-5: Sugerencias inteligentes basadas en ventas (cálculo con fórmula, API) ✅
  - CA-6: Validaciones de rango 0-10,000 en frontend y backend ✅
  - CA-7: Triggers automáticos para alertas (SQLite y PostgreSQL) ✅
  - InventoryAlert model con estados activo/resuelto ✅
  - ReorderPointService con 5 métodos de negocio ✅
  - 5 nuevos endpoints API implementados ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - CA-1: Campo reorder_point en ProductForm con validación ✅
  - CA-2: Alertas visuales en ProductForm cuando stock ≤ reorder_point ✅
  - CA-3: Columna "Punto de Reorden" con badges REORDEN en ProductTable y ProductCardView ✅
  - CA-4: BulkReorderPointDialog con 3 pasos (Form → Preview → Result) ✅
  - CA-4: Botón "Configuración Masiva" en ProductList (solo Admin y Gerente) ✅
  - CA-5: ReorderSuggestionDialog con cálculos inteligentes y parámetros ajustables ✅
  - CA-5: Botón de sugerencia integrado en ProductForm ✅
  - CA-6: Validaciones visuales en formularios ✅
  - inventoryService.js extendido con 5 nuevos métodos ✅
- **Archivos Creados:**
  - Backend: `models/inventory_alert.py`, `services/reorder_point_service.py`, migración con triggers (SQLite/PostgreSQL)
  - Frontend: `components/inventory/BulkReorderPointDialog.jsx` (450 líneas), `components/inventory/ReorderSuggestionDialog.jsx` (350 líneas)
- **Archivos Modificados:**
  - Backend: `models/__init__.py`, `routes/inventory.py`, `schemas/product_schema.py`
  - Frontend: `components/forms/ProductForm.jsx`, `components/products/ProductTable.jsx`, `components/products/ProductCardView.jsx`, `pages/Products/ProductList.jsx`, `services/inventoryService.js`
- **Líneas de Código:** ~1,600 líneas totales (backend + frontend)
- **Fecha de completación:** 2025-11-13

#### [x] US-INV-005: Valor Total del Inventario
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-005_total_inventory_value.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 7 (todos completados)
- **Progreso Backend:** ✅ 100% - Completado antes del sprint
  - CA-1: InventoryValueService con cálculos optimizados ✅
  - CA-1: API GET /api/inventory/value/total, by-category, evolution ✅
  - CA-4: Tabla InventoryValueHistory con migrations ✅
  - CA-7: Exportación a Excel con export_helper.py ✅
  - 8 endpoints API implementados y funcionales ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - CA-2: InventoryValueWidget con valor total y cambio vs período ✅
  - CA-3: CategoryValueBreakdown con gráfico de pastel y tabla ✅
  - CA-4: ValueEvolutionChart con selector de período ✅
  - CA-5: ValueMetricsPanel con top productos y métricas ✅
  - CA-6: Polling automático cada 5 minutos en todos los widgets ✅
  - CA-6: Page Visibility API para pausar polling en tabs ocultos ✅
  - CA-7: InventoryValueExportCard para exportación de reportes ✅
  - CA-7: Integrado en AdminDashboard y WarehouseDashboard ✅
  - inventoryService.js con método exportValueReport() ✅
- **Archivos Creados:**
  - Frontend: `components/inventory/InventoryValueExportCard.jsx` (195 líneas)
- **Archivos Modificados:**
  - Frontend: `pages/Dashboard/AdminDashboard.jsx`, `pages/Dashboard/WarehouseDashboard.jsx`
  - Frontend: `components/inventory/InventoryValueWidget.jsx`, `components/inventory/ValueEvolutionChart.jsx`, `components/inventory/CategoryValueBreakdown.jsx`, `components/inventory/ValueMetricsPanel.jsx`
- **Notas Implementación:**
  - PDF export no implementado (backend retorna 501) - diferido para v2.0
  - Backend scheduler para snapshots diarios no implementado - polling frontend suficiente para v1.0
  - Formato de exportación: Solo Excel (.xlsx)
  - Intervalo de polling: 5 minutos (300000ms)
- **Fecha de completación:** 2025-01-29

#### [x] US-INV-006: Vista de Inventario por Categoría
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-006_inventory_by_category_view.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 7 ✅
- **Progreso Backend:** ✅ 100% - Todos los CA implementados
  - CA-1, CA-4: GET /api/inventory/by-category con filtros y ordenamiento ✅
  - CA-3: GET /api/inventory/by-category/:id/products ✅
  - CA-6: GET /api/inventory/by-category/metrics ✅
  - CA-7: GET /api/inventory/by-category/:id/export (Excel/CSV) ✅
  - InventoryCategoryService con 3 métodos de negocio ✅
- **Progreso Frontend:** ✅ 100% - Completado
  - CA-1: CategoryInventoryView con listado de categorías ✅
  - CA-2: Expand/collapse con localStorage persistence ✅
  - CA-3: CategoryRow con tabla de productos expandible ✅
  - CA-4: CategoryInventoryFilters con búsqueda, filtros y ordenamiento ✅
  - CA-5: Badges de stock status en cada categoría ✅
  - CA-6: CategoryInventorySummary con métricas totales ✅
  - CA-7: Botones de acciones rápidas (exportar, historial, ajustar) ✅
  - Ruta /inventory/by-category protegida ✅
  - Navegación "Por Categoría" en AppBar ✅
- **Archivos Creados/Modificados:**
  - Backend: `services/inventory_category_service.py`, `routes/inventory.py`
  - Frontend: `pages/Inventory/CategoryInventoryView.jsx`, `components/inventory/CategoryRow.jsx`, `components/inventory/CategoryInventorySummary.jsx`, `components/inventory/CategoryInventoryFilters.jsx`, `services/inventoryService.js`
- **Fecha de completación:** 2026-02-04

#### [x] US-INV-007: Alerta de Stock Crítico
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-007_critical_stock_alerts.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA (CA-5, CA-6, CA-7 parcialmente diferidos)
- **Criterios de Aceptación:** 8 (5 completados, 3 diferidos a Epic 04/05)
- **Progreso Backend:** ✅ 100% - Todos los CA core implementados
  - CA-1: CriticalStockAlertService integrado en StockService ✅
  - CA-8: Resolución automática de alertas ✅
  - API GET /api/inventory/out-of-stock, /count, /statistics, /history ✅
  - API POST /api/inventory/critical-alerts/sync ✅
- **Progreso Frontend:** ✅ 100% - Todos los CA core implementados
  - CA-2: OutOfStockAlertWidget en AdminDashboard y WarehouseDashboard ✅
  - CA-3: StockBadge mejorado con animación pulse ✅
  - CA-4: OutOfStockProducts página dedicada ✅
  - Ruta /inventory/out-of-stock con navegación ✅
  - inventoryService.js extendido con 5 nuevos métodos ✅
- **CA Diferidos:**
  - CA-5: Validación en pedidos (Epic 04)
  - CA-6: Crear orden de compra (Epic 05)
  - CA-7: Email y notificaciones avanzadas (v2.0)
- **Archivos Creados:**
  - Backend: `services/critical_stock_alert_service.py`
  - Frontend: `components/inventory/OutOfStockAlertWidget.jsx`, `pages/Inventory/OutOfStockProducts.jsx`
- **Fecha de completación:** 2026-02-04

#### [ ] US-INV-008: Reserva de Stock para Pedidos Pendientes
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-008_stock_reservation_pending_orders.md`
- **Prioridad:** ALTA
- **Estimación:** 8 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-INV-009: Exportar Datos de Inventario
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-009_export_inventory_data.md`
- **Prioridad:** BAJA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

#### [ ] US-INV-010: Dashboard de Inventario
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-010_inventory_dashboard.md`
- **Prioridad:** MEDIA
- **Estimación:** 8 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

---

## Epic 04: Sales - Gestión de Clientes y Pedidos

**Prioridad:** ⭐⭐⭐ ALTA
**Progreso:** [█░░░░░░░░░] 12% (3/26)
**Carpeta:** `context/user_stories/epic_04_sales/`

### 📋 Módulo: Clientes

#### [x] US-CUST-001: Registrar Nuevo Cliente
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-001_registrar_cliente.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 10 ✅
- **Progreso Backend:** ✅ 100% - Todos los CA implementados
  - Customer model con todos los campos (UUID, validaciones, timestamps) ✅
  - CustomerCreateSchema y CustomerUpdateSchema con Marshmallow ✅
  - POST /api/customers con validación completa ✅
  - GET /api/customers/check-email para unicidad de email ✅
  - GET /api/customers con paginación, búsqueda y filtros ✅
  - GET /api/customers/:id ✅
  - Migración de base de datos con índice único en email ✅
- **Progreso Frontend:** ✅ 100% - Todos los CA implementados
  - CA-1: Formulario organizado en secciones (Personal, Dirección, Notas) ✅
  - CA-2: Campos de información personal con validación ✅
  - CA-3: Campos de dirección completa ✅
  - CA-4: Campo de notas con contador de caracteres ✅
  - CA-5: Validación de email único con API (onBlur, indicador visual) ✅
  - CA-6: Timestamp automático en backend ✅
  - CA-7: Estado activo por defecto ✅
  - CA-8: Validaciones en tiempo real ✅
  - CA-9: Diálogo de éxito con opciones (ver perfil, registrar otro, ir a lista) ✅
  - CA-10: Confirmación de cancelación si hay datos sin guardar ✅
  - Ruta /customers y /customers/new protegidas ✅
  - Navegación "Clientes" en AppBar ✅
- **Fecha de completación:** 2026-02-05

#### [x] US-CUST-002: Listar Clientes
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-002_listar_clientes.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 10 ✅
- **Progreso Backend:** ✅ 100% - API completa
  - GET /api/customers con paginación, búsqueda, filtros ✅
  - Ordenamiento dinámico (5 columnas) ✅
  - Estadísticas agregadas (total, active, inactive, vip) ✅
  - PATCH /api/customers/:id/toggle-active ✅
- **Progreso Frontend:** ✅ 100% - Todos los CA implementados
  - CA-1: CustomerTable con 8 columnas, headers ordenables ✅
  - CA-2: Paginación completa (10/20/50/100) ✅
  - CA-3: Ordenamiento bidireccional con indicadores ✅
  - CA-4: Badges Activo/Inactivo, toggle "Mostrar inactivos" ✅
  - CA-5: Badges de categoría (VIP/Frecuente/Regular) ✅
  - CA-6: Botón "Nuevo Cliente" en header ✅
  - CA-7: CustomerStats con 4 tarjetas ✅
  - CA-8: Acciones rápidas (ver, email, teléfono, menú) ✅
  - CA-9: Fechas relativas con warning >6 meses ✅
  - CA-10: CustomerEmptyState para ambos casos ✅
  - CustomerCardView para vista móvil responsive ✅
- **Fecha de completación:** 2026-02-09

#### [x] US-CUST-003: Buscar Clientes
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-003_buscar_clientes.md`
- **Prioridad:** ALTA
- **Estimación:** 3 pts
- **Estado:** ✅ COMPLETADA
- **Criterios de Aceptación:** 10 ✅ (CA-6 opcional diferido)
- **Progreso Backend:** ✅ 100% - Búsqueda integrada en GET /api/customers
  - Búsqueda en: full_name, email, phone, secondary_phone ✅
  - Case-insensitive con ILIKE ✅
  - Coincidencias parciales con %search% ✅
  - Paginación con límite de resultados ✅
- **Progreso Frontend:** ✅ 100% - Todos los CA implementados
  - CA-1: Campo búsqueda prominente con icono ✅
  - CA-2: Live search con debounce 300ms, spinner ✅
  - CA-3: Búsqueda en 4 campos ✅
  - CA-4: Case-insensitive ✅
  - CA-5: Coincidencias parciales ✅
  - CA-6: Resaltado de coincidencias (diferido v2.0)
  - CA-7: Contador de resultados "X de Y clientes" ✅
  - CA-8: Botón limpiar + tecla Escape ✅
  - CA-9: Empty state con sugerencias y botón registrar ✅
  - CA-10: Performance con paginación ✅
- **Fecha de completación:** 2026-02-09

#### [ ] US-CUST-004: Ver Perfil del Cliente
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-004_ver_perfil_cliente.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

#### [ ] US-CUST-005: Editar Información del Cliente
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-005_editar_cliente.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-CUST-006: Eliminar Cliente
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-006_eliminar_cliente.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

#### [ ] US-CUST-007: Historial de Compras del Cliente
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-007_historial_compras.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-CUST-008: Inactivar/Activar Cliente
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-008_inactivar_cliente.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

#### [ ] US-CUST-009: Notas sobre el Cliente
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-009_notas_cliente.md`
- **Prioridad:** BAJA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

#### [ ] US-CUST-010: Crear Cliente desde Pedido
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-010_crear_desde_pedido.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-CUST-011: Segmentación de Clientes
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-011_segmentacion.md`
- **Prioridad:** BAJA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-CUST-012: Exportar Lista de Clientes
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-012_exportar_clientes.md`
- **Prioridad:** BAJA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

### 📋 Módulo: Pedidos

#### [ ] US-ORD-001: Crear Pedido
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-001_crear_pedido.md`
- **Prioridad:** ALTA
- **Estimación:** 8 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 9

#### [ ] US-ORD-002: Cálculo Automático de Totales
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-002_calculo_totales.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-ORD-003: Gestión de Estados del Pedido
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-003_estados_pedido.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-ORD-004: Estado de Pago del Pedido
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-004_estado_pago.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-ORD-005: Listar Pedidos
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-005_listar_pedidos.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-ORD-006: Buscar y Filtrar Pedidos
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-006_buscar_filtrar_pedidos.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 8

#### [ ] US-ORD-007: Ver Detalles del Pedido
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-007_ver_detalles_pedido.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-ORD-008: Editar Pedido
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-008_editar_pedido.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-ORD-009: Cancelar Pedido
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-009_cancelar_pedido.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-ORD-010: Historial de Pedidos por Cliente
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-010_historial_cliente.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

#### [ ] US-ORD-011: Procesamiento de Devoluciones
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-011_devoluciones.md`
- **Prioridad:** MEDIA
- **Estimación:** 8 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-ORD-012: Imprimir/Exportar Pedido
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-012_imprimir_exportar.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-ORD-013: Validación de Stock al Crear Pedido
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-013_validacion_stock.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-ORD-014: Descuentos en Pedidos
- **Archivo:** `context/user_stories/epic_04_sales/US-ORD-014_descuentos.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

---

# 🎯 FASE 3: CADENA DE SUMINISTRO (Sprint 6-7)

**Objetivo:** Completar ciclo de reabastecimiento
**Épicas:** 05 Supply Chain
**Total US:** 15
**Progreso:** [░░░░░░░░░░] 0% (0/15)

---

## Epic 05: Supply Chain - Gestión de Proveedores y Compras

**Prioridad:** ⭐⭐ MEDIA
**Progreso:** [░░░░░░░░░░] 0% (0/15)
**Carpeta:** `context/user_stories/epic_05_supply_chain/`

### ✅ Historias de Usuario

#### [ ] US-SUPP-001: Registrar Proveedor
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-001_registrar_proveedor.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-SUPP-002: Listar Proveedores
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-002_listar_proveedores.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-SUPP-003: Ver Perfil del Proveedor
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-003_ver_perfil_proveedor.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-SUPP-004: Editar Proveedor
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-004_editar_proveedor.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-SUPP-005: Crear Orden de Compra
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-005_crear_orden_compra.md`
- **Prioridad:** ALTA
- **Estimación:** 8 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 9

#### [ ] US-SUPP-006: Listar Órdenes de Compra
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-006_listar_ordenes_compra.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-SUPP-007: Gestionar Estados de Orden de Compra
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-007_gestionar_estados_orden_compra.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-SUPP-008: Recibir Mercancía (Actualizar Inventario)
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-008_recibir_mercancia.md`
- **Prioridad:** ALTA
- **Estimación:** 8 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 8

#### [ ] US-SUPP-009: Ver Detalles de Orden de Compra
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-009_ver_detalles_orden_compra.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-SUPP-010: Editar Orden de Compra
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-010_editar_orden_compra.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-SUPP-011: Cancelar Orden de Compra
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-011_cancelar_orden_compra.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-SUPP-012: Historial de Órdenes por Proveedor
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-012_historial_ordenes_proveedor.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

#### [ ] US-SUPP-013: Buscar Proveedores y Órdenes
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-013_buscar_proveedores_ordenes.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-SUPP-014: Productos por Proveedor
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-014_productos_por_proveedor.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-SUPP-015: Notificaciones de Reabastecimiento
- **Archivo:** `context/user_stories/epic_05_supply_chain/US-SUPP-015_notificaciones_reabastecimiento.md`
- **Prioridad:** BAJA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

---

# 🎯 FASE 4: INTELIGENCIA DE NEGOCIO (Sprint 8-10)

**Objetivo:** Proporcionar insights y analíticas
**Épicas:** 06 Analytics
**Total US:** 15
**Progreso:** [░░░░░░░░░░] 0% (0/15)

---

## Epic 06: Analytics - Reportes y Análisis de Datos

**Prioridad:** ⭐ MEDIA-BAJA
**Progreso:** [░░░░░░░░░░] 0% (0/15)
**Carpeta:** `context/user_stories/epic_06_analytics/`

### ✅ Historias de Usuario

#### [ ] US-REP-001: Dashboard Principal
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-001_dashboard_principal.md`
- **Prioridad:** ALTA
- **Estimación:** 8 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 8

#### [ ] US-REP-002: Reporte de Ventas Diarias
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-002_reporte_ventas_diarias.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-REP-003: Reporte de Ventas por Período
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-003_reporte_ventas_por_periodo.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-REP-004: Productos Más Vendidos
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-004_productos_mas_vendidos.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-REP-005: Análisis de Márgenes de Ganancia
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-005_analisis_margenes_ganancia.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-REP-006: Reporte de Inventario Actual
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-006_reporte_inventario_actual.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-REP-007: Reporte de Movimientos de Inventario
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-007_reporte_movimientos_inventario.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-REP-008: Reporte de Productos con Stock Bajo
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-008_reporte_productos_stock_bajo.md`
- **Prioridad:** ALTA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

#### [ ] US-REP-009: Reporte de Desempeño de Ventas por Vendedor
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-009_desempeno_ventas_por_vendedor.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-REP-010: Reporte de Clientes
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-010_reporte_clientes.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-REP-011: Análisis de Tendencias de Ventas
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-011_analisis_tendencias_ventas.md`
- **Prioridad:** BAJA
- **Estimación:** 8 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-REP-012: Reporte de Órdenes de Compra a Proveedores
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-012_reporte_ordenes_compra_proveedores.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-REP-013: Exportación Masiva de Reportes
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-013_exportacion_masiva_reportes.md`
- **Prioridad:** BAJA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-REP-014: Dashboard Personalizable
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-014_dashboard_personalizable.md`
- **Prioridad:** BAJA
- **Estimación:** 8 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-REP-015: Reporte de Devoluciones
- **Archivo:** `context/user_stories/epic_06_analytics/US-REP-015_reporte_devoluciones.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

---

## 📝 Notas de Implementación

### Cómo usar este plan:

1. **Seguir el orden de las fases** - Comenzar siempre por la Fase 1
2. **Trabajo incremental** - Completar una US completa antes de avanzar
3. **Marcar progreso:**
   - `[ ]` Historia pendiente
   - `[~]` Historia en progreso (solo UNA a la vez)
   - `[x]` Historia completada
4. **Actualizar métricas** - Al completar cada historia, actualizar el dashboard
5. **Leer archivos de US** - Cada historia tiene criterios de aceptación detallados en su archivo

### Referencias:
- **Historias de usuario:** `context/user_stories/`
- **Roadmap de épicas:** `context/user_stories/EPIC_ROADMAP.md`
- **Workflow de ejecución:** `task_execution.md`
- **Detalles técnicos:** `CLAUDE.md`

---

**Próximo paso:** Comenzar con US-AUTH-001 en Fase 1
