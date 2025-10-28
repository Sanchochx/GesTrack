# US-AUTH-003: Cierre de Sesión

## Historia de Usuario
**Como** usuario autenticado,
**quiero** poder cerrar sesión de forma segura,
**para** proteger mi cuenta cuando no esté usando el sistema.

## Prioridad
**Alta**

## Estimación
2 Story Points

## Criterios de Aceptación

### CA-1: Botón de Cierre de Sesión
- Existe un botón visible de "Cerrar Sesión" en la barra de navegación
- El botón está accesible desde cualquier página del sistema
- Tiene icono reconocible (ej: puerta de salida, logout icon)

### CA-2: Invalidación de Sesión
- Al hacer clic en "Cerrar Sesión", se invalida el token JWT
- El token se elimina del almacenamiento local (localStorage/sessionStorage)
- Se limpia cualquier dato de sesión del frontend

### CA-3: Redirección
- El usuario es redirigido inmediatamente a la página de inicio de sesión
- Se muestra mensaje: "Has cerrado sesión correctamente"

### CA-4: Protección de Rutas
- No se puede acceder a páginas protegidas después de cerrar sesión
- Intentar acceder a una ruta protegida redirige a login
- Se muestra mensaje: "Debes iniciar sesión para acceder a esta página"

### CA-5: Confirmación (Opcional)
- Si hay cambios sin guardar, solicita confirmación antes de cerrar sesión
- Modal con mensaje: "Tienes cambios sin guardar. ¿Deseas cerrar sesión de todas formas?"
- Opciones: "Sí, cerrar sesión" / "Cancelar"

## Notas Técnicas
- Token añadido a blacklist en backend (si se implementa)
- Limpiar completamente localStorage/sessionStorage
- Axios/Fetch interceptors actualizados para eliminar token de headers
- Considerar logout desde múltiples pestañas/ventanas

## Definición de Hecho
- [ ] Frontend: Botón de logout en navbar
- [ ] Backend: API endpoint POST /api/auth/logout (opcional si JWT)
- [ ] Token eliminado de almacenamiento local
- [ ] Redirección a login implementada
- [ ] Protección de rutas funcionando
- [ ] Limpieza completa de estado de sesión
- [ ] Pruebas de flujo completo
- [ ] Documentación actualizada

## Dependencias
- US-AUTH-002 (Inicio de Sesión) debe estar completo
- Sistema de routing y guards de autenticación

## Tags
`authentication`, `logout`, `security`, `high-priority`
