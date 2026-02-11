# GesTrack - Technical Overview para Entrevista Técnica

**Proyecto:** Sistema de Gestión de Inventario y Pedidos
**Stack:** Flask (Python) + React 19 + PostgreSQL
**Última actualización:** 2026-02-10

---

## Tabla de Contenidos

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Autenticación y Seguridad](#2-autenticación-y-seguridad)
3. [CRUD de Productos](#3-crud-de-productos)
4. [Gestión de Inventario](#4-gestión-de-inventario)
5. [Gestión de Clientes](#5-gestión-de-clientes)
6. [Conexión Frontend-Backend](#6-conexión-frontend-backend)
7. [Base de Datos y ORM](#7-base-de-datos-y-orm)
8. [Actualizaciones en Tiempo Real (WebSockets)](#8-actualizaciones-en-tiempo-real-websockets)
9. [Control de Acceso Basado en Roles (RBAC)](#9-control-de-acceso-basado-en-roles-rbac)
10. [Valor de Inventario y Reportes](#10-valor-de-inventario-y-reportes)

---

## 1. Visión General del Proyecto

### Qué hace

GesTrack es un sistema ERP (Enterprise Resource Planning) básico que permite a negocios gestionar su inventario de productos, administrar clientes, procesar ajustes de stock y generar reportes de valor de inventario. Tiene tres roles de usuario (Admin, Gerente de Almacén, Personal de Ventas) con permisos diferenciados.

### Cómo funciona técnicamente

La arquitectura es un monolito desacoplado: un backend API REST en Flask que sirve datos JSON, y un frontend SPA en React que consume esa API. La comunicación es stateless mediante JWT, con una capa adicional de WebSockets (Socket.IO) para actualizaciones de stock en tiempo real.

**Archivos clave de entrada:**
- `backend/run.py` — Entry point del servidor Flask + SocketIO
- `backend/app/__init__.py` — Factory pattern para crear la app Flask, registrar blueprints y error handlers
- `frontend/src/App.jsx` — Routing principal, theme MUI, guardias de ruta
- `frontend/src/services/api.js` — Configuración de Axios con interceptores

### Tecnologías y patrones usados

| Tecnología | Por qué la elegí |
|---|---|
| **Flask** | Framework ligero que me da control total sobre la arquitectura sin imponer convenciones rígidas. Para un ERP básico no necesito la complejidad de Django. |
| **React 19 + Vite** | SPA con renderizado rápido. Vite da HMR instantáneo en desarrollo. React por su ecosistema maduro de componentes (MUI). |
| **PostgreSQL** | Necesito transacciones ACID para operaciones de inventario donde la integridad es crítica. SQLite no soportaría concurrencia. |
| **SQLAlchemy** | ORM que me permite escribir queries complejas en Python sin SQL raw, con protección automática contra SQL injection. |
| **Material-UI (MUI v7)** | Librería de componentes madura con sistema de theming. Me ahorra tiempo en UI sin sacrificar personalización. |
| **Factory Pattern** | `create_app()` en `__init__.py` permite crear instancias configurables de la app, útil para testing con configuración diferente. |

### Preguntas típicas de entrevista

**P: ¿Por qué elegiste Flask en lugar de Django o FastAPI?**
> R: Elegí Flask porque me da control granular sobre la arquitectura. Django viene con muchas cosas que no necesito (admin panel, templates, forms) y su ORM es más opinado. FastAPI hubiera sido buena opción por el tipado y async, pero Flask tiene un ecosistema más maduro de extensiones (Flask-JWT-Extended, Flask-Migrate) y la naturaleza de este proyecto no requiere async — las operaciones son CRUD sincrónicas contra PostgreSQL.

**P: ¿Cómo organizaste el proyecto y por qué?**
> R: Uso una estructura modular por capas: `models/` para la capa de datos, `routes/` para los endpoints (blueprints de Flask), `services/` para la lógica de negocio, y `schemas/` para validación con Marshmallow. Esta separación sigue el principio de Single Responsibility: los routes solo manejan HTTP, los services contienen la lógica, y los models definen la estructura de datos. En el frontend sigo un patrón similar: `pages/` para contenedores, `components/` para UI reutilizable, y `services/` para llamadas API.

**P: ¿Cómo manejas la configuración por entorno?**
> R: Uso `python-dotenv` para cargar variables de un archivo `.env` que nunca se commitea. La clase `Config` en `backend/app/config.py` lee estas variables con valores por defecto seguros. Esto me permite tener configuraciones diferentes para desarrollo (MailHog en puerto 1025, CORS abierto) y producción (SMTP real, CORS restrictivo) sin cambiar código.

### Posibles mejoras

- Migrar a FastAPI para aprovechar async/await y tipado automático con Pydantic
- Containerizar con Docker + docker-compose para estandarizar el entorno de desarrollo
- Implementar CI/CD con GitHub Actions para correr tests y deploy automático
- Agregar API documentation automática con Swagger/OpenAPI

---

## 2. Autenticación y Seguridad

### Qué hace

El sistema permite registro de usuarios, login con protección contra fuerza bruta, manejo de sesiones JWT, recuperación de contraseña por email, y control de acceso por roles. Cada usuario tiene un rol que determina qué puede ver y hacer.

### Cómo funciona técnicamente

#### Flujo de Registro
```
Usuario llena formulario → POST /api/auth/register → Validación Marshmallow
→ Hash bcrypt (12 rounds) → INSERT en tabla users → Generar JWT con role en claims
→ Retornar token → Frontend guarda en localStorage → Redirect a dashboard
```

**Archivos involucrados:**
- `backend/app/routes/auth.py` — Endpoint `/register`
- `backend/app/services/auth_service.py` — Lógica de registro, generación JWT
- `backend/app/schemas/user_schema.py` — Validación de datos de entrada
- `backend/app/utils/validators.py` — Validación de fortaleza de contraseña
- `backend/app/models/user.py` — Modelo con `set_password()` y `check_password()`
- `frontend/src/pages/Auth/UserRegistrationForm.jsx` — Formulario de registro
- `frontend/src/services/authService.js` — `register()` method
- `frontend/src/components/common/PasswordStrengthIndicator.jsx` — Indicador visual

#### Flujo de Login con Protección Anti Fuerza Bruta
```
Usuario envía credenciales → POST /api/auth/login
→ Verificar lockout (5 intentos fallidos en 15 min = bloqueo)
→ Buscar usuario por email normalizado → Verificar bcrypt hash
→ Si falla: registrar intento fallido en login_attempts
→ Si éxito: limpiar intentos fallidos → Generar JWT (24h o 30 días con remember-me)
→ Incluir role en JWT claims → Retornar token + user data
```

**Archivos involucrados:**
- `backend/app/models/login_attempt.py` — Tracking de intentos con `is_account_locked()`, `get_failed_attempts_count()`
- `backend/app/services/auth_service.py` — `login()` con lógica de lockout
- `frontend/src/pages/Auth/LoginForm.jsx` — Formulario con checkbox "recordarme"

#### Flujo de Recuperación de Contraseña
```
Usuario solicita reset → POST /api/auth/forgot-password
→ Generar token con secrets.token_urlsafe(32) → Hash SHA256 del token
→ Guardar hash en password_reset_tokens → Enviar token plano por email
→ Usuario hace click en link → POST /api/auth/reset-password con token
→ Buscar hash SHA256 del token → Verificar no expirado (1 hora) y no usado
→ Actualizar password → Marcar token como usado → Invalidar otros tokens del usuario
```

**Archivos involucrados:**
- `backend/app/models/password_reset_token.py` — Modelo con `generate_token()`, `hash_token()`, `is_valid()`, `find_by_token()`
- `backend/app/services/email_service.py` — Envío SMTP con template HTML + plaintext
- `frontend/src/pages/Auth/ForgotPasswordPage.jsx` — Formulario de solicitud
- `frontend/src/pages/Auth/ResetPasswordPage.jsx` — Formulario de nuevo password

### Tecnologías y patrones usados

| Tecnología/Patrón | Por qué |
|---|---|
| **bcrypt (12 rounds)** | Algoritmo de hashing adaptativo diseñado para passwords. Los 12 rounds hacen que cada hash tome ~250ms, haciendo ataques de diccionario imprácticos. No uso SHA256 para passwords porque es demasiado rápido. |
| **JWT con claims de rol** | Incluyo el rol directamente en el token para evitar consultas a BD en cada request. El trade-off es que si cambio el rol de un usuario, no se refleja hasta que el token expire. Para este sistema es aceptable. |
| **SHA256 para tokens de reset** | Almaceno el hash del token, no el token plano. Si la BD se compromete, el atacante no puede usar los tokens. El token plano solo viaja por email. |
| **secrets.token_urlsafe(32)** | Genera 32 bytes de entropía criptográficamente seguros, codificados en base64 URL-safe. Mucho más seguro que `random` o UUIDs. |
| **Rate limiting por intentos** | Patrón de "account lockout" basado en intentos fallidos por email, con ventana deslizante de 15 minutos. Protege contra ataques de fuerza bruta sin necesitar middleware externo. |

### Preguntas típicas de entrevista

**P: ¿Por qué guardas el JWT en localStorage y no en una cookie HTTP-only?**
> R: Es un trade-off consciente. localStorage es vulnerable a XSS pero simplifica la implementación — puedo acceder al token desde JavaScript para incluirlo en headers de Axios. Una cookie HTTP-only sería más segura contra XSS, pero complicaría el manejo de CORS y requeriría configuración de SameSite. Para mitigar el riesgo de XSS, React escapa automáticamente el HTML renderizado y valido/sanitizo inputs en el backend. En producción, migraría a cookies HTTP-only con refresh tokens.

**P: ¿Cómo funciona tu protección contra fuerza bruta?**
> R: Implementé un sistema basado en el modelo `LoginAttempt`. Cada intento de login (exitoso o fallido) se registra con email, IP y timestamp. El método `is_account_locked()` cuenta intentos fallidos en los últimos 15 minutos — si hay 5 o más, bloquea la cuenta temporalmente. Al hacer login exitoso, `clear_failed_attempts()` resetea el contador. Es un lockout temporal, no permanente, para evitar denegación de servicio intencional.

**P: ¿Qué pasa si un usuario cambia de rol mientras tiene un JWT activo?**
> R: El rol está embebido en el JWT como claim, así que el cambio no se refleja hasta que el token expire (24 horas por defecto). Fue una decisión de diseño: priorizo rendimiento (no consultar BD en cada request) sobre consistencia inmediata. Si fuera crítico, implementaría una blacklist de tokens o refresh tokens con validación en BD.

### Posibles mejoras

- Implementar refresh tokens para reducir la ventana de exposición del access token (15 min access + 7 días refresh)
- Migrar almacenamiento de tokens a cookies HTTP-only con flag Secure y SameSite=Strict
- Agregar 2FA (TOTP) con Google Authenticator para cuentas Admin
- Implementar rate limiting a nivel de IP con Flask-Limiter, no solo por cuenta
- Agregar audit log de sesiones activas para que el usuario vea dónde está logueado

---

## 3. CRUD de Productos

### Qué hace

Permite crear productos con imagen, SKU único, precios de costo y venta, stock inicial, y categoría. Los productos se pueden listar con filtros avanzados, editar, y eliminar con soft delete (se marcan como inactivos y se guarda un snapshot de auditoría). El sistema calcula automáticamente el margen de ganancia y genera alertas cuando el stock está bajo.

### Cómo funciona técnicamente

#### Flujo de Creación de Producto
```
Usuario llena ProductForm → Selecciona imagen → Submit
→ Frontend construye FormData (multipart) → POST /api/products
→ Backend: Validar con ProductCreateSchema (Marshmallow)
→ Verificar SKU único → Verificar categoría existe
→ Crear registro Product con UUID → Procesar imagen (resize, guardar en /uploads/products/)
→ Crear InventoryMovement tipo "Stock Inicial" → Calcular profit_margin
→ Commit transacción → Retornar producto completo con relaciones
```

**Archivos involucrados:**
- `backend/app/routes/products.py` — Endpoints CRUD con decoradores de autorización
- `backend/app/models/product.py` — Modelo con `validate_sku_unique()`, `calculate_profit_margin()`, `is_low_stock()`, soft delete con `deleted_at`
- `backend/app/schemas/product_schema.py` — Validación: nombre requerido (max 200), SKU alfanumérico, precios > 0, stock >= 0
- `backend/app/utils/image_handler.py` — Procesamiento y almacenamiento de imágenes
- `backend/app/models/product_deletion_audit.py` — Snapshot JSON del producto al eliminar
- `frontend/src/pages/Products/CreateProduct.jsx` — Página de creación
- `frontend/src/components/forms/ProductForm.jsx` — Formulario reutilizable (crear/editar)
- `frontend/src/components/forms/ImageUpload.jsx` — Componente de subida de imagen con preview
- `frontend/src/services/productService.js` — `createProduct(formData)` con multipart

#### Flujo de Soft Delete
```
Usuario click "Eliminar" → DeleteProductDialog pide confirmación y razón
→ DELETE /api/products/:id → Backend: Crear ProductDeletionAudit con JSON snapshot
→ Marcar product.deleted_at = now() → Marcar product.is_active = False
→ Registrar usuario que eliminó y razón → Commit
→ Producto desaparece de listados pero datos persisten en BD
```

#### Flujo de Listado con Filtros
```
Usuario aplica filtros (categoría, stock, búsqueda, orden)
→ GET /api/products?category_id=X&stock_status=low&search=term&page=1&per_page=20
→ Backend construye query dinámico con SQLAlchemy
→ Aplica filtros encadenados → Paginación con .paginate()
→ Retorna data[] + pagination{page, per_page, total, pages}
→ Frontend renderiza ProductTable o ProductCardView según preferencia
```

### Tecnologías y patrones usados

| Tecnología/Patrón | Por qué |
|---|---|
| **Soft Delete** | Nunca elimino datos físicamente. Uso `deleted_at` timestamp + `is_active = False`. Esto permite auditoría, recuperación de datos, y mantiene integridad referencial con movimientos de inventario existentes. |
| **Audit Trail (ProductDeletionAudit)** | Al eliminar, guardo un snapshot JSON completo del producto con todas sus relaciones. Esto cumple requisitos de trazabilidad empresarial y permite reconstruir el estado histórico. |
| **Optimistic Locking (version field)** | El producto tiene un campo `version` que se incrementa en cada actualización. Si dos usuarios intentan modificar el mismo producto simultáneamente, el segundo recibe un `ConcurrencyError`. Esto previene la condición de carrera "last write wins". |
| **Multipart FormData** | Para la imagen uso `multipart/form-data` en lugar de base64 porque es más eficiente en transferencia (no infla el tamaño un 33%) y el backend puede procesar el archivo directamente con `request.files`. |
| **Paginación server-side** | Con SQLAlchemy `.paginate()` solo traigo los registros necesarios. Con miles de productos, traer todos sería inviable. El frontend envía `page` y `per_page` como query params. |

### Preguntas típicas de entrevista

**P: ¿Por qué usas soft delete en lugar de eliminar directamente?**
> R: Tres razones: primero, integridad referencial — si un producto tiene movimientos de inventario históricos, eliminarlo rompería esas referencias. Segundo, auditoría — en un sistema empresarial necesito saber qué se eliminó, quién lo hizo y cuándo. Tercero, recuperación — si fue un error, puedo restaurar. El trade-off es que las queries de listado necesitan filtrar `WHERE deleted_at IS NULL`, pero lo manejo con scopes en el modelo.

**P: ¿Cómo manejas la concurrencia cuando dos usuarios editan el mismo producto?**
> R: Implementé optimistic locking. Cada producto tiene un campo `version` (integer). Cuando un usuario carga el producto, recibe la versión actual. Al guardar, el backend verifica que la versión no haya cambiado. Si otro usuario modificó el producto entre tanto, la versión no coincide y se retorna un `ConcurrencyError` (409 Conflict). El usuario debe recargar y volver a aplicar sus cambios. Esto es mejor que pessimistic locking (bloquear el registro) porque no impide la lectura y no requiere manejar locks huérfanos.

**P: ¿Cómo validaste que el SKU sea único?**
> R: Validación en dos capas. Primero, en el frontend tengo un endpoint `validateSKU()` que verifica en tiempo real mientras el usuario escribe (con debounce). Segundo, en el backend el schema de Marshmallow valida formato (alfanumérico + guiones), y el modelo tiene un método `validate_sku_unique()` que consulta la BD. Además, la columna tiene constraint UNIQUE en la BD como última línea de defensa. Tres capas: UX, lógica, y base de datos.

### Posibles mejoras

- Implementar almacenamiento de imágenes en S3/Cloudinary en lugar de filesystem local
- Agregar bulk import de productos via CSV
- Implementar versionado de productos (historial de cambios de precio)
- Cache de listados con Redis para queries frecuentes
- Búsqueda full-text con PostgreSQL `tsvector` o Elasticsearch

---

## 4. Gestión de Inventario

### Qué hace

Es el módulo más complejo del sistema. Permite: tracking de stock en tiempo real con WebSockets, ajustes manuales de inventario con validación y doble confirmación, historial completo de movimientos con filtros avanzados, configuración inteligente de puntos de reorden, alertas de stock crítico, y cálculo del valor total del inventario con desglose por categoría.

### Cómo funciona técnicamente

#### Flujo de Ajuste Manual de Inventario
```
Usuario selecciona producto → Elige tipo (incremento/decremento) → Ingresa cantidad y razón
→ Frontend valida: cantidad > 0, razón entre 10-500 chars, razón de lista predefinida
→ Si ajuste > 50% del stock actual → AdjustmentConfirmDialog (doble confirmación)
→ POST /api/inventory/adjust
→ Backend: InventoryAdjustmentService.create_adjustment()
  → Validar producto existe y activo
  → Validar razón en ADJUSTMENT_REASONS
  → Llamar StockService.update_stock() con lock de fila
    → SELECT ... FOR UPDATE (lock a nivel BD)
    → Verificar version (optimistic locking)
    → Calcular new_stock = previous_stock ± quantity
    → Validar new_stock >= 0 (no stock negativo)
    → UPDATE product SET stock_quantity, version++, stock_last_updated
    → INSERT InventoryMovement (tipo, cantidad, stock anterior/nuevo, usuario, razón)
    → Verificar alertas: ¿stock <= reorder_point? ¿stock == 0?
    → Si hay alerta → INSERT InventoryAlert + emit WebSocket
  → Commit transacción
→ Emit evento 'stock_updated' por WebSocket
→ Frontend recibe evento → Actualiza UI sin reload
```

**Archivos involucrados:**
- `backend/app/services/stock_service.py` — Núcleo: `update_stock()` con lock de fila y optimistic locking
- `backend/app/services/inventory_adjustment_service.py` — Validaciones específicas de ajustes
- `backend/app/services/critical_stock_alert_service.py` — Generación y resolución de alertas
- `backend/app/models/inventory_movement.py` — Registro de auditoría de cada movimiento
- `backend/app/models/inventory_alert.py` — Alertas activas y resueltas
- `backend/app/utils/constants.py` — `ADJUSTMENT_REASONS`, `SIGNIFICANT_ADJUSTMENT_THRESHOLD`
- `frontend/src/pages/Inventory/ManualAdjustments.jsx` — Página de ajustes
- `frontend/src/components/inventory/ManualAdjustmentForm.jsx` — Formulario
- `frontend/src/components/inventory/AdjustmentConfirmDialog.jsx` — Doble confirmación

#### Flujo de Historial de Movimientos
```
Usuario accede a /inventory/movements → GET /api/inventory/movements
→ Backend: InventoryMovementService.get_movements()
  → Query con JOIN a Product y User
  → Filtros opcionales: date_from, date_to, movement_type, product_id, user_id, category_id
  → Paginación: default 50, max 100
  → ORDER BY created_at DESC
→ Frontend renderiza MovementHistoryTable
→ Usuario puede expandir fila → MovementDetailsModal con info completa
```

**Archivos involucrados:**
- `backend/app/services/inventory_movement_service.py` — Queries con filtros dinámicos
- `frontend/src/pages/Inventory/MovementHistory.jsx` — Página principal
- `frontend/src/components/inventory/MovementHistoryTable.jsx` — Tabla con sorting
- `frontend/src/components/inventory/MovementFilters.jsx` — Panel de filtros
- `frontend/src/components/inventory/MovementDetailsModal.jsx` — Detalle expandido
- `frontend/src/components/inventory/MovementTypeChip.jsx` — Badge visual por tipo

#### Sugerencia Inteligente de Punto de Reorden
```
GET /api/inventory/reorder-suggestions/:product_id
→ ReorderPointService.get_reorder_suggestion()
  → Consultar movimientos de salida (ventas) de últimos 30 días
  → avg_daily_sales = total_salidas / 30
  → safety_stock = ceil(avg_daily_sales × 3 días)
  → suggested_reorder = ceil((avg_daily_sales × 7 días lead time) + safety_stock)
  → Retornar: sugerido, actual, cálculo detallado, histórico
```

**Fórmula:**
```
punto_reorden = ⌈(ventas_promedio_diarias × días_lead_time) + stock_seguridad⌉
stock_seguridad = ⌈ventas_promedio_diarias × días_seguridad⌉
```

**Archivos involucrados:**
- `backend/app/services/reorder_point_service.py` — Cálculos con datos históricos
- `frontend/src/components/inventory/ReorderSuggestionDialog.jsx` — Diálogo con explicación del cálculo
- `frontend/src/components/inventory/BulkReorderPointDialog.jsx` — Configuración masiva por categoría

### Tecnologías y patrones usados

| Tecnología/Patrón | Por qué |
|---|---|
| **SELECT ... FOR UPDATE** | Lock pesimista a nivel de fila en PostgreSQL. Cuando actualizo stock, bloqueo la fila del producto para que ninguna otra transacción la modifique hasta que haga commit. Esto previene race conditions en ajustes concurrentes. |
| **Optimistic + Pessimistic Locking** | Uso ambos: pessimistic (FOR UPDATE) para garantizar atomicidad de la transacción, y optimistic (version field) para detectar conflictos a nivel de aplicación. El pessimistic maneja la concurrencia de BD, el optimistic maneja la concurrencia de UI. |
| **Event-driven con WebSockets** | Cada cambio de stock emite un evento `stock_updated` via Socket.IO. Los clientes conectados actualizan su UI instantáneamente sin polling. Esto es crucial en un almacén donde múltiples personas consultan stock simultáneamente. |
| **Doble confirmación** | Para ajustes que representan más del 50% del stock actual, pido confirmación extra. Es un patrón de seguridad UX que previene errores de captura (ej: escribir 100 en vez de 10). El threshold es configurable en `constants.py`. |
| **Audit Trail inmutable** | Cada movimiento de inventario crea un registro en `inventory_movements` con el stock anterior y nuevo. Este registro nunca se modifica ni elimina. Permite reconstruir el historial completo del stock de cualquier producto. |

### Preguntas típicas de entrevista

**P: ¿Cómo garantizas que el stock nunca sea negativo?**
> R: Validación en tres capas. Primera, en el frontend valido que la cantidad no exceda el stock disponible antes de enviar. Segunda, en el service layer verifico `new_stock >= 0` antes de aplicar el cambio. Tercera, uso `SELECT ... FOR UPDATE` para lockear la fila del producto durante la transacción, asegurando que nadie más modifique el stock entre mi lectura y mi escritura. Si la validación falla en cualquier capa, la operación se revierte completamente gracias a la transacción de PostgreSQL.

**P: ¿Cómo funciona tu sistema de alertas de stock?**
> R: Tengo un modelo `InventoryAlert` que se crea automáticamente dentro del `StockService.update_stock()`. Después de actualizar el stock, verifico: si `stock == 0`, creo alerta tipo `out_of_stock`; si `stock <= reorder_point`, creo alerta tipo `reorder_point`. Las alertas tienen flag `is_active` y cuando el stock se recupera (por ejemplo, con una entrada), las alertas se resuelven automáticamente con `resolved_at`. El frontend consulta alertas activas para mostrarlas en el dashboard y en la vista de productos con stock bajo.

**P: ¿Por qué calculaste el punto de reorden con datos históricos en vez de dejarlo como valor fijo?**
> R: Un valor fijo no se adapta a la demanda real. Mi servicio `ReorderPointService` analiza los movimientos de salida de los últimos 30 días para calcular las ventas promedio diarias. Con eso, aplica la fórmula clásica de inventario: `(demanda promedio × lead time) + stock de seguridad`. El stock de seguridad son 3 días adicionales de demanda promedio. Esto da una sugerencia basada en datos reales, no en intuición. El usuario puede aceptar la sugerencia o configurar manualmente. También ofrezco configuración masiva por categoría para eficiencia.

### Posibles mejoras

- Implementar predicción de demanda con análisis de tendencias estacionales (no solo promedio simple)
- Agregar notificaciones push (email/Slack) cuando se generan alertas de stock crítico
- Implementar reserva de stock (stock comprometido por pedidos pendientes vs. stock disponible)
- Agregar soporte para múltiples ubicaciones de almacén
- Implementar conteo cíclico (cycle counting) con programación automática

---

## 5. Gestión de Clientes

### Qué hace

Permite registrar clientes con información de contacto completa (nombre, email, teléfono, dirección con ciudad y código postal), listarlos con filtros y paginación, activar/desactivar clientes, y eliminarlos con auditoría completa. La eliminación guarda un snapshot JSON del cliente para trazabilidad.

### Cómo funciona técnicamente

#### Flujo de Creación
```
Usuario llena CustomerForm → Submit
→ POST /api/customers → Validar schema (email único, campos requeridos)
→ INSERT en tabla customers con UUID → Retornar cliente creado
→ Frontend redirect a lista con notificación de éxito
```

#### Flujo de Listado con Filtros
```
GET /api/customers?search=term&status=active&page=1&per_page=20
→ Backend: Query dinámico con filtros encadenados
  → search: ILIKE en full_name, email, phone
  → status: is_active = true/false
→ Paginación server-side → Retornar data + metadata
→ Frontend: CustomerTable o CustomerCardView (toggle de vista)
```

#### Flujo de Eliminación con Auditoría
```
DELETE /api/customers/:id → Crear CustomerDeletionAudit
→ Snapshot JSON completo del cliente (todos los campos)
→ Registrar: quién eliminó, cuándo, razón
→ Eliminar registro de customers
→ Audit trail permanece para trazabilidad
```

**Archivos involucrados:**
- `backend/app/routes/customers.py` — CRUD endpoints
- `backend/app/models/customer.py` — Modelo con `validate_email_unique()`, dirección completa
- `backend/app/models/customer_deletion_audit.py` — Snapshot de auditoría
- `frontend/src/pages/Customers/` — CustomerList, CreateCustomer, CustomerDetail, EditCustomer
- `frontend/src/components/customers/` — CustomerTable, CustomerCardView, CustomerFilters, CustomerStats, DeleteCustomerDialog, CustomerForm
- `frontend/src/services/customerService.js` — CRUD + `checkEmail()`, `toggleActive()`

### Tecnologías y patrones usados

| Tecnología/Patrón | Por qué |
|---|---|
| **Validación de email único en tiempo real** | `checkEmail(email, excludeId)` verifica unicidad antes de submit, evitando un round-trip inútil. El `excludeId` excluye al propio cliente en edición. |
| **Toggle Active pattern** | En vez de eliminar, ofrezco "desactivar" como primera opción. `toggleActive()` cambia `is_active` sin perder datos. La eliminación real es la última opción y requiere confirmación. |
| **Dual view (Table/Card)** | El usuario puede alternar entre vista tabla (más datos, compacta) y vista cards (más visual). El toggle se mantiene en el estado local del componente. |
| **Componente CustomerForm reutilizable** | El mismo formulario sirve para crear y editar. Recibe `initialData` como prop; si existe, precarga los campos. Esto evita duplicación de código y mantiene validaciones consistentes. |

### Preguntas típicas de entrevista

**P: ¿Cómo manejas la validación de unicidad del email?**
> R: Tres capas: en el frontend hago un check async con `checkEmail(email, excludeId)` mientras el usuario llena el formulario — el `excludeId` es para que en edición no se compare el email consigo mismo. En el backend, el schema valida formato y el modelo verifica unicidad con una query. Finalmente, la columna email tiene constraint UNIQUE en PostgreSQL. Si por algún race condition pasan las dos primeras capas, la BD lo rechaza y el backend retorna un error 409 Conflict limpio.

**P: ¿Por qué guardas un snapshot JSON al eliminar en vez de soft delete?**
> R: Para clientes uso eliminación real (hard delete) con snapshot de auditoría en lugar de soft delete. La razón es cumplimiento de privacidad: si un cliente solicita eliminación de sus datos, necesito poder eliminarlos realmente. Pero la empresa necesita trazabilidad, así que guardo un snapshot en `CustomerDeletionAudit` que incluye qué se eliminó, quién lo hizo y cuándo. Es un balance entre privacidad del cliente y necesidades de auditoría del negocio.

### Posibles mejoras

- Agregar historial de pedidos por cliente (cuando se implemente el módulo de pedidos)
- Implementar segmentación de clientes (por volumen de compra, frecuencia)
- Agregar importación masiva de clientes via CSV
- Implementar merge de clientes duplicados
- Agregar campos personalizables (custom fields) por negocio

---

## 6. Conexión Frontend-Backend

### Qué hace

El frontend React se comunica con el backend Flask exclusivamente via HTTP (REST API) y WebSockets (Socket.IO). Toda la comunicación pasa por una capa de servicios centralizada que maneja autenticación, errores, y formateo de datos.

### Cómo funciona técnicamente

#### Configuración de Axios
```
frontend/src/services/api.js:
  → Crea instancia Axios con baseURL desde VITE_API_BASE_URL
  → Request Interceptor: Inyecta "Authorization: Bearer <token>" en cada request
  → Response Interceptor: Si recibe 401 → Limpia localStorage → Redirect a /login
  → Exporta instancia configurada para que todos los servicios la usen
```

#### Flujo de una petición típica (ej: listar productos)
```
1. Componente ProductList monta → useEffect llama productService.getProducts(filters)
2. productService.js → api.get('/products', { params: filters })
3. api.js → Request interceptor agrega header Authorization
4. HTTP → GET http://localhost:5000/api/products?page=1&per_page=20
5. Flask → Blueprint products → @jwt_required() verifica token
6. Route handler → Construye query SQLAlchemy → Ejecuta con paginación
7. Serializa con to_dict() → Retorna JSON { success: true, data: [...], pagination: {...} }
8. Axios Response interceptor → Pasa respuesta al servicio
9. productService → Retorna response.data al componente
10. Componente actualiza estado → React re-renderiza tabla
```

#### Manejo de Errores en la Cadena
```
Backend error → JSON { success: false, error: { code, message, details } }
→ Axios response interceptor:
  - 401: logout automático + redirect
  - 403: redirect a /forbidden
  - 4xx/5xx: propaga error al servicio
→ Service catch:
  - Extrae error.response.data.error.message
  - Lanza error con mensaje legible
→ Componente catch:
  - Muestra Snackbar/Alert con el mensaje
  - No crashea la app
```

#### CORS
```
Backend (app/__init__.py):
  → Flask-CORS configurado con CORS_ORIGIN del .env
  → Desarrollo: http://localhost:5173 (Vite dev server)
  → Producción: URL del frontend desplegado
  → Permite headers Authorization y Content-Type
```

**Archivos involucrados:**
- `frontend/src/services/api.js` — Instancia Axios, interceptores
- `frontend/src/services/authService.js` — Login/register/token management
- `frontend/src/services/productService.js` — CRUD productos
- `frontend/src/services/inventoryService.js` — Operaciones de inventario
- `frontend/src/services/customerService.js` — CRUD clientes
- `backend/app/__init__.py` — CORS setup, error handlers globales

### Tecnologías y patrones usados

| Tecnología/Patrón | Por qué |
|---|---|
| **Axios con interceptores** | Centralizo la lógica de auth y manejo de errores en un solo lugar. Cada servicio usa la misma instancia pre-configurada sin preocuparse por tokens o error handling. Es el patrón "HTTP Client Wrapper". |
| **Service Layer en frontend** | Cada entidad tiene su propio servicio (`productService.js`, etc.) que encapsula las llamadas API. Los componentes no conocen URLs ni headers — solo llaman métodos con nombres descriptivos como `getProducts(filters)`. Facilita testing y cambios de API. |
| **Respuesta estandarizada** | Todas las respuestas del backend siguen el mismo formato `{ success, data, error, pagination }`. El frontend puede manejar respuestas de forma genérica sin parsear cada endpoint diferente. |
| **Bearer Token en headers** | Sigo el estándar RFC 6750. El interceptor inyecta el header automáticamente, así que los servicios no necesitan manejar autenticación manualmente. |

### Preguntas típicas de entrevista

**P: ¿Cómo manejas la expiración del token?**
> R: El response interceptor de Axios detecta cualquier respuesta 401 (Unauthorized) y automáticamente limpia el token y datos de usuario de localStorage, luego redirige al login. El usuario no ve un error críptico — simplemente es redirigido al login con la posibilidad de volver a autenticarse. Para evitar requests innecesarios mientras el token expirado está en localStorage, podría verificar el `exp` claim del JWT antes de cada request, pero aún no lo implementé.

**P: ¿Por qué separaste los servicios del frontend en archivos individuales?**
> R: Sigo el Single Responsibility Principle. Cada servicio maneja una sola entidad y sus operaciones. `productService.js` solo conoce los endpoints de productos. Si cambio la estructura de la API de inventario, solo toco `inventoryService.js`. Además, facilita el testing — puedo mockear `productService` en tests de componentes sin afectar otros servicios. También mejora la legibilidad: `productService.getProducts()` es autoexplicativo.

**P: ¿Cómo manejarías un error de red (sin conexión)?**
> R: Axios lanza un error sin `response` property cuando no hay conexión. En los componentes capturo esto y muestro un mensaje genérico "Error de conexión, intenta de nuevo". No tengo implementado retry automático ni offline queue, pero con una librería como React Query podría agregar retry con backoff exponencial y cache local fácilmente. Para una versión futura, consideraría Service Workers para funcionalidad offline básica.

### Posibles mejoras

- Migrar a React Query/TanStack Query para cache, retry automático, y manejo de estados de carga
- Implementar cancel tokens para requests obsoletos (ej: el usuario navega antes de que termine un fetch)
- Agregar request debouncing para búsquedas en tiempo real
- Implementar un error boundary global con fallback UI elegante
- Agregar health check endpoint para detectar caídas del backend proactivamente

---

## 7. Base de Datos y ORM

### Qué hace

PostgreSQL almacena todos los datos del sistema. SQLAlchemy como ORM mapea las tablas a clases Python. Flask-Migrate (wrapper de Alembic) maneja las migraciones de esquema de forma versionada e incremental.

### Cómo funciona técnicamente

#### Estructura de Modelos
```
backend/app/models/:
  user.py              → User (auth, roles)
  product.py           → Product (catálogo, precios, stock)
  category.py          → Category (agrupación de productos)
  customer.py          → Customer (clientes del negocio)
  inventory_movement.py → InventoryMovement (audit trail de stock)
  inventory_alert.py    → InventoryAlert (alertas de stock bajo)
  inventory_value_history.py → Snapshots de valor del inventario
  login_attempt.py      → Tracking de intentos de login
  password_reset_token.py → Tokens de recuperación de contraseña
  product_deletion_audit.py → Snapshot al eliminar producto
  customer_deletion_audit.py → Snapshot al eliminar cliente
```

#### Relaciones Principales
```
User (1) ──→ (∞) InventoryMovement     (quién hizo el cambio)
User (1) ──→ (∞) LoginAttempt          (intentos de login)
User (1) ──→ (∞) PasswordResetToken    (tokens de reset)
Category (1) ──→ (∞) Product            (categorización)
Product (1) ──→ (∞) InventoryMovement   (historial de stock)
Product (1) ──→ (∞) InventoryAlert      (alertas activas)
```

#### Cadena de Migraciones (12 migraciones)
```
1. c87bbe77a42a → Tabla users con enum de roles
2. ed25a98c0fb4 → Tabla login_attempts
3. 705507412712 → Tabla password_reset_tokens
4. 5bc5d7a283a8 → Tablas categories y products
5. 9f4fd504acd5 → Tabla inventory_movements
6. 53c4be16db29 → Índices en inventory_movements
7. 3488fe0cb2be → Campos de tracking: stock_last_updated, version
8. 91a1b0ade10f → Campo reorder_point en products
9. 3e515d718137 → Tabla inventory_alerts
10. 32c1e176d214 → Soft delete + tabla product_deletion_audit
11. 31e5d07e5229 → Tabla inventory_value_history
12. 7af351d243c6 → Tabla customers
```

#### Patrón de Queries con SQLAlchemy
```python
# Query dinámico con filtros opcionales (products.py)
query = Product.query.filter(Product.deleted_at.is_(None))

if category_id:
    query = query.filter(Product.category_id == category_id)
if search:
    query = query.filter(Product.name.ilike(f'%{search}%'))
if stock_status == 'low':
    query = query.filter(Product.stock_quantity <= Product.min_stock_level)

result = query.order_by(Product.created_at.desc()).paginate(
    page=page, per_page=per_page, error_out=False
)
```

### Tecnologías y patrones usados

| Tecnología/Patrón | Por qué |
|---|---|
| **PostgreSQL** | Necesito transacciones ACID para operaciones de inventario. `SELECT ... FOR UPDATE` para locks de fila. Tipos de datos ricos (UUID nativo, ENUM, JSONB para snapshots). SQLite no soportaría concurrencia real. |
| **SQLAlchemy ORM** | Me permite escribir queries en Python con type safety y protección automática contra SQL injection (usa parameterized queries internamente). Las relaciones se definen de forma declarativa y lazy-loading minimiza queries innecesarios. |
| **UUID como Primary Key** | En lugar de auto-increment integers. UUIDs son únicos globalmente, no revelan el número de registros (seguridad), y permiten generar IDs en el cliente si fuera necesario. El trade-off es que son más grandes (16 bytes vs 4) y los índices son ligeramente más lentos. |
| **Alembic para migraciones** | Cada cambio de esquema es una migración versionada con `upgrade()` y `downgrade()`. Puedo avanzar y retroceder migraciones de forma determinista. El historial de migraciones documenta la evolución del esquema. |
| **Índices estratégicos** | Índices en columnas frecuentemente consultadas: `email` (login), `sku` (búsqueda), `created_at` (ordenamiento), `product_id + created_at` en movements (historial). Los índices aceleran reads a costa de writes ligeramente más lentos. |
| **Decimal(10,2) para precios** | Nunca uso FLOAT para dinero. Decimal evita errores de punto flotante (ej: 0.1 + 0.2 ≠ 0.3 en float). `Numeric(10,2)` en PostgreSQL garantiza precisión exacta a 2 decimales. |

### Preguntas típicas de entrevista

**P: ¿Por qué usaste UUID en lugar de auto-increment para las primary keys?**
> R: Tres razones. Primera, seguridad: un ID auto-increment revela cuántos registros hay (si el último producto es ID 47, sé que hay ~47 productos). Con UUID eso es imposible. Segunda, distribución: si en el futuro tengo múltiples instancias o microservicios, los UUIDs son únicos globalmente sin coordinación. Tercera, el frontend puede generar el ID antes de enviarlo al backend, útil para operaciones optimistas. El costo es mayor tamaño de índice y ligeramente peor rendimiento en JOINs, pero para el volumen de este sistema es insignificante.

**P: ¿Cómo manejas las migraciones en producción?**
> R: Uso Alembic (via Flask-Migrate). Cada cambio de esquema genera un archivo de migración con funciones `upgrade()` y `downgrade()`. Antes de deploy, verifico la migración en un ambiente staging. En producción, `flask db upgrade` aplica las migraciones pendientes de forma atómica — si algo falla, PostgreSQL revierte la transacción. La cadena de migraciones forma un DAG lineal donde cada migración apunta a su predecesora, garantizando orden determinista.

**P: ¿Cómo evitas N+1 queries?**
> R: SQLAlchemy usa lazy loading por defecto, lo que puede causar N+1. Para relaciones que sé que voy a necesitar, uso `db.relationship()` con `lazy='dynamic'` para tener control explícito. En queries de listado donde necesito datos relacionados (ej: producto con su categoría), uso `joinedload()` o `subqueryload()` para cargar relaciones en una sola query. El pattern general es: lazy loading para accesos puntuales, eager loading para listados.

### Posibles mejoras

- Agregar connection pooling con PgBouncer para manejar más conexiones concurrentes
- Implementar read replicas para separar queries de lectura y escritura
- Agregar particionamiento de tablas para `inventory_movements` (particionar por fecha)
- Implementar backup automático con pg_dump + cron
- Agregar database-level triggers para validaciones críticas como stock negativo

---

## 8. Actualizaciones en Tiempo Real (WebSockets)

### Qué hace

Cuando cualquier usuario modifica el stock de un producto (ajuste manual, stock inicial, etc.), todos los clientes conectados reciben la actualización instantáneamente sin necesidad de recargar la página. Esto es crítico en un almacén donde múltiples personas consultan y modifican inventario simultáneamente.

### Cómo funciona técnicamente

```
1. Backend: Flask-SocketIO corre junto con Flask en el mismo proceso
2. Cliente React conecta via socket.io-client al montar la app
3. StockService.update_stock() hace el cambio en BD
4. Después del commit, emite evento 'stock_updated' con:
   { product_id, sku, name, new_stock, version, timestamp, user_name, movement_type }
5. Todos los clientes Socket.IO reciben el evento
6. Componentes con listener actualizan su estado local
7. React re-renderiza solo los componentes afectados
```

**Archivos involucrados:**
- `backend/run.py` — Inicializa SocketIO con la app Flask
- `backend/app/__init__.py` — Crea instancia de SocketIO
- `backend/app/routes/stock.py` — Endpoint REST + emisión de eventos WebSocket
- `backend/app/services/stock_service.py` — Emite `stock_updated` post-commit
- `frontend/src/services/` — socket.io-client listener

### Tecnologías y patrones usados

| Tecnología/Patrón | Por qué |
|---|---|
| **Socket.IO (no WebSocket puro)** | Socket.IO agrega reconexión automática, fallback a long-polling, y rooms/namespaces. Si el WebSocket falla (firewalls, proxies), degrada a HTTP long-polling transparentemente. Con WebSocket puro tendría que implementar todo esto manualmente. |
| **Event-driven unidireccional** | El backend emite eventos, los clientes escuchan. No necesito comunicación bidireccional para stock — el cliente modifica via REST API y recibe actualizaciones via WebSocket. Esto simplifica la arquitectura y evita estados inconsistentes. |
| **Emisión post-commit** | Emito el evento WebSocket después de `db.session.commit()`, no antes. Si la transacción falla, no envío datos incorrectos a los clientes. Es el patrón "publish after commit". |

### Preguntas típicas de entrevista

**P: ¿Por qué usas WebSockets para stock y no polling?**
> R: Polling significaría que cada cliente haría un GET cada X segundos, generando carga innecesaria en el servidor y la BD. Con 10 usuarios y polling cada 5 segundos, son 120 requests/minuto sin que nada haya cambiado. Con WebSockets, el servidor solo envía datos cuando hay un cambio real. Es más eficiente en red y CPU, y la latencia de actualización es instantánea vs. hasta 5 segundos con polling.

**P: ¿Qué pasa si un cliente pierde la conexión WebSocket?**
> R: Socket.IO maneja reconexión automática con backoff exponencial. Cuando el cliente se reconecta, puede pedir el estado actual via REST API para sincronizarse. No implementé un mecanismo de "catch-up" (recibir eventos perdidos durante la desconexión), pero podría hacerlo guardando un event log con timestamps y permitiendo al cliente pedir eventos desde su último timestamp conocido.

### Posibles mejoras

- Implementar rooms por página/módulo para no enviar eventos irrelevantes
- Agregar mecanismo de catch-up para eventos perdidos durante desconexión
- Implementar acknowledgements para garantizar entrega
- Escalar con Redis como message broker (adapter de Socket.IO) para múltiples instancias del servidor
- Agregar notificaciones de stock crítico como alertas push en el browser (Notification API)

---

## 9. Control de Acceso Basado en Roles (RBAC)

### Qué hace

El sistema tiene tres roles (Admin, Gerente de Almacén, Personal de Ventas) con permisos diferenciados. Cada rol solo puede acceder a las funcionalidades que le corresponden, tanto en la UI (rutas protegidas, elementos ocultos) como en el backend (decoradores que bloquean endpoints).

### Cómo funciona técnicamente

#### Flujo de Autorización
```
1. Usuario hace login → JWT incluye claim "role": "Admin"
2. Frontend: ProtectedRoute verifica rol antes de renderizar página
   → Si no autorizado → redirect a /forbidden
3. Request HTTP → Axios agrega JWT en header
4. Backend: Decorador @admin_required extrae rol del JWT
   → Si rol no coincide → 403 Forbidden
   → Si coincide → Ejecuta endpoint
```

#### Matriz de Permisos
```
Funcionalidad              | Admin | Gerente Almacén | Personal Ventas
---------------------------|-------|-----------------|----------------
Gestión de usuarios        |  ✓    |       ✗         |       ✗
Productos (CRUD completo)  |  ✓    |       ✓         |       ✗
Productos (solo lectura)   |  ✓    |       ✓         |       ✓
Inventario (ajustes)       |  ✓    |       ✓         |       ✗
Clientes                   |  ✓    |       ✗         |       ✓
Reportes financieros       |  ✓    |       ✗         |       ✗
Reportes de inventario     |  ✓    |       ✓         |       ✗
Dashboard personalizado    |  ✓    |       ✓         |       ✓
```

**Archivos involucrados:**
- `backend/app/utils/decorators.py` — `@admin_required`, `@warehouse_manager_or_admin`, `@sales_staff_or_admin`
- `frontend/src/components/common/ProtectedRoute.jsx` — Guard de ruta con verificación de rol
- `frontend/src/App.jsx` — Rutas con `requiredRole` prop
- `backend/app/models/user.py` — Enum de roles: 'Admin', 'Gerente de Almacén', 'Personal de Ventas'

### Tecnologías y patrones usados

| Tecnología/Patrón | Por qué |
|---|---|
| **Rol en JWT claims** | Leo el rol directamente del token sin consultar la BD en cada request. Esto reduce latencia y carga en la BD. El trade-off es que un cambio de rol no se refleja hasta que el token expire. |
| **Decoradores Python** | Implementé decoradores como `@admin_required` que wrappean el endpoint. Es limpio, declarativo, y reutilizable. Un decorador verifica el JWT, extrae el rol, y compara contra los roles permitidos. Si no tiene permiso, retorna 403 sin ejecutar la función. |
| **ProtectedRoute (HOC)** | Componente React que wrappea rutas. Verifica autenticación y rol antes de renderizar el children. Es el patrón "Guard" de React Router. Si falla auth → login; si falla rol → forbidden. |
| **Doble verificación (frontend + backend)** | El frontend oculta opciones no autorizadas (UX), pero el backend siempre verifica permisos (seguridad). Nunca confío solo en el frontend — un usuario podría hacer requests directos a la API. |

### Preguntas típicas de entrevista

**P: ¿Por qué verificas permisos tanto en frontend como en backend?**
> R: El frontend controla la experiencia de usuario — oculto botones y rutas que el usuario no puede usar. Pero la seguridad real está en el backend. Cualquiera puede abrir DevTools, modificar el rol en localStorage, o hacer requests con curl. Los decoradores del backend son la barrera de seguridad real. El frontend es UX, el backend es security. Nunca confío en el cliente.

**P: ¿Cómo escalarías si necesitas permisos más granulares que roles?**
> R: Migraría de RBAC a un sistema de permisos basado en claims o policies. En vez de verificar "es Admin", verificaría "tiene permiso products.create". Cada rol tendría un set de permisos, y podría crear roles custom. Esto se puede implementar con una tabla `permissions` y una tabla intermedia `role_permissions`. En el JWT incluiría los permisos del usuario, y los decoradores verificarían permisos individuales en vez de roles.

### Posibles mejoras

- Migrar de RBAC fijo a sistema de permisos granulares (permission-based)
- Permitir crear roles custom con permisos seleccionables
- Agregar permisos a nivel de recurso (ej: un vendedor solo ve sus propios pedidos)
- Implementar delegación temporal de permisos (ej: un gerente delega a un asistente por vacaciones)
- Log de accesos denegados para auditoría de seguridad

---

## 10. Valor de Inventario y Reportes

### Qué hace

Calcula el valor monetario total del inventario en tiempo real, con desglose por categoría (incluyendo porcentajes), historial de evolución del valor en el tiempo, y gráficas visuales. Permite al negocio saber cuánto dinero tiene invertido en inventario en todo momento.

### Cómo funciona técnicamente

#### Cálculo del Valor Total
```
GET /api/inventory/value
→ InventoryValueService.get_total_value()
  → SELECT SUM(cost_price * stock_quantity) FROM products
    WHERE stock_quantity > 0 AND is_active = True AND deleted_at IS NULL
  → Retornar: total_value (formateado $X,XXX.XX), total_products, total_quantity
```

#### Desglose por Categoría
```
GET /api/inventory/value/by-category
→ InventoryValueService.get_value_by_category()
  → GROUP BY category → SUM(cost_price * stock_quantity) por categoría
  → Calcular porcentaje de cada categoría sobre el total
  → Retornar lista ordenada por valor descendente
```

#### Evolución Histórica
```
Cada cambio significativo de inventario → Crear snapshot en InventoryValueHistory
→ Guardar: total_value, total_products, total_quantity, categories_count, trigger_reason
→ Frontend consulta GET /api/inventory/value/history
→ Renderiza ValueEvolutionChart (Recharts line graph)
```

**Archivos involucrados:**
- `backend/app/services/inventory_value_service.py` — Cálculos de valor
- `backend/app/models/inventory_value_history.py` — Snapshots históricos
- `frontend/src/components/inventory/InventoryValueWidget.jsx` — Widget de valor total
- `frontend/src/components/inventory/ValueEvolutionChart.jsx` — Gráfica de evolución (Recharts)
- `frontend/src/components/inventory/CategoryValueBreakdown.jsx` — Pie chart por categoría
- `frontend/src/components/inventory/InventoryValueExportCard.jsx` — Exportar datos
- `frontend/src/services/inventoryService.js` — `getTotalValue()`, `getValueByCategory()`, `getValueHistory()`

### Tecnologías y patrones usados

| Tecnología/Patrón | Por qué |
|---|---|
| **Cálculo basado en cost_price** | Uso precio de costo, no de venta, para el valor del inventario. Es el estándar contable (método de costeo). El valor al precio de venta sería el potencial de ingreso, no el valor real invertido. |
| **Snapshots periódicos** | En vez de recalcular la evolución histórica (imposible sin datos), guardo snapshots del valor total en `InventoryValueHistory`. Cada snapshot registra el trigger (cambio significativo, manual, o programado). |
| **Recharts** | Librería de gráficas para React basada en D3 pero con API declarativa. Elegí Recharts sobre Chart.js porque se integra naturalmente con React (componentes JSX) y soporta responsive out-of-the-box. |
| **Agregación en BD** | Los cálculos de `SUM` y `GROUP BY` se ejecutan en PostgreSQL, no en Python. La BD es orders de magnitud más eficiente para agregaciones que traer todos los registros y sumar en memoria. |

### Preguntas típicas de entrevista

**P: ¿Por qué haces la agregación en la base de datos y no en el backend?**
> R: Rendimiento. Si tengo 10,000 productos, hacer `SELECT SUM(cost_price * stock_quantity)` en PostgreSQL toma milisegundos porque opera directamente sobre los datos almacenados. Si en cambio hago `Product.query.all()` y sumo en Python, cargo 10,000 objetos en memoria, instancio 10,000 objetos ORM, y hago la suma en un lenguaje interpretado. PostgreSQL está optimizado para estas operaciones con índices, buffer cache, y ejecución compilada.

**P: ¿Cómo manejas el historial de valor sin afectar rendimiento?**
> R: Los snapshots en `InventoryValueHistory` se crean de forma inteligente: no en cada cambio de stock, sino cuando hay cambios significativos o de forma programada. Cada snapshot es un registro pequeño (unos pocos campos numéricos + timestamp). La consulta de historial está paginada y limitada a un rango de fechas. Para la gráfica de evolución, el frontend recibe los puntos de datos ya calculados — no procesa datos crudos.

### Posibles mejoras

- Implementar método de costeo FIFO/LIFO para cálculos más precisos del valor del inventario
- Agregar reportes de ventas con margen de ganancia real (cuando se implementen pedidos)
- Implementar exportación a PDF con gráficas incluidas
- Agregar dashboard comparativo (este mes vs. mes anterior)
- Implementar alertas cuando el valor del inventario caiga por debajo de un umbral configurado
- Agregar análisis ABC (clasificar productos por impacto en valor del inventario)

---

## Resumen de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19 + Vite)               │
│                                                             │
│  Pages ──→ Components ──→ Services ──→ Axios (api.js)      │
│    │                                      │                 │
│    └── ProtectedRoute (RBAC)              │ JWT Bearer      │
│    └── Socket.IO Client ◄──── WebSocket ──┤                 │
└───────────────────────────────────────────┼─────────────────┘
                                            │ HTTP / WS
┌───────────────────────────────────────────┼─────────────────┐
│                    BACKEND (Flask + SocketIO)                │
│                                                             │
│  Routes (Blueprints) ──→ Services ──→ Models (SQLAlchemy)  │
│    │                        │              │                │
│    ├── @jwt_required        │              └── PostgreSQL   │
│    ├── @admin_required      │                               │
│    └── Marshmallow Schemas  └── InventoryMovement (audit)   │
│                                                             │
│  Decorators ─── Validators ─── Constants ─── Email Service  │
└─────────────────────────────────────────────────────────────┘
```

---

## Datos Técnicos Rápidos (para responder en entrevista)

| Pregunta | Respuesta |
|---|---|
| **¿Cuántos modelos tiene la BD?** | 12 modelos (User, Product, Category, Customer, InventoryMovement, InventoryAlert, InventoryValueHistory, LoginAttempt, PasswordResetToken, ProductDeletionAudit, CustomerDeletionAudit) |
| **¿Cuántas migraciones?** | 12 migraciones incrementales con Alembic |
| **¿Cuántos endpoints API?** | ~40 endpoints distribuidos en 6 blueprints |
| **¿Cuántos componentes React?** | 40+ componentes reutilizables |
| **¿Qué patrón de diseño principal?** | Layered Architecture (Routes → Services → Models) con Factory Pattern |
| **¿Cómo manejas concurrencia?** | Optimistic locking (version field) + Pessimistic locking (SELECT FOR UPDATE) |
| **¿Cómo manejas eliminaciones?** | Soft delete con audit trail (snapshot JSON) |
| **¿Formato de respuesta API?** | Estandarizado: `{ success, data, error, pagination }` |
| **¿Testing?** | pytest (backend), Vitest (frontend) — estructura preparada |
| **¿Deploy?** | Backend: Railway/Render, Frontend: Vercel |
