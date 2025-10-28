# US-AUTH-005: Control de Acceso por Roles

## Historia de Usuario
**Como** sistema,
**quiero** restringir el acceso a funcionalidades según el rol del usuario,
**para** garantizar la seguridad y control de la información.

## Prioridad
**Alta**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Definición de Roles
Los tres roles del sistema tienen los siguientes permisos:

**Admin (acceso total)**
- ✓ Todos los módulos
- ✓ Gestión de usuarios
- ✓ Configuración del sistema
- ✓ Todos los reportes

**Gerente de Almacén**
- ✓ Productos (CRUD completo)
- ✓ Inventario (CRUD + ajustes)
- ✓ Proveedores (CRUD completo)
- ✓ Órdenes de compra (CRUD completo)
- ✓ Reportes de inventario
- ✗ Pedidos
- ✗ Clientes
- ✗ Reportes de ventas
- ✗ Gestión de usuarios

**Personal de Ventas**
- ✓ Pedidos (CRUD completo)
- ✓ Clientes (CRUD completo)
- ✓ Productos (solo lectura)
- ✓ Reportes de ventas
- ✗ Inventario (ajustes)
- ✗ Proveedores
- ✗ Órdenes de compra
- ✗ Gestión de usuarios

### CA-2: Restricción en Frontend
- Se ocultan opciones de menú no permitidas para cada rol
- Las rutas no autorizadas redirigen a página 403 (Acceso Denegado)
- Los botones de acciones no permitidas no se muestran

### CA-3: Restricción en Backend
- Todos los endpoints validan el rol del usuario
- Si un usuario intenta acceder a recurso no autorizado, devuelve HTTP 403
- Respuesta JSON: `{"error": "No tienes permisos para realizar esta acción"}`
- Logs de seguridad registran intentos de acceso no autorizado

### CA-4: Validación de Token JWT
- El token JWT incluye el rol del usuario en el payload
- Middleware de autenticación verifica rol antes de procesar petición
- Token expirado o inválido devuelve HTTP 401 (No autorizado)

### CA-5: Menú Dinámico
El menú de navegación se adapta según el rol:

**Admin ve:**
- Dashboard General
- Productos
- Inventario
- Pedidos
- Clientes
- Proveedores
- Reportes
- Usuarios

**Gerente de Almacén ve:**
- Dashboard Inventario
- Productos
- Inventario
- Proveedores
- Reportes (solo inventario)

**Personal de Ventas ve:**
- Dashboard Ventas
- Pedidos
- Clientes
- Productos (consulta)
- Reportes (solo ventas)

### CA-6: Página de Error 403
- Diseño claro indicando acceso denegado
- Mensaje: "No tienes permisos para acceder a esta página"
- Botón para regresar al dashboard
- No muestra información sensible del recurso protegido

## Notas Técnicas
- Middleware de autorización en Flask: `@require_role(['admin', 'manager'])`
- Guards de ruta en frontend (React Router / Vue Router)
- Decoradores personalizados para endpoints protegidos
- Cachear permisos en frontend para performance
- Considerar permisos granulares en el futuro (tabla de permisos)

## Definición de Hecho
- [x] Backend: Middleware de autorización implementado
- [x] Backend: Decoradores de rol en endpoints críticos
- [x] Frontend: Guards de ruta configurados
- [x] Frontend: Menú dinámico según rol
- [x] Frontend: Página 403 implementada
- [x] Token JWT incluye información de rol
- [x] Validación de permisos en todas las operaciones CRUD
- [x] Logs de seguridad para accesos denegados
- [ ] Pruebas de todos los escenarios de roles (testing opcional en v1.0)
- [x] Documentación de permisos por rol

## Dependencias
- US-AUTH-001 (Registro con roles)
- US-AUTH-002 (Login con JWT)
- Sistema de routing configurado

## Tags
`authentication`, `authorization`, `security`, `rbac`, `high-priority`
