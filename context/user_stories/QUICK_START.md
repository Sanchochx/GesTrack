# 🚀 GesTrack - Guía Rápida de Historias de Usuario

## Navegación Rápida

Este documento te ayudará a encontrar rápidamente las historias de usuario que necesitas.

---

## 📂 Estructura de Carpetas

```
user_stories/
├── README.md                    ← Documentación completa
├── EPIC_ROADMAP.md             ← Roadmap visual del proyecto
├── QUICK_START.md              ← Este archivo
├── legacy/                     ← Archivos originales (respaldo)
├── epic_01_foundation/         ← 6 historias de autenticación
├── epic_02_core_data/          ← 10 historias de productos
├── epic_03_stock_management/   ← 10 historias de inventario
├── epic_04_sales/              ← 26 historias de clientes y pedidos
├── epic_05_supply_chain/       ← 15 historias de proveedores
└── epic_06_analytics/          ← 15 historias de reportes
```

---

## 🎯 Buscar Historias por Tema

### Autenticación y Usuarios
**Carpeta:** `epic_01_foundation/`
- Login/Logout
- Registro de usuarios
- Recuperación de contraseña
- Gestión de perfil
- Control de acceso por roles

### Productos y Catálogo
**Carpeta:** `epic_02_core_data/`
- Crear, editar, eliminar productos
- Búsqueda y filtrado
- Gestión de categorías
- Imágenes de productos
- Márgenes de ganancia

### Inventario y Stock
**Carpeta:** `epic_03_stock_management/`
- Seguimiento de stock en tiempo real
- Ajustes manuales
- Historial de movimientos
- Alertas de stock bajo
- Puntos de reorden

### Clientes
**Carpeta:** `epic_04_sales/` (archivos US-CUST-*)
- Registro de clientes
- Búsqueda y filtrado
- Historial de compras
- Segmentación (VIP, Frecuente, Regular)
- Exportación de datos

### Pedidos y Ventas
**Carpeta:** `epic_04_sales/` (archivos US-ORD-*)
- Creación de pedidos
- Gestión de estados
- Control de pagos
- Devoluciones
- Descuentos

### Proveedores y Compras
**Carpeta:** `epic_05_supply_chain/`
- Gestión de proveedores
- Órdenes de compra
- Recepción de mercancía
- Reabastecimiento automático

### Reportes y Dashboards
**Carpeta:** `epic_06_analytics/`
- Dashboards por rol
- Reportes de ventas
- Análisis de productos
- Reportes de inventario
- Exportación automatizada

---

## 📋 Historias por Prioridad

### 🔴 Prioridad ALTA (Desarrollar primero)

#### Epic 01 - Foundation
- [x] US-AUTH-001: Registro de Usuario
- [x] US-AUTH-002: Inicio de Sesión
- [x] US-AUTH-003: Cierre de Sesión
- [x] US-AUTH-005: Control de Acceso por Roles

#### Epic 02 - Core Data
- [x] US-PROD-001: Crear Producto
- [x] US-PROD-002: Listar Productos
- [x] US-PROD-003: Buscar y Filtrar Productos
- [x] US-PROD-005: Editar Producto
- [x] US-PROD-008: Alertas de Stock Bajo

#### Epic 03 - Stock Management
- [x] US-INV-001: Seguimiento de Stock en Tiempo Real
- [x] US-INV-002: Ajustes Manuales de Inventario
- [x] US-INV-004: Configuración de Puntos de Reorden
- [x] US-INV-007: Alerta de Stock Crítico
- [x] US-INV-008: Reserva de Stock para Pedidos Pendientes

#### Epic 04 - Sales
- [x] US-CUST-001: Registrar Nuevo Cliente
- [x] US-CUST-002: Listar Clientes
- [x] US-CUST-003: Buscar Clientes
- [x] US-CUST-004: Ver Perfil del Cliente
- [x] US-ORD-001: Crear Pedido
- [x] US-ORD-002: Cálculo Automático de Totales
- [x] US-ORD-003: Gestión de Estados del Pedido
- [x] US-ORD-004: Estado de Pago del Pedido
- [x] US-ORD-005: Listar Pedidos
- [x] US-ORD-007: Ver Detalles del Pedido
- [x] US-ORD-013: Validación de Stock al Crear Pedido

#### Epic 05 - Supply Chain
- [x] US-SUPP-001: Registrar Proveedor
- [x] US-SUPP-002: Listar Proveedores
- [x] US-SUPP-005: Crear Orden de Compra
- [x] US-SUPP-006: Listar Órdenes de Compra
- [x] US-SUPP-007: Gestionar Estados de Orden de Compra
- [x] US-SUPP-008: Recibir Mercancía (Actualizar Inventario)

#### Epic 06 - Analytics
- [x] US-REP-001: Dashboard Principal
- [x] US-REP-002: Reporte de Ventas Diarias
- [x] US-REP-003: Reporte de Ventas por Período
- [x] US-REP-006: Reporte de Inventario Actual
- [x] US-REP-008: Reporte de Productos con Stock Bajo

---

## 🔍 Convención de Nombres

Todas las historias siguen este formato:

```
US-[PREFIJO]-[NÚMERO]_descripción_breve.md
```

### Prefijos:
- **AUTH** → Autenticación
- **PROD** → Productos
- **INV** → Inventario
- **CUST** → Clientes
- **ORD** → Pedidos (Orders)
- **SUPP** → Proveedores (Suppliers)
- **REP** → Reportes

### Ejemplos:
- `US-AUTH-001_user_registration.md`
- `US-PROD-005_editar_producto.md`
- `US-ORD-013_validacion_stock.md`

---

## 👥 Historias por Rol

### Admin (Acceso Total)
- Todas las épicas (01-06)
- Todas las historias (82 total)

### Gerente de Almacén
**Épicas con acceso:**
- ✓ Epic 01: Foundation
- ✓ Epic 02: Core Data (completo)
- ✓ Epic 03: Stock Management (completo)
- ✓ Epic 05: Supply Chain (completo)
- ✓ Epic 06: Analytics (reportes de inventario y proveedores)

**Sin acceso:**
- ✗ Epic 04: Sales (pedidos y clientes)

### Personal de Ventas
**Épicas con acceso:**
- ✓ Epic 01: Foundation
- ✓ Epic 02: Core Data (solo lectura)
- ✓ Epic 04: Sales (completo)
- ✓ Epic 06: Analytics (reportes de ventas y clientes)

**Sin acceso:**
- ✗ Epic 03: Stock Management
- ✗ Epic 05: Supply Chain

---

## 📊 Plan de Desarrollo Sugerido

### Sprint 1-2: Fundación
```
Epic 01 + Epic 02
├─ Semana 1-2: Autenticación y usuarios
└─ Semana 3-4: CRUD de productos y categorías
```

### Sprint 3-5: Operaciones Core
```
Epic 03 + Epic 04
├─ Semana 5-6: Gestión de inventario
├─ Semana 7-9: Clientes y pedidos
└─ Semana 10: Integración y pruebas
```

### Sprint 6-7: Proveedores
```
Epic 05
├─ Semana 11-12: Proveedores y órdenes de compra
└─ Semana 13-14: Recepción y reabastecimiento
```

### Sprint 8-10: Analytics
```
Epic 06
├─ Semana 15-16: Dashboards básicos
├─ Semana 17-18: Reportes avanzados
└─ Semana 19-20: Personalización y automatización
```

---

## 🎯 Métricas Rápidas

```
Total de Historias:     82
Total de Épicas:         6
Fases de Desarrollo:     4
Duración Estimada:    4-5 meses
```

### Distribución por Épica:
- Epic 01: 6 historias (7%)
- Epic 02: 10 historias (12%)
- Epic 03: 10 historias (12%)
- Epic 04: 26 historias (32%)
- Epic 05: 15 historias (18%)
- Epic 06: 15 historias (18%)

---

## 📖 Documentos Adicionales

- **README.md** - Documentación completa del proyecto
- **EPIC_ROADMAP.md** - Roadmap visual con detalles de cada épica
- **epic_XX/README.md** - Documentación específica de cada épica

---

## 🔗 Enlaces Útiles

### Archivos por Épica:
- [Epic 01: Foundation](epic_01_foundation/README.md)
- [Epic 02: Core Data](epic_02_core_data/README.md)
- [Epic 03: Stock Management](epic_03_stock_management/README.md)
- [Epic 04: Sales](epic_04_sales/README.md)
- [Epic 05: Supply Chain](epic_05_supply_chain/README.md)
- [Epic 06: Analytics](epic_06_analytics/README.md)

---

## ✅ Checklist Rápido para Desarrolladores

Antes de comenzar cada historia:

- [ ] ¿Leí los criterios de aceptación?
- [ ] ¿Entiendo los roles con acceso?
- [ ] ¿Revisé las dependencias de la épica?
- [ ] ¿Tengo el modelo de datos necesario?
- [ ] ¿Sé qué validaciones implementar?

---

**Última actualización:** 2025-10-27
**Para más información:** Ver README.md o EPIC_ROADMAP.md
