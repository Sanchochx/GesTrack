# GesTrack API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
La API utiliza JWT (JSON Web Tokens) para autenticación. El token debe enviarse en el header `Authorization` con el formato:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Registro de Usuario

Registra un nuevo usuario en el sistema.

**Endpoint:** `POST /auth/register`

**Body Parameters:**
```json
{
  "full_name": "string (requerido, máx 100 caracteres)",
  "email": "string (requerido, formato email válido, único)",
  "password": "string (requerido, mín 8 caracteres, debe contener mayúscula, minúscula y número)",
  "role": "string (requerido, opciones: 'Admin', 'Gerente de Almacén', 'Personal de Ventas')"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Usuario registrado correctamente",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "full_name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "role": "Admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
}
```

**Error Responses:**

400 Bad Request - Errores de validación:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Errores de validación",
    "details": {
      "email": ["Este email ya está registrado"],
      "password": ["La contraseña debe tener mínimo 8 caracteres"]
    }
  }
}
```

**Criterios de Contraseña:**
- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos una letra minúscula
- Al menos un número

---

### 2. Login de Usuario

Autentica un usuario y devuelve un token JWT.

**Endpoint:** `POST /auth/login`

**Body Parameters:**
```json
{
  "email": "string (requerido)",
  "password": "string (requerido)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "full_name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "role": "Admin",
    "is_active": true
  }
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Credenciales inválidas"
  }
}
```

---

### 3. Listar Usuarios

Obtiene la lista de todos los usuarios registrados.

**Endpoint:** `GET /auth/users`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "full_name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "role": "Admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  },
  {
    "id": "uuid",
    "full_name": "María García",
    "email": "maria.garcia@example.com",
    "role": "Gerente de Almacén",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

**Error Responses:**

401 Unauthorized - Token inválido o expirado:
```json
{
  "msg": "Token has expired"
}
```

---

## Roles de Usuario

El sistema soporta tres roles:

1. **Admin**: Administrador del sistema con acceso completo
2. **Gerente de Almacén**: Gestión de inventario y almacenes
3. **Personal de Ventas**: Gestión de ventas y clientes

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200    | Operación exitosa |
| 201    | Recurso creado exitosamente |
| 400    | Error de validación o solicitud incorrecta |
| 401    | No autorizado (token inválido o expirado) |
| 404    | Recurso no encontrado |
| 500    | Error interno del servidor |

---

## Notas de Implementación

### US-AUTH-001: Registro de Usuario

**Criterios de Aceptación Implementados:**

- **CA-1**: Formulario de registro con campos: nombre completo, email, contraseña, rol
- **CA-2**: Validación de contraseña con indicador de fortaleza (mínimo 8 caracteres, mayúscula, minúscula, número)
- **CA-3**: Validación de email único en el sistema
- **CA-4**: Mensaje de confirmación al registrar exitosamente
- **CA-5**: Mensajes de error claros y específicos por campo

### Seguridad

- Las contraseñas se almacenan hasheadas usando bcrypt (factor de trabajo: 12)
- Los tokens JWT expiran después de 24 horas
- El sistema valida el formato de email usando la librería `email-validator`
- CORS configurado para permitir peticiones desde el frontend (http://localhost:5173)

### Base de Datos

- Motor: SQLite (desarrollo) / PostgreSQL (producción)
- ORM: SQLAlchemy 3.1.1
- Migraciones: Flask-Migrate 4.0.5

---

## Ejemplos de Uso

### Registro de Usuario con curl

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "password": "Secure123",
    "role": "Admin"
  }'
```

### Login con curl

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@example.com",
    "password": "Secure123"
  }'
```

### Obtener Lista de Usuarios con curl

```bash
curl -X GET http://localhost:5000/api/auth/users \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

---

## Estado de Implementación

**Versión:** 1.0.0
**Fecha:** Octubre 2024
**Historia de Usuario:** US-AUTH-001 (Registro de Usuario) - ✅ Completada

**Próximas Implementaciones:**
- US-AUTH-002: Login de Usuario (parcialmente implementado)
- US-AUTH-003: Logout de Usuario
- US-AUTH-004: Gestión de Perfil
- US-AUTH-005: Control de Acceso Basado en Roles (RBAC)
- US-AUTH-006: Recuperación de Contraseña
