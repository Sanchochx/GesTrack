# Historias de Usuario - Autenticación

## US-AUTH-001: Registro de Usuario
**Como** administrador,
**quiero** poder registrar nuevos usuarios en el sistema,
**para** otorgarles acceso según su rol (Admin, Gerente de Almacén, Personal de Ventas).

### Criterios de Aceptación:
- El formulario de registro incluye: nombre completo, email, contraseña, rol
- La contraseña debe tener mínimo 8 caracteres
- El email debe ser único en el sistema
- El sistema valida formato de email
- Se muestra mensaje de confirmación al registrar exitosamente
- Se muestran mensajes de error claros si fallan las validaciones

**Prioridad:** Alta

---

## US-AUTH-002: Inicio de Sesión
**Como** usuario registrado,
**quiero** poder iniciar sesión con mi email y contraseña,
**para** acceder a las funcionalidades del sistema según mi rol.

### Criterios de Aceptación:
- El formulario incluye campos de email y contraseña
- El sistema valida credenciales contra la base de datos
- Si las credenciales son correctas, redirige al dashboard
- Si son incorrectas, muestra mensaje de error
- La sesión se mantiene activa hasta que el usuario cierre sesión
- Se genera y almacena token de autenticación

**Prioridad:** Alta

---

## US-AUTH-003: Cierre de Sesión
**Como** usuario autenticado,
**quiero** poder cerrar sesión de forma segura,
**para** proteger mi cuenta cuando no esté usando el sistema.

### Criterios de Aceptación:
- Existe un botón visible de "Cerrar Sesión" en la interfaz
- Al hacer clic, se invalida el token de sesión
- El usuario es redirigido a la página de inicio de sesión
- No se puede acceder a páginas protegidas después de cerrar sesión

**Prioridad:** Alta

---

## US-AUTH-004: Gestión de Perfil de Usuario
**Como** usuario autenticado,
**quiero** poder ver y editar mi información de perfil,
**para** mantener mis datos actualizados.

### Criterios de Aceptación:
- Se puede acceder a la página de perfil desde el menú de usuario
- Se muestran: nombre, email, rol (solo lectura)
- Se puede editar: nombre, email, contraseña (opcional)
- Para cambiar la contraseña se requiere la contraseña actual
- Se validan los datos antes de guardar
- Se muestra mensaje de confirmación al actualizar exitosamente

**Prioridad:** Media

---

## US-AUTH-005: Control de Acceso por Roles
**Como** sistema,
**quiero** restringir el acceso a funcionalidades según el rol del usuario,
**para** garantizar la seguridad y control de la información.

### Criterios de Aceptación:
- Admin tiene acceso completo a todos los módulos
- Gerente de Almacén solo accede a: Productos, Inventario, Proveedores, Reportes de Inventario
- Personal de Ventas solo accede a: Pedidos, Clientes, Reportes de Ventas
- Se ocultan opciones de menú no permitidas para cada rol
- Si se intenta acceder a una ruta no autorizada, redirige a página de error 403
- Validación de permisos tanto en frontend como backend

**Prioridad:** Alta

---

## US-AUTH-006: Recuperación de Contraseña
**Como** usuario que olvidó su contraseña,
**quiero** poder recuperar el acceso a mi cuenta,
**para** poder seguir usando el sistema.

### Criterios de Aceptación:
- Existe un enlace "¿Olvidaste tu contraseña?" en la página de login
- Se solicita el email del usuario
- Se envía un correo con enlace de recuperación (válido por 1 hora)
- El enlace permite establecer una nueva contraseña
- Se valida que la nueva contraseña cumpla requisitos de seguridad
- Se muestra mensaje de confirmación al cambiar la contraseña exitosamente

**Prioridad:** Media
