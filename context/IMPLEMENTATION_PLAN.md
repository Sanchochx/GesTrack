# 🚀 GesTrack - Plan de Implementación

**Última actualización:** 2025-10-28
**Versión:** 1.0

---

## 📊 Dashboard General

```
┌─────────────────────────────────────────────────────────────┐
│  PROGRESO GLOBAL DEL PROYECTO                               │
├─────────────────────────────────────────────────────────────┤
│  Total Historias de Usuario:     82                         │
│  ✅ Completadas:                   15                        │
│  ⏳ En Progreso:                   0                         │
│  ⏸️  Pendientes:                   67                        │
│                                                             │
│  Progreso: [███░░░░░░░░░░░░░░░░░] 18.3% (15/82)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Progreso por Épica

| Epic | Nombre | Total US | Completadas | En Progreso | Pendientes | Progreso |
|------|--------|----------|-------------|-------------|------------|----------|
| 01 | Foundation | 6 | 6 | 0 | 0 | [██████████] 100% |
| 02 | Core Data | 10 | 9 | 0 | 1 | [█████████░] 90% |
| 03 | Stock Management | 10 | 0 | 0 | 10 | [░░░░░░░░░░] 0% |
| 04 | Sales | 26 | 0 | 0 | 26 | [░░░░░░░░░░] 0% |
| 05 | Supply Chain | 15 | 0 | 0 | 15 | [░░░░░░░░░░] 0% |
| 06 | Analytics | 15 | 0 | 0 | 15 | [░░░░░░░░░░] 0% |

---

## 📅 Plan de Implementación por Fases

---

# 🎯 FASE 1: FUNDACIÓN (Sprint 1-2)

**Objetivo:** Establecer base funcional del sistema
**Épicas:** 01 Foundation, 02 Core Data
**Total US:** 16
**Progreso:** [█████████░] 94% (15/16 completadas)

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
**Progreso:** [█████████░] 90% (9/10 completadas)
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

#### [ ] US-PROD-010: Cálculo de Margen de Ganancia
- **Archivo:** `context/user_stories/epic_02_core_data/US-PROD-010_calculo_margen_ganancia.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

---

# 🎯 FASE 2: OPERACIONES CORE (Sprint 3-5)

**Objetivo:** Implementar funcionalidades principales de negocio
**Épicas:** 03 Stock Management, 04 Sales
**Total US:** 36
**Progreso:** [░░░░░░░░░░] 0% (0/36)

---

## Epic 03: Stock Management - Gestión de Inventario

**Prioridad:** ⭐⭐⭐ ALTA
**Progreso:** [░░░░░░░░░░] 0% (0/10)
**Carpeta:** `context/user_stories/epic_03_stock_management/`

### ✅ Historias de Usuario

#### [ ] US-INV-001: Seguimiento de Stock en Tiempo Real
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-001_real_time_stock_tracking.md`
- **Prioridad:** ALTA
- **Estimación:** 8 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-INV-002: Ajustes Manuales de Inventario
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-002_manual_inventory_adjustments.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-INV-003: Historial de Movimientos de Stock
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-003_stock_movement_history.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-INV-004: Configuración de Puntos de Reorden
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-004_reorder_point_configuration.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-INV-005: Valor Total del Inventario
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-005_total_inventory_value.md`
- **Prioridad:** MEDIA
- **Estimación:** 3 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

#### [ ] US-INV-006: Vista de Inventario por Categoría
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-006_inventory_by_category_view.md`
- **Prioridad:** MEDIA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 5

#### [ ] US-INV-007: Alerta de Stock Crítico
- **Archivo:** `context/user_stories/epic_03_stock_management/US-INV-007_critical_stock_alerts.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

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
**Progreso:** [░░░░░░░░░░] 0% (0/26)
**Carpeta:** `context/user_stories/epic_04_sales/`

### 📋 Módulo: Clientes

#### [ ] US-CUST-001: Registrar Nuevo Cliente
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-001_registrar_cliente.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 7

#### [ ] US-CUST-002: Listar Clientes
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-002_listar_clientes.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

#### [ ] US-CUST-003: Buscar Clientes
- **Archivo:** `context/user_stories/epic_04_sales/US-CUST-003_buscar_clientes.md`
- **Prioridad:** ALTA
- **Estimación:** 5 pts
- **Estado:** ⏸️ Pendiente
- **Criterios de Aceptación:** 6

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
