# US-AUTH-002: Inicio de Sesión

## Historia de Usuario
**Como** usuario registrado,
**quiero** poder iniciar sesión con mi email y contraseña,
**para** acceder a las funcionalidades del sistema según mi rol.

## Prioridad
**Alta**

## Estimación
3 Story Points

## Criterios de Aceptación

### CA-1: Formulario de Login ✅
- [x] El formulario incluye campos de email y contraseña
- [x] Existe un botón "Iniciar Sesión"
- [x] Existe enlace "¿Olvidaste tu contraseña?"
- [x] Diseño limpio y profesional

### CA-2: Validación de Credenciales ✅
- [x] El sistema valida credenciales contra la base de datos
- [x] Se compara el hash de la contraseña ingresada con el almacenado
- [x] Si las credenciales son correctas, genera token JWT

### CA-3: Login Exitoso ✅
- [x] Si las credenciales son correctas, redirige al dashboard correspondiente según rol
- [x] Se almacena el token JWT en localStorage/sessionStorage
- [x] Se muestra mensaje de bienvenida con el nombre del usuario

### CA-4: Login Fallido ✅
- [x] Si las credenciales son incorrectas, muestra mensaje: "Email o contraseña incorrectos"
- [x] No especificar cuál campo es incorrecto (seguridad)
- [x] El usuario permanece en la página de login
- [x] Máximo 5 intentos fallidos antes de bloqueo temporal (15 minutos)

### CA-5: Persistencia de Sesión ✅
- [x] La sesión se mantiene activa hasta que el usuario cierre sesión
- [x] Si cierra el navegador, puede optar por mantener sesión (checkbox "Recordarme")
- [x] Token JWT válido por 24 horas (30 días con "Recordarme")

### CA-6: Redirección por Rol ✅
- [x] Admin → Dashboard completo
- [x] Gerente de Almacén → Dashboard de inventario
- [x] Personal de Ventas → Dashboard de ventas

## Notas Técnicas
- Token JWT con expiración de 24 horas
- Refresh token para renovar sesión sin re-login
- HTTPS requerido en producción
- Rate limiting en endpoint de login (máx 10 intentos por minuto por IP)

## Definición de Hecho
- [x] Frontend: Página de login implementada
- [x] Backend: API endpoint POST /api/auth/login creado
- [x] Generación de JWT token implementada
- [x] Validación de credenciales funcional
- [x] Redirección por roles implementada
- [x] Sistema de bloqueo por intentos fallidos
- [ ] Pruebas de seguridad realizadas
- [ ] Documentación de API actualizada

## Dependencias
- US-AUTH-001 (Registro de Usuario) debe estar completo
- Configuración de JWT en el backend

## Tags
`authentication`, `login`, `security`, `high-priority`
