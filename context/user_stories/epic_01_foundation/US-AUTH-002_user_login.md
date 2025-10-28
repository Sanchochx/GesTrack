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

### CA-1: Formulario de Login
- El formulario incluye campos de email y contraseña
- Existe un botón "Iniciar Sesión"
- Existe enlace "¿Olvidaste tu contraseña?"
- Diseño limpio y profesional

### CA-2: Validación de Credenciales
- El sistema valida credenciales contra la base de datos
- Se compara el hash de la contraseña ingresada con el almacenado
- Si las credenciales son correctas, genera token JWT

### CA-3: Login Exitoso
- Si las credenciales son correctas, redirige al dashboard correspondiente según rol
- Se almacena el token JWT en localStorage/sessionStorage
- Se muestra mensaje de bienvenida con el nombre del usuario

### CA-4: Login Fallido
- Si las credenciales son incorrectas, muestra mensaje: "Email o contraseña incorrectos"
- No especificar cuál campo es incorrecto (seguridad)
- El usuario permanece en la página de login
- Máximo 5 intentos fallidos antes de bloqueo temporal (15 minutos)

### CA-5: Persistencia de Sesión
- La sesión se mantiene activa hasta que el usuario cierre sesión
- Si cierra el navegador, puede optar por mantener sesión (checkbox "Recordarme")
- Token JWT válido por 24 horas

### CA-6: Redirección por Rol
- Admin → Dashboard completo
- Gerente de Almacén → Dashboard de inventario
- Personal de Ventas → Dashboard de ventas

## Notas Técnicas
- Token JWT con expiración de 24 horas
- Refresh token para renovar sesión sin re-login
- HTTPS requerido en producción
- Rate limiting en endpoint de login (máx 10 intentos por minuto por IP)

## Definición de Hecho
- [ ] Frontend: Página de login implementada
- [ ] Backend: API endpoint POST /api/auth/login creado
- [ ] Generación de JWT token implementada
- [ ] Validación de credenciales funcional
- [ ] Redirección por roles implementada
- [ ] Sistema de bloqueo por intentos fallidos
- [ ] Pruebas de seguridad realizadas
- [ ] Documentación de API actualizada

## Dependencias
- US-AUTH-001 (Registro de Usuario) debe estar completo
- Configuración de JWT en el backend

## Tags
`authentication`, `login`, `security`, `high-priority`
