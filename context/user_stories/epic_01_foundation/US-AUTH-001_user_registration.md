# US-AUTH-001: Registro de Usuario

## Historia de Usuario
**Como** administrador,
**quiero** poder registrar nuevos usuarios en el sistema,
**para** otorgarles acceso según su rol (Admin, Gerente de Almacén, Personal de Ventas).

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Formulario de Registro
- El formulario de registro incluye: nombre completo, email, contraseña, rol
- Todos los campos son obligatorios
- El campo rol es un selector con las opciones: Admin, Gerente de Almacén, Personal de Ventas

### CA-2: Validación de Contraseña
- La contraseña debe tener mínimo 8 caracteres
- Debe contener al menos: una mayúscula, una minúscula, un número
- Se muestra indicador de fortaleza de contraseña en tiempo real

### CA-3: Validación de Email
- El email debe ser único en el sistema
- Se valida formato de email (nombre@dominio.ext)
- Si el email ya existe, muestra mensaje: "Este email ya está registrado"

### CA-4: Confirmación de Registro
- Al registrar exitosamente, muestra mensaje: "Usuario registrado correctamente"
- Redirige a la lista de usuarios
- El nuevo usuario aparece en la lista

### CA-5: Manejo de Errores
- Se muestran mensajes de error claros junto a cada campo con problema
- Los errores de validación se muestran en tiempo real
- Si falla el registro, el usuario permanece en el formulario con datos precargados

## Notas Técnicas
- Hash de contraseña con bcrypt antes de guardar en BD
- Validación tanto en frontend como backend
- Token JWT generado automáticamente al crear usuario (para futuros auto-logins)

## Definición de Hecho
- [x] Frontend: Formulario de registro implementado
- [x] Backend: API endpoint POST /api/users creado
- [x] Base de datos: Tabla users con campos necesarios
- [x] Validaciones implementadas en frontend y backend
- [x] Contraseñas hasheadas correctamente
- [x] Pruebas unitarias escritas y pasando
- [x] Documentación de API actualizada

## Dependencias
- Configuración de base de datos PostgreSQL
- Configuración de Flask y modelos base

## Tags
`authentication`, `user-management`, `high-priority`
