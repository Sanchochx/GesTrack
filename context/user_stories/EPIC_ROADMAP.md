# 🗺️ GesTrack - Roadmap de Épicas

## Visión General del Proyecto

**GesTrack** es un sistema de gestión de inventario y ventas diseñado para pequeñas y medianas empresas. El proyecto está dividido en **6 épicas principales** que se desarrollarán en **4 fases** a lo largo de aproximadamente **4-5 meses**.

---

## 📊 Métricas Globales

```
┌─────────────────────────────────────────────────────────┐
│  Total Historias de Usuario:  82                       │
│  Total Épicas:                  6                       │
│  Fases de Desarrollo:           4                       │
│  Sprints Estimados:          8-10                       │
│  Duración Estimada:          4-5 meses                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Épicas del Proyecto

### Epic 01: Foundation 🔐
```
┌─────────────────────────────────────────────────┐
│ Epic 01: FOUNDATION                             │
│ Autenticación y Configuración Base              │
├─────────────────────────────────────────────────┤
│ Historias:    6                                 │
│ Prioridad:    ⭐⭐⭐ ALTA                        │
│ Complejidad:  Media                             │
│ Dependencias: Ninguna                           │
│ Fase:         Fase 1 (Sprint 1-2)               │
├─────────────────────────────────────────────────┤
│ Roles:                                          │
│  • Admin                                        │
│  • Gerente de Almacén                           │
│  • Personal de Ventas                           │
├─────────────────────────────────────────────────┤
│ Características Principales:                    │
│  ✓ Registro e inicio de sesión                  │
│  ✓ Control de acceso por roles                 │
│  ✓ Gestión de perfiles                          │
│  ✓ Recuperación de contraseña                   │
├─────────────────────────────────────────────────┤
│ Stack Técnico:                                  │
│  • Flask + PostgreSQL                           │
│  • JWT tokens                                   │
│  • Bcrypt                                       │
└─────────────────────────────────────────────────┘
```

---

### Epic 02: Core Data 📦
```
┌─────────────────────────────────────────────────┐
│ Epic 02: CORE DATA                              │
│ Gestión de Productos y Categorías               │
├─────────────────────────────────────────────────┤
│ Historias:    10                                │
│ Prioridad:    ⭐⭐⭐ ALTA                        │
│ Complejidad:  Media-Alta                        │
│ Dependencias: Epic 01                           │
│ Fase:         Fase 1 (Sprint 1-2)               │
├─────────────────────────────────────────────────┤
│ Roles con Acceso:                               │
│  • Admin (full)                                 │
│  • Gerente de Almacén (full)                    │
│  • Personal de Ventas (read-only)               │
├─────────────────────────────────────────────────┤
│ Características Principales:                    │
│  ✓ CRUD completo de productos                   │
│  ✓ Sistema de categorías                        │
│  ✓ Búsqueda y filtrado avanzado                 │
│  ✓ Gestión de imágenes                          │
│  ✓ Alertas de stock bajo                        │
│  ✓ Cálculo de márgenes                          │
├─────────────────────────────────────────────────┤
│ Modelo Principal:                               │
│  Product: id, sku, name, description,           │
│           cost_price, sale_price, stock         │
│  Category: id, name, description                │
└─────────────────────────────────────────────────┘
```

---

### Epic 03: Stock Management 📊
```
┌─────────────────────────────────────────────────┐
│ Epic 03: STOCK MANAGEMENT                       │
│ Gestión de Inventario                           │
├─────────────────────────────────────────────────┤
│ Historias:    10                                │
│ Prioridad:    ⭐⭐⭐ ALTA                        │
│ Complejidad:  Alta                              │
│ Dependencias: Epic 01, 02                       │
│ Fase:         Fase 2 (Sprint 3-5)               │
├─────────────────────────────────────────────────┤
│ Roles con Acceso:                               │
│  • Admin                                        │
│  • Gerente de Almacén                           │
├─────────────────────────────────────────────────┤
│ Características Principales:                    │
│  ✓ Seguimiento en tiempo real                   │
│  ✓ Ajustes manuales de inventario               │
│  ✓ Historial de movimientos                     │
│  ✓ Puntos de reorden configurables              │
│  ✓ Alertas de stock crítico                     │
│  ✓ Reserva automática de stock                  │
│  ✓ Dashboard de inventario                      │
│  ✓ Exportación de datos                         │
├─────────────────────────────────────────────────┤
│ Modelo Principal:                               │
│  StockMovement: id, product_id, type,           │
│                 quantity, user_id, reason       │
└─────────────────────────────────────────────────┘
```

---

### Epic 04: Sales 💰
```
┌─────────────────────────────────────────────────┐
│ Epic 04: SALES                                  │
│ Gestión de Clientes y Pedidos                   │
├─────────────────────────────────────────────────┤
│ Historias:    26 (12 clientes + 14 pedidos)     │
│ Prioridad:    ⭐⭐⭐ ALTA                        │
│ Complejidad:  Alta                              │
│ Dependencias: Epic 01, 02, 03                   │
│ Fase:         Fase 2 (Sprint 3-5)               │
├─────────────────────────────────────────────────┤
│ Roles con Acceso:                               │
│  • Admin                                        │
│  • Personal de Ventas                           │
├─────────────────────────────────────────────────┤
│ Características - Clientes:                     │
│  ✓ CRUD completo de clientes                    │
│  ✓ Búsqueda y filtrado                          │
│  ✓ Historial de compras                         │
│  ✓ Segmentación (VIP, Frecuente, Regular)      │
│  ✓ Notas y seguimiento                          │
│  ✓ Exportación de datos                         │
├─────────────────────────────────────────────────┤
│ Características - Pedidos:                      │
│  ✓ Creación de pedidos multi-producto           │
│  ✓ Cálculo automático de totales                │
│  ✓ Gestión de estados del pedido                │
│  ✓ Control de pagos (parcial/completo)          │
│  ✓ Validación de stock en tiempo real           │
│  ✓ Procesamiento de devoluciones                │
│  ✓ Aplicación de descuentos                     │
│  ✓ Impresión y exportación                      │
├─────────────────────────────────────────────────┤
│ Modelo Principal:                               │
│  Customer: id, name, email, phone, address      │
│  Order: id, customer_id, date, status,          │
│         payment_status, total                   │
│  OrderItem: id, order_id, product_id,           │
│             quantity, unit_price                │
└─────────────────────────────────────────────────┘
```

---

### Epic 05: Supply Chain 🚚
```
┌─────────────────────────────────────────────────┐
│ Epic 05: SUPPLY CHAIN                           │
│ Gestión de Proveedores y Compras                │
├─────────────────────────────────────────────────┤
│ Historias:    15                                │
│ Prioridad:    ⭐⭐ MEDIA                         │
│ Complejidad:  Media-Alta                        │
│ Dependencias: Epic 01, 02, 03                   │
│ Fase:         Fase 3 (Sprint 6-7)               │
├─────────────────────────────────────────────────┤
│ Roles con Acceso:                               │
│  • Admin                                        │
│  • Gerente de Almacén                           │
├─────────────────────────────────────────────────┤
│ Características Principales:                    │
│  ✓ CRUD de proveedores                          │
│  ✓ Creación de órdenes de compra                │
│  ✓ Gestión de estados de órdenes                │
│  ✓ Recepción de mercancía                       │
│  ✓ Actualización automática de inventario       │
│  ✓ Vinculación productos-proveedores            │
│  ✓ Historial de compras                         │
│  ✓ Sugerencias de reabastecimiento              │
├─────────────────────────────────────────────────┤
│ Flujo Principal:                                │
│  1. Identificar productos con stock bajo        │
│  2. Crear orden de compra a proveedor           │
│  3. Confirmar y seguir orden                    │
│  4. Recibir mercancía                           │
│  5. Actualizar inventario automáticamente       │
├─────────────────────────────────────────────────┤
│ Modelo Principal:                               │
│  Supplier: id, company_name, contact,           │
│            email, phone, address                │
│  PurchaseOrder: id, supplier_id, date,          │
│                 status, total                   │
└─────────────────────────────────────────────────┘
```

---

### Epic 06: Analytics 📈
```
┌─────────────────────────────────────────────────┐
│ Epic 06: ANALYTICS                              │
│ Reportes y Análisis de Datos                    │
├─────────────────────────────────────────────────┤
│ Historias:    15                                │
│ Prioridad:    ⭐ MEDIA-BAJA                     │
│ Complejidad:  Media                             │
│ Dependencias: Todas las anteriores              │
│ Fase:         Fase 4 (Sprint 8-10)              │
├─────────────────────────────────────────────────┤
│ Roles con Acceso:                               │
│  • Admin (todos los reportes)                   │
│  • Gerente de Almacén (inventario/proveedores)  │
│  • Personal de Ventas (ventas/clientes)         │
├─────────────────────────────────────────────────┤
│ Características Principales:                    │
│  ✓ Dashboards personalizados por rol            │
│  ✓ Reportes de ventas (diarias/período)         │
│  ✓ Análisis de productos más vendidos           │
│  ✓ Márgenes de ganancia                         │
│  ✓ Reportes de inventario                       │
│  ✓ Análisis de clientes                         │
│  ✓ Desempeño de vendedores                      │
│  ✓ Tendencias y proyecciones                    │
│  ✓ Exportación automatizada                     │
│  ✓ Widgets configurables                        │
├─────────────────────────────────────────────────┤
│ Stack Técnico:                                  │
│  • Chart.js / D3.js                             │
│  • pandas + openpyxl                            │
│  • Redis (caché)                                │
│  • APScheduler                                  │
└─────────────────────────────────────────────────┘
```

---

## 🗓️ Roadmap por Fases

```
FASE 1: FUNDACIÓN                    [Sprint 1-2]  ████████░░░░░░░░░░  40%
┌──────────────────────────────────────────────────────────────┐
│ Epic 01: Foundation      [6 US]   ████████                   │
│ Epic 02: Core Data      [10 US]   ████████████               │
├──────────────────────────────────────────────────────────────┤
│ Objetivo: Sistema base funcional con productos              │
│ Entregable: Autenticación + CRUD de productos               │
└──────────────────────────────────────────────────────────────┘

FASE 2: OPERACIONES CORE            [Sprint 3-5]  ████████████████░░  80%
┌──────────────────────────────────────────────────────────────┐
│ Epic 03: Stock Management [10 US] ████████████               │
│ Epic 04: Sales           [26 US]  ████████████████████████   │
├──────────────────────────────────────────────────────────────┤
│ Objetivo: Funcionalidades principales de negocio            │
│ Entregable: Inventario + Ventas completo                    │
└──────────────────────────────────────────────────────────────┘

FASE 3: CADENA DE SUMINISTRO        [Sprint 6-7]  ████████████░░░░░░  60%
┌──────────────────────────────────────────────────────────────┐
│ Epic 05: Supply Chain    [15 US]  ████████████████           │
├──────────────────────────────────────────────────────────────┤
│ Objetivo: Completar ciclo de reabastecimiento               │
│ Entregable: Proveedores + Órdenes de compra                 │
└──────────────────────────────────────────────────────────────┘

FASE 4: INTELIGENCIA DE NEGOCIO     [Sprint 8-10] ████████████░░░░░░  60%
┌──────────────────────────────────────────────────────────────┐
│ Epic 06: Analytics       [15 US]  ████████████████           │
├──────────────────────────────────────────────────────────────┤
│ Objetivo: Dashboards y reportes para decisiones             │
│ Entregable: Reportes + Dashboards + Exportación             │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎭 Matriz de Acceso por Rol

```
┌─────────────────────┬────────┬─────────────┬──────────────────┐
│ Epic                │ Admin  │ Gerente Alm │ Personal Ventas  │
├─────────────────────┼────────┼─────────────┼──────────────────┤
│ 01: Foundation      │   ✓    │      ✓      │        ✓         │
│ 02: Core Data       │   ✓    │      ✓      │    ✓ (read)      │
│ 03: Stock Mgmt      │   ✓    │      ✓      │        ✗         │
│ 04: Sales           │   ✓    │      ✗      │        ✓         │
│ 05: Supply Chain    │   ✓    │      ✓      │        ✗         │
│ 06: Analytics       │   ✓    │ ✓ (parcial) │   ✓ (parcial)    │
└─────────────────────┴────────┴─────────────┴──────────────────┘

✓ = Acceso completo  |  ✓ (read) = Solo lectura  |  ✗ = Sin acceso
```

---

## 📈 Distribución de Historias de Usuario

```
Epic 01: Foundation          [■■■ 6]    7%
Epic 02: Core Data           [■■■■■ 10]   12%
Epic 03: Stock Management    [■■■■■ 10]   12%
Epic 04: Sales               [■■■■■■■■■■■■■■ 26]  32%
Epic 05: Supply Chain        [■■■■■■■■ 15]  18%
Epic 06: Analytics           [■■■■■■■■ 15]  18%
                             ──────────────
                             Total: 82 US
```

---

## 🔄 Dependencias entre Épicas

```
                    Epic 01: Foundation
                           │
                           ▼
                    Epic 02: Core Data
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
    Epic 03: Stock Mgmt      Epic 05: Supply Chain
              │                         │
              └────────────┬────────────┘
                           ▼
                    Epic 04: Sales
                           │
                           ▼
                    Epic 06: Analytics
```

---

## ✅ Criterios de Aceptación Globales

### Fase 1 Completa cuando:
- ✓ Usuarios pueden autenticarse y gestionar perfiles
- ✓ CRUD de productos funcional
- ✓ Categorías operativas
- ✓ Alertas de stock básicas implementadas

### Fase 2 Completa cuando:
- ✓ Inventario en tiempo real operativo
- ✓ Clientes gestionables
- ✓ Pedidos creables y rastreables
- ✓ Stock se actualiza automáticamente con ventas

### Fase 3 Completa cuando:
- ✓ Proveedores gestionables
- ✓ Órdenes de compra creables
- ✓ Recepción de mercancía actualiza inventario
- ✓ Sugerencias de reabastecimiento funcionales

### Fase 4 Completa cuando:
- ✓ Dashboards por rol operativos
- ✓ Reportes generan datos precisos
- ✓ Exportación a Excel/PDF funcional
- ✓ Reportes programados enviándose

---

## 📦 Entregables por Fase

| Fase | Sprint | Épicas | Entregables | Story Points |
|------|--------|--------|-------------|--------------|
| 1    | 1-2    | 01, 02 | Auth + Productos | ~35 pts |
| 2    | 3-5    | 03, 04 | Inventario + Ventas | ~60 pts |
| 3    | 6-7    | 05     | Proveedores + Compras | ~34 pts |
| 4    | 8-10   | 06     | Reportes + Analytics | ~38 pts |

**Total:** 167 story points estimados

---

## 🚀 Estado Actual del Proyecto

```
[✓] Historias de usuario definidas (82)
[✓] Épicas organizadas (6)
[✓] Fases planificadas (4)
[✓] Dependencias mapeadas
[✓] Roles y permisos definidos
[⏳] Estimación de story points
[⏳] Asignación de equipo
[⏳] Configuración de entorno de desarrollo
[⏳] Inicio de Sprint 1
```

---

**Documento creado:** 2025-10-27
**Versión:** 1.0
**Próxima revisión:** Al finalizar Fase 1
