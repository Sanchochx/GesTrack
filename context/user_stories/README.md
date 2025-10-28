# GesTrack - Historias de Usuario

## Estructura del Proyecto

Este directorio contiene todas las historias de usuario del proyecto GesTrack, organizadas por **épicas** (features principales) y separadas en archivos individuales para mejor gestión y trazabilidad.

---

## Organización por Épicas

### 📁 Epic 01: Foundation - Autenticación y Configuración Base
**Prioridad:** ALTA | **Estado:** Fundamental
**Carpeta:** `epic_01_foundation/`

Sistema de autenticación, gestión de usuarios y control de acceso basado en roles.

**Historias de Usuario:**
- US-AUTH-001: Registro de Usuario
- US-AUTH-002: Inicio de Sesión
- US-AUTH-003: Cierre de Sesión
- US-AUTH-004: Gestión de Perfil de Usuario
- US-AUTH-005: Control de Acceso por Roles
- US-AUTH-006: Recuperación de Contraseña

**Total:** 6 historias | **Roles:** Admin, Gerente, Personal de Ventas

---

### 📁 Epic 02: Core Data - Gestión de Productos y Categorías
**Prioridad:** ALTA | **Estado:** Core
**Carpeta:** `epic_02_core_data/`

CRUD completo de productos, categorización, búsqueda, imágenes y alertas de stock.

**Historias de Usuario:**
- US-PROD-001: Crear Producto
- US-PROD-002: Listar Productos
- US-PROD-003: Buscar y Filtrar Productos
- US-PROD-004: Ver Detalles de Producto
- US-PROD-005: Editar Producto
- US-PROD-006: Eliminar Producto
- US-PROD-007: Gestionar Categorías de Productos
- US-PROD-008: Alertas de Stock Bajo
- US-PROD-009: Carga de Imagen de Producto
- US-PROD-010: Cálculo de Margen de Ganancia

**Total:** 10 historias | **Roles:** Admin, Gerente de Almacén (full), Personal de Ventas (read-only)

---

### 📁 Epic 03: Stock Management - Gestión de Inventario
**Prioridad:** ALTA | **Estado:** Core
**Carpeta:** `epic_03_stock_management/`

Seguimiento de stock en tiempo real, ajustes manuales, historial de movimientos y alertas.

**Historias de Usuario:**
- US-INV-001: Seguimiento de Stock en Tiempo Real
- US-INV-002: Ajustes Manuales de Inventario
- US-INV-003: Historial de Movimientos de Stock
- US-INV-004: Configuración de Puntos de Reorden
- US-INV-005: Valor Total del Inventario
- US-INV-006: Vista de Inventario por Categoría
- US-INV-007: Alerta de Stock Crítico
- US-INV-008: Reserva de Stock para Pedidos Pendientes
- US-INV-009: Exportar Datos de Inventario
- US-INV-010: Dashboard de Inventario

**Total:** 10 historias | **Roles:** Admin, Gerente de Almacén

---

### 📁 Epic 04: Sales - Gestión de Clientes y Pedidos
**Prioridad:** ALTA | **Estado:** Core
**Carpeta:** `epic_04_sales/`

Módulo completo de ventas: gestión de clientes, creación de pedidos, seguimiento de estados y pagos.

**Historias de Usuario - Clientes:**
- US-CUST-001: Registrar Nuevo Cliente
- US-CUST-002: Listar Clientes
- US-CUST-003: Buscar Clientes
- US-CUST-004: Ver Perfil del Cliente
- US-CUST-005: Editar Información del Cliente
- US-CUST-006: Eliminar Cliente
- US-CUST-007: Historial de Compras del Cliente
- US-CUST-008: Inactivar/Activar Cliente
- US-CUST-009: Notas sobre el Cliente
- US-CUST-010: Crear Cliente desde Pedido
- US-CUST-011: Segmentación de Clientes
- US-CUST-012: Exportar Lista de Clientes

**Historias de Usuario - Pedidos:**
- US-ORD-001: Crear Pedido
- US-ORD-002: Cálculo Automático de Totales
- US-ORD-003: Gestión de Estados del Pedido
- US-ORD-004: Estado de Pago del Pedido
- US-ORD-005: Listar Pedidos
- US-ORD-006: Buscar y Filtrar Pedidos
- US-ORD-007: Ver Detalles del Pedido
- US-ORD-008: Editar Pedido
- US-ORD-009: Cancelar Pedido
- US-ORD-010: Historial de Pedidos por Cliente
- US-ORD-011: Procesamiento de Devoluciones
- US-ORD-012: Imprimir/Exportar Pedido
- US-ORD-013: Validación de Stock al Crear Pedido
- US-ORD-014: Descuentos en Pedidos

**Total:** 26 historias (12 clientes + 14 pedidos) | **Roles:** Admin, Personal de Ventas

---

### 📁 Epic 05: Supply Chain - Gestión de Proveedores y Compras
**Prioridad:** MEDIA | **Estado:** Complementario
**Carpeta:** `epic_05_supply_chain/`

Gestión de proveedores, órdenes de compra, recepción de mercancía y reabastecimiento.

**Historias de Usuario:**
- US-SUPP-001: Registrar Proveedor
- US-SUPP-002: Listar Proveedores
- US-SUPP-003: Ver Perfil del Proveedor
- US-SUPP-004: Editar Proveedor
- US-SUPP-005: Crear Orden de Compra
- US-SUPP-006: Listar Órdenes de Compra
- US-SUPP-007: Gestionar Estados de Orden de Compra
- US-SUPP-008: Recibir Mercancía (Actualizar Inventario)
- US-SUPP-009: Ver Detalles de Orden de Compra
- US-SUPP-010: Editar Orden de Compra
- US-SUPP-011: Cancelar Orden de Compra
- US-SUPP-012: Historial de Órdenes por Proveedor
- US-SUPP-013: Buscar Proveedores y Órdenes
- US-SUPP-014: Productos por Proveedor
- US-SUPP-015: Notificaciones de Reabastecimiento

**Total:** 15 historias | **Roles:** Admin, Gerente de Almacén

---

### 📁 Epic 06: Analytics - Reportes y Análisis de Datos
**Prioridad:** MEDIA-BAJA | **Estado:** Analítica
**Carpeta:** `epic_06_analytics/`

Dashboards, reportes, métricas y analíticas para toma de decisiones.

**Historias de Usuario:**
- US-REP-001: Dashboard Principal
- US-REP-002: Reporte de Ventas Diarias
- US-REP-003: Reporte de Ventas por Período
- US-REP-004: Productos Más Vendidos
- US-REP-005: Análisis de Márgenes de Ganancia
- US-REP-006: Reporte de Inventario Actual
- US-REP-007: Reporte de Movimientos de Inventario
- US-REP-008: Reporte de Productos con Stock Bajo
- US-REP-009: Reporte de Desempeño de Ventas por Vendedor
- US-REP-010: Reporte de Clientes
- US-REP-011: Análisis de Tendencias de Ventas
- US-REP-012: Reporte de Órdenes de Compra a Proveedores
- US-REP-013: Exportación Masiva de Reportes
- US-REP-014: Dashboard Personalizable
- US-REP-015: Reporte de Devoluciones

**Total:** 15 historias | **Roles:** Todos (con diferentes vistas por rol)

---

## Resumen General

| Epic | Historias | Prioridad | Dependencias |
|------|-----------|-----------|--------------|
| Epic 01: Foundation | 6 | ALTA | Ninguna |
| Epic 02: Core Data | 10 | ALTA | Epic 01 |
| Epic 03: Stock Management | 10 | ALTA | Epic 01, 02 |
| Epic 04: Sales | 26 | ALTA | Epic 01, 02, 03 |
| Epic 05: Supply Chain | 15 | MEDIA | Epic 01, 02, 03 |
| Epic 06: Analytics | 15 | MEDIA-BAJA | Todas las anteriores |
| **TOTAL** | **82** | - | - |

---

## Fases de Desarrollo Recomendadas

### 🎯 Fase 1: Fundación (Sprint 1-2)
**Objetivo:** Establecer base funcional del sistema

**Épicas a desarrollar:**
- ✅ Epic 01: Foundation (completa)
- ✅ Epic 02: Core Data (completa)

**Entregables:**
- Sistema de autenticación funcional
- CRUD de productos operativo
- Gestión de categorías
- Alertas básicas de stock

---

### 🎯 Fase 2: Operaciones Core (Sprint 3-5)
**Objetivo:** Implementar funcionalidades principales de negocio

**Épicas a desarrollar:**
- ✅ Epic 03: Stock Management (completa)
- ✅ Epic 04: Sales (completa)

**Entregables:**
- Seguimiento de inventario en tiempo real
- Gestión completa de clientes
- Creación y seguimiento de pedidos
- Control de estados y pagos

---

### 🎯 Fase 3: Cadena de Suministro (Sprint 6-7)
**Objetivo:** Completar ciclo de reabastecimiento

**Épicas a desarrollar:**
- ✅ Epic 05: Supply Chain (completa)

**Entregables:**
- Gestión de proveedores
- Órdenes de compra
- Recepción de mercancía
- Actualización automática de inventario

---

### 🎯 Fase 4: Inteligencia de Negocio (Sprint 8-10)
**Objetivo:** Proporcionar insights y analíticas

**Épicas a desarrollar:**
- ✅ Epic 06: Analytics (completa)

**Entregables:**
- Dashboards por rol
- Reportes de ventas y rendimiento
- Análisis de inventario
- Exportación y automatización

---

## Roles y Permisos

### 👑 Admin
- **Acceso:** Completo a todos los módulos
- **Épicas:** Todas (01-06)
- **Capacidades especiales:** Eliminar registros, gestionar usuarios, acceso a todos los reportes

### 📦 Gerente de Almacén
- **Acceso:** Productos, Inventario, Proveedores, Reportes de Inventario
- **Épicas:** 01, 02, 03, 05, 06 (parcial)
- **Capacidades:** CRUD de productos, ajustes de inventario, órdenes de compra

### 💼 Personal de Ventas
- **Acceso:** Pedidos, Clientes, Productos (lectura), Reportes de Ventas
- **Épicas:** 01, 02 (lectura), 04, 06 (parcial)
- **Capacidades:** Gestión de clientes y pedidos, consulta de productos

---

## Archivos Legacy

Los archivos originales consolidados (01_authentication.md - 07_reports.md) se encuentran en la carpeta `legacy/` como respaldo y referencia histórica.

---

## Convenciones de Nombres

### Archivos de Historias de Usuario
```
US-[PREFIJO]-[NÚMERO]_descripción_breve.md
```

**Prefijos:**
- `AUTH`: Autenticación
- `PROD`: Productos
- `INV`: Inventario
- `CUST`: Clientes
- `ORD`: Pedidos
- `SUPP`: Proveedores
- `REP`: Reportes

**Ejemplo:** `US-PROD-001_crear_producto.md`

---

## Métricas del Proyecto

- **Total de Historias de Usuario:** 82
- **Total de Épicas:** 6
- **Fases de Desarrollo:** 4
- **Roles del Sistema:** 3
- **Estimación Total:** ~150-180 story points
- **Duración Estimada:** 8-10 sprints (4-5 meses)

---

## Próximos Pasos

1. ✅ Validar épicas con stakeholders
2. ✅ Estimar story points por historia
3. ⏳ Planificar sprints por fase
4. ⏳ Asignar recursos al equipo
5. ⏳ Iniciar Fase 1 (Foundation)

---

**Última actualización:** 2025-10-27
**Versión:** 2.0 - Estructura por Épicas
