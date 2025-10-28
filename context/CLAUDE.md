# GesTrack - Sistema de Gestión de Inventario y Pedidos

**Versión:** 1.0
**Última actualización:** 2025-10-27
**Propósito:** Guía técnica completa para Claude Code al trabajar en este proyecto

---

## Descripción del Proyecto

GesTrack es una aplicación web full-stack CRUD que permite a negocios gestionar su inventario de productos, procesar pedidos de clientes, administrar proveedores y generar reportes de ventas.

**Tipo de aplicación:** Sistema empresarial de gestión (ERP básico)
**Idioma del código y documentación:** Español

---

## Stack Tecnológico

### Backend
- **Framework:** Python 3.10+ con Flask
- **Base de datos:** PostgreSQL 14+
- **ORM:** SQLAlchemy
- **Autenticación:** JWT (JSON Web Tokens)
- **Hash de contraseñas:** bcrypt
- **Validación:** Marshmallow
- **Migraciones:** Flask-Migrate (Alembic)

### Frontend
- **Framework:** React 18+ (o Vue.js 3+)
- **Gestión de estado:** Context API / Redux Toolkit (React) o Pinia (Vue)
- **HTTP Client:** Axios
- **UI Framework:** Material-UI / Tailwind CSS
- **Routing:** React Router (React) o Vue Router (Vue)
- **Formularios:** React Hook Form (React) o VeeValidate (Vue)

### DevOps y Deployment
- **Backend:** Railway o Render
- **Frontend:** Vercel
- **Variables de entorno:** .env files (nunca comitear)
- **Control de versiones:** Git

---

## Arquitectura del Proyecto

### Estructura de Directorios

```
GesTrack/
├── backend/                      # Aplicación Flask
│   ├── app/
│   │   ├── __init__.py          # Inicialización de Flask app
│   │   ├── models/              # Modelos SQLAlchemy
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── category.py
│   │   │   ├── order.py
│   │   │   ├── customer.py
│   │   │   ├── supplier.py
│   │   │   └── inventory.py
│   │   ├── routes/              # Blueprints de Flask
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── orders.py
│   │   │   ├── customers.py
│   │   │   ├── suppliers.py
│   │   │   ├── inventory.py
│   │   │   └── reports.py
│   │   ├── schemas/             # Schemas Marshmallow
│   │   │   ├── __init__.py
│   │   │   ├── user_schema.py
│   │   │   ├── product_schema.py
│   │   │   └── ...
│   │   ├── services/            # Lógica de negocio
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── inventory_service.py
│   │   │   └── order_service.py
│   │   ├── utils/               # Utilidades compartidas
│   │   │   ├── __init__.py
│   │   │   ├── decorators.py   # @login_required, @role_required
│   │   │   ├── validators.py
│   │   │   └── helpers.py
│   │   └── config.py            # Configuración de Flask
│   ├── migrations/              # Migraciones de Alembic
│   ├── tests/                   # Tests
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py                   # Entry point
│
├── frontend/                    # Aplicación React/Vue
│   ├── public/
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── common/          # Botones, inputs, modales
│   │   │   ├── layout/          # Navbar, Sidebar, Footer
│   │   │   └── forms/           # Formularios específicos
│   │   ├── pages/               # Páginas principales
│   │   │   ├── Auth/
│   │   │   ├── Products/
│   │   │   ├── Orders/
│   │   │   ├── Customers/
│   │   │   ├── Suppliers/
│   │   │   └── Reports/
│   │   ├── services/            # Llamadas API
│   │   │   ├── api.js           # Configuración axios
│   │   │   ├── authService.js
│   │   │   ├── productService.js
│   │   │   └── ...
│   │   ├── hooks/               # Custom hooks (React)
│   │   ├── context/             # Context providers
│   │   ├── utils/               # Helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── context/                     # Documentación del proyecto
│   ├── user_stories/            # Historias de usuario organizadas
│   │   ├── epic_01_foundation/
│   │   ├── epic_02_core_data/
│   │   ├── epic_03_stock_management/
│   │   ├── epic_04_sales/
│   │   ├── epic_05_supply_chain/
│   │   └── epic_06_analytics/
│   ├── IMPLEMENTATION_PLAN.md   # Plan maestro de implementación
│   ├── project_description.txt
│   └── task_execution.md        # Workflow de ejecución
│
├── CLAUDE.md                    # Este archivo
├── README.md                    # Documentación del proyecto
└── .gitignore
```

---

## Modelos de Datos Principales

### User (Usuario)
```python
- id: UUID (PK)
- full_name: String(100)
- email: String(120), unique, indexed
- password_hash: String(255)
- role: Enum('Admin', 'Gerente de Almacén', 'Personal de Ventas')
- is_active: Boolean, default=True
- created_at: DateTime
- updated_at: DateTime
```

### Product (Producto)
```python
- id: UUID (PK)
- sku: String(50), unique, indexed
- name: String(200)
- description: Text
- cost_price: Decimal(10,2)
- sale_price: Decimal(10,2)
- stock_quantity: Integer, default=0
- min_stock_level: Integer, default=10
- category_id: UUID (FK -> Category)
- image_url: String(500), nullable
- is_active: Boolean, default=True
- created_at: DateTime
- updated_at: DateTime

# Propiedades calculadas:
- profit_margin: (sale_price - cost_price) / sale_price * 100
- is_low_stock: stock_quantity < min_stock_level
```

### Category (Categoría)
```python
- id: UUID (PK)
- name: String(100), unique
- description: Text, nullable
- created_at: DateTime
```

### Customer (Cliente)
```python
- id: UUID (PK)
- full_name: String(200)
- email: String(120), unique, nullable
- phone: String(20)
- address: Text
- is_active: Boolean, default=True
- notes: Text, nullable
- created_at: DateTime
- updated_at: DateTime
```

### Order (Pedido)
```python
- id: UUID (PK)
- order_number: String(50), unique, auto-generated
- customer_id: UUID (FK -> Customer)
- user_id: UUID (FK -> User) # Vendedor
- order_date: DateTime
- status: Enum('Pendiente', 'Confirmado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado')
- payment_status: Enum('Pendiente', 'Parcial', 'Pagado', 'Reembolsado')
- subtotal: Decimal(10,2)
- tax_amount: Decimal(10,2), default=0
- shipping_cost: Decimal(10,2), default=0
- discount_amount: Decimal(10,2), default=0
- total: Decimal(10,2)
- notes: Text, nullable
- created_at: DateTime
- updated_at: DateTime

# Relaciones:
- items: List[OrderItem]
```

### OrderItem (Ítem de Pedido)
```python
- id: UUID (PK)
- order_id: UUID (FK -> Order)
- product_id: UUID (FK -> Product)
- quantity: Integer
- unit_price: Decimal(10,2) # Precio al momento del pedido
- subtotal: Decimal(10,2) # quantity * unit_price
- created_at: DateTime
```

### Supplier (Proveedor)
```python
- id: UUID (PK)
- name: String(200)
- contact_person: String(200), nullable
- email: String(120), nullable
- phone: String(20)
- address: Text, nullable
- is_active: Boolean, default=True
- notes: Text, nullable
- created_at: DateTime
- updated_at: DateTime
```

### PurchaseOrder (Orden de Compra)
```python
- id: UUID (PK)
- order_number: String(50), unique, auto-generated
- supplier_id: UUID (FK -> Supplier)
- user_id: UUID (FK -> User) # Usuario que crea la orden
- order_date: DateTime
- expected_delivery_date: Date, nullable
- status: Enum('Borrador', 'Enviada', 'Parcialmente Recibida', 'Recibida', 'Cancelada')
- total: Decimal(10,2)
- notes: Text, nullable
- created_at: DateTime
- updated_at: DateTime

# Relaciones:
- items: List[PurchaseOrderItem]
```

### PurchaseOrderItem (Ítem de Orden de Compra)
```python
- id: UUID (PK)
- purchase_order_id: UUID (FK -> PurchaseOrder)
- product_id: UUID (FK -> Product)
- quantity_ordered: Integer
- quantity_received: Integer, default=0
- unit_cost: Decimal(10,2)
- subtotal: Decimal(10,2)
- created_at: DateTime
```

### InventoryMovement (Movimiento de Inventario)
```python
- id: UUID (PK)
- product_id: UUID (FK -> Product)
- movement_type: Enum('Venta', 'Compra', 'Ajuste Manual', 'Devolución')
- quantity: Integer # Positivo para entrada, negativo para salida
- previous_stock: Integer
- new_stock: Integer
- reference_id: UUID, nullable # ID de Order o PurchaseOrder
- reference_type: String(50), nullable # 'Order' o 'PurchaseOrder'
- user_id: UUID (FK -> User)
- notes: Text, nullable
- created_at: DateTime
```

---

## Estándares de Código

### Convenciones de Nombres

#### Backend (Python)
- **Archivos:** snake_case (`user_service.py`)
- **Clases:** PascalCase (`UserService`, `ProductModel`)
- **Funciones/métodos:** snake_case (`get_user_by_id()`, `calculate_total()`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_LOGIN_ATTEMPTS`)
- **Variables:** snake_case (`user_data`, `total_price`)
- **Rutas API:** kebab-case (`/api/purchase-orders`)

#### Frontend (JavaScript/TypeScript)
- **Archivos componentes:** PascalCase (`ProductList.jsx`, `OrderForm.jsx`)
- **Archivos servicios/utils:** camelCase (`authService.js`, `formatters.js`)
- **Componentes:** PascalCase (`ProductCard`, `NavigationBar`)
- **Funciones:** camelCase (`fetchProducts()`, `calculateTotal()`)
- **Constantes:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Variables:** camelCase (`userData`, `totalPrice`)

### Estructura de Rutas API

**Patrón:** `/api/<recurso>/<acción>`

#### Autenticación
```
POST   /api/auth/register        # Registrar usuario
POST   /api/auth/login           # Iniciar sesión
POST   /api/auth/logout          # Cerrar sesión
GET    /api/auth/me              # Obtener usuario actual
PUT    /api/auth/profile         # Actualizar perfil
POST   /api/auth/reset-password  # Solicitar reset de contraseña
```

#### Productos
```
GET    /api/products             # Listar productos (con paginación y filtros)
GET    /api/products/:id         # Obtener producto específico
POST   /api/products             # Crear producto
PUT    /api/products/:id         # Actualizar producto
DELETE /api/products/:id         # Eliminar producto (soft delete)
GET    /api/products/search      # Buscar productos
GET    /api/products/low-stock   # Productos con stock bajo
```

#### Categorías
```
GET    /api/categories           # Listar categorías
POST   /api/categories           # Crear categoría
PUT    /api/categories/:id       # Actualizar categoría
DELETE /api/categories/:id       # Eliminar categoría
```

#### Clientes
```
GET    /api/customers            # Listar clientes
GET    /api/customers/:id        # Obtener cliente
POST   /api/customers            # Crear cliente
PUT    /api/customers/:id        # Actualizar cliente
DELETE /api/customers/:id        # Eliminar cliente
GET    /api/customers/:id/orders # Historial de pedidos
```

#### Pedidos
```
GET    /api/orders               # Listar pedidos
GET    /api/orders/:id           # Obtener pedido
POST   /api/orders               # Crear pedido
PUT    /api/orders/:id           # Actualizar pedido
DELETE /api/orders/:id           # Cancelar pedido
PATCH  /api/orders/:id/status    # Actualizar estado
POST   /api/orders/:id/returns   # Procesar devolución
```

#### Proveedores
```
GET    /api/suppliers            # Listar proveedores
GET    /api/suppliers/:id        # Obtener proveedor
POST   /api/suppliers            # Crear proveedor
PUT    /api/suppliers/:id        # Actualizar proveedor
DELETE /api/suppliers/:id        # Eliminar proveedor
```

#### Órdenes de Compra
```
GET    /api/purchase-orders      # Listar órdenes de compra
GET    /api/purchase-orders/:id  # Obtener orden de compra
POST   /api/purchase-orders      # Crear orden de compra
PUT    /api/purchase-orders/:id  # Actualizar orden de compra
DELETE /api/purchase-orders/:id  # Cancelar orden de compra
POST   /api/purchase-orders/:id/receive # Recibir mercancía
```

#### Inventario
```
GET    /api/inventory            # Estado actual del inventario
GET    /api/inventory/movements  # Historial de movimientos
POST   /api/inventory/adjust     # Ajuste manual de inventario
GET    /api/inventory/value      # Valor total del inventario
GET    /api/inventory/by-category # Inventario por categoría
```

#### Reportes
```
GET    /api/reports/dashboard    # Métricas del dashboard
GET    /api/reports/sales-daily  # Ventas diarias
GET    /api/reports/sales-period # Ventas por período
GET    /api/reports/top-products # Productos más vendidos
GET    /api/reports/profit-margin # Análisis de márgenes
GET    /api/reports/inventory    # Reporte de inventario
```

### Formato de Respuestas API

#### Éxito (200, 201)
```json
{
  "success": true,
  "data": { ... } | [ ... ],
  "message": "Operación exitosa" (opcional)
}
```

#### Error (4xx, 5xx)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": { ... } (opcional)
  }
}
```

#### Paginación
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Roles y Permisos

### Admin
- Acceso total a todas las funcionalidades
- Crear/editar/eliminar usuarios
- Ver todos los reportes
- Configurar sistema

### Gerente de Almacén
- Gestión completa de productos y categorías
- Gestión de inventario
- Gestión de proveedores y órdenes de compra
- Ver reportes de inventario
- No puede crear usuarios ni ver reportes financieros detallados

### Personal de Ventas
- Gestión de clientes
- Crear y gestionar pedidos
- Ver productos (solo lectura)
- Ver reportes de ventas propias
- No puede modificar inventario ni precios

---

## Reglas de Negocio Importantes

### Inventario
1. **Stock nunca puede ser negativo** - Validar antes de crear pedido
2. **Al crear un pedido:** stock se reduce automáticamente
3. **Al cancelar un pedido:** stock se restaura automáticamente
4. **Al recibir orden de compra:** stock se incrementa automáticamente
5. **Todo movimiento de inventario se registra** en `InventoryMovement`

### Pedidos
1. **Número de orden auto-generado:** Formato `ORD-YYYYMMDD-XXXX`
2. **Validar stock disponible** antes de confirmar pedido
3. **Calcular totales automáticamente:** subtotal + impuestos + envío - descuentos
4. **Estados de pedido son secuenciales** (excepto Cancelado)
5. **No se puede editar pedido en estado Entregado o Cancelado**

### Órdenes de Compra
1. **Número auto-generado:** Formato `PO-YYYYMMDD-XXXX`
2. **Al recibir parcialmente:** actualizar `quantity_received`
3. **Estado automático basado en cantidad recibida:**
   - Si `quantity_received == quantity_ordered` → "Recibida"
   - Si `0 < quantity_received < quantity_ordered` → "Parcialmente Recibida"

### Productos
1. **SKU único** - Validar en backend
2. **Precio de venta debe ser mayor que precio de costo** (advertencia, no error)
3. **Alerta de stock bajo cuando:** `stock_quantity < min_stock_level`
4. **No eliminar físicamente** - usar `is_active = False` (soft delete)

---

## Validaciones

### Backend (Marshmallow Schemas)
- **Validar tipos de datos**
- **Validar campos requeridos**
- **Validar rangos (precios > 0, stock >= 0)**
- **Validar unicidad (email, SKU)**
- **Validar relaciones (FK existen)**
- **Sanitizar inputs**

### Frontend
- **Validación en tiempo real**
- **Mensajes de error claros**
- **Validación de formato (email, teléfono)**
- **Validación de longitud**
- **Confirmación para acciones destructivas**

---

## Seguridad

### Autenticación
- **JWT con expiración:** 24 horas
- **Refresh tokens:** No implementados en v1.0
- **Contraseñas hasheadas con bcrypt** (work factor: 12)
- **Tokens en HTTP-only cookies** o localStorage (según decisión)

### Autorización
- **Decorador `@login_required`** para rutas protegidas
- **Decorador `@role_required(['Admin'])`** para control de roles
- **Validar permisos en cada endpoint**

### Mejores Prácticas
- **CORS configurado correctamente**
- **Variables de entorno para secrets**
- **SQL Injection protección** (usar ORM)
- **XSS protección** (sanitizar inputs)
- **Rate limiting** (opcional para v1.0)

---

## Manejo de Errores

### Backend
```python
# Errores personalizados
class NotFoundError(Exception): pass
class ValidationError(Exception): pass
class UnauthorizedError(Exception): pass

# Manejador global de errores
@app.errorhandler(Exception)
def handle_error(error):
    # Log error
    # Return JSON response
    pass
```

### Frontend
```javascript
// Interceptor de Axios
axios.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 -> redirect to login
    // Handle 403 -> show unauthorized
    // Handle 5xx -> show generic error
    return Promise.reject(error);
  }
);
```

---

## Testing

### Backend (pytest)
- **Tests unitarios** para servicios y utilidades
- **Tests de integración** para endpoints API
- **Fixtures** para datos de prueba
- **Mocks** para dependencias externas
- **Coverage mínimo:** 70% (objetivo)

### Frontend (Vitest/Jest + React Testing Library)
- **Tests de componentes**
- **Tests de servicios**
- **Tests de integración**
- **Coverage mínimo:** 60% (objetivo)

**Nota para v1.0:** Tests son opcionales según criterios de cada US. Prioridad en implementación funcional.

---

## Variables de Entorno

### Backend (.env)
```bash
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=<random-secret-key>
DATABASE_URL=postgresql://user:pass@localhost:5432/gestrack
JWT_SECRET_KEY=<random-jwt-secret>
JWT_ACCESS_TOKEN_EXPIRES=86400  # 24 horas en segundos
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=GesTrack
```

---

## Dependencias Principales

### Backend (requirements.txt)
```
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.5
Flask-JWT-Extended==4.5.3
Flask-CORS==4.0.0
psycopg2-binary==2.9.9
marshmallow==3.20.1
bcrypt==4.1.1
python-dotenv==1.0.0
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "react-hook-form": "^7.48.2",
    "@mui/material": "^5.14.20",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0"
  }
}
```

---

## Workflow de Desarrollo

### Proceso de Implementación
1. **Leer la historia de usuario completa** en `context/user_stories/`
2. **Trabajar criterios de aceptación UNO A LA VEZ**
3. **Crear/modificar archivos en directorios correctos**
4. **Aplicar estándares de este documento**
5. **Marcar criterios como completados** `[x]` en archivo de US
6. **Marcar US como completada** en `IMPLEMENTATION_PLAN.md`
7. **Actualizar métricas del dashboard**
8. **Solicitar confirmación antes de continuar**

### Git Workflow (Recomendado)
- **Branch principal:** `main` (producción)
- **Branch desarrollo:** `develop`
- **Feature branches:** `feature/US-XXX-XXX-descripcion`
- **Commits descriptivos:** `feat: US-AUTH-001 - Implementar formulario de registro`

### Commits Semánticos
```
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Documentación
style: Formato, sin cambios de código
refactor: Refactorización
test: Tests
chore: Tareas de mantenimiento
```

---

## Comandos Útiles

### Backend
```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Migraciones
flask db init
flask db migrate -m "mensaje"
flask db upgrade

# Ejecutar servidor
flask run
# o
python run.py
```

### Frontend
```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview
```

---

## Documentación de Referencia

### Archivos Clave del Proyecto
| Archivo | Propósito |
|---------|-----------|
| `IMPLEMENTATION_PLAN.md` | Plan maestro con todas las US y progreso |
| `CLAUDE.md` | Este documento - detalles técnicos y estándares |
| `context/user_stories/` | Archivos individuales de historias de usuario |
| `context/task_execution.md` | Workflow de ejecución para implementación |
| `context/project_description.txt` | Descripción original del proyecto |

### Recursos Externos
- **Flask:** https://flask.palletsprojects.com/
- **SQLAlchemy:** https://docs.sqlalchemy.org/
- **React:** https://react.dev/
- **Material-UI:** https://mui.com/
- **PostgreSQL:** https://www.postgresql.org/docs/

---

## Notas Importantes para Claude Code

### Al Comenzar una Tarea
1. ✅ **LEE el archivo completo de la US** antes de empezar
2. ✅ **Sigue la estructura de directorios** definida aquí
3. ✅ **Aplica las convenciones de nombres** consistentemente
4. ✅ **Verifica dependencias** de la US antes de implementar
5. ✅ **Trabaja incrementalmente** - un criterio a la vez

### Durante la Implementación
1. ✅ **Consulta este documento** para decisiones técnicas
2. ✅ **Mantén consistencia** con código existente
3. ✅ **Documenta decisiones importantes** en comentarios
4. ✅ **Valida inputs en backend Y frontend**
5. ✅ **Registra movimientos de inventario** cuando aplique

### Al Finalizar una Tarea
1. ✅ **Marca criterios completados** en archivo de US
2. ✅ **Actualiza IMPLEMENTATION_PLAN.md**
3. ✅ **Actualiza métricas del dashboard**
4. ✅ **Solicita revisión** antes de continuar
5. ✅ **NO avances** sin autorización

### Qué NO Hacer
1. ❌ NO saltarte historias de usuario
2. ❌ NO trabajes múltiples US simultáneamente
3. ❌ NO asumas implementaciones sin verificar criterios
4. ❌ NO modifiques archivos fuera del alcance de la US
5. ❌ NO crees archivos innecesarios
6. ❌ NO uses emojis en código a menos que se solicite
7. ❌ NO comitees archivos .env con datos sensibles

---

## Glosario

- **US:** User Story (Historia de Usuario)
- **CA:** Criterio de Aceptación
- **CRUD:** Create, Read, Update, Delete
- **PK:** Primary Key
- **FK:** Foreign Key
- **JWT:** JSON Web Token
- **ORM:** Object-Relational Mapping
- **API:** Application Programming Interface
- **SKU:** Stock Keeping Unit (Código de producto)
- **Soft delete:** Marcar como inactivo en vez de eliminar físicamente

---

## Changelog

### Versión 1.0 - 2025-10-27
- Creación inicial del documento
- Definición de arquitectura y stack tecnológico
- Especificación de modelos de datos
- Definición de estándares de código
- Documentación de reglas de negocio
- Workflow de desarrollo establecido

---

**Última actualización:** 2025-10-27
**Mantenido por:** Equipo GesTrack
**Para Claude Code:** Este documento es tu referencia técnica principal. Consúltalo frecuentemente durante el desarrollo.
