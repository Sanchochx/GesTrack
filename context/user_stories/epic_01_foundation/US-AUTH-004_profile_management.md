# US-AUTH-004: Gestión de Perfil de Usuario

## Historia de Usuario
**Como** usuario autenticado,
**quiero** poder ver y editar mi información de perfil,
**para** mantener mis datos actualizados.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Acceso al Perfil
- Se puede acceder a la página de perfil desde el menú de usuario (dropdown en navbar)
- Opción claramente etiquetada como "Mi Perfil" o "Configuración"

### CA-2: Visualización de Información
- Se muestran los siguientes campos:
  - Nombre completo (editable)
  - Email (editable)
  - Rol (solo lectura, con badge visual)
  - Fecha de registro (solo lectura)
- Diseño limpio con labels claros

### CA-3: Edición de Nombre
- Campo de texto editable para nombre completo
- Validación: mínimo 3 caracteres, máximo 100
- Se muestra estado de "guardando..." mientras se actualiza

### CA-4: Edición de Email
- Campo de texto editable para email
- Validación de formato de email
- Si se cambia el email, se valida que no esté en uso por otro usuario
- Mensaje de error si email ya existe: "Este email ya está registrado"

### CA-5: Cambio de Contraseña
- Sección separada con título "Cambiar Contraseña"
- Campos requeridos:
  - Contraseña actual (para verificación)
  - Nueva contraseña
  - Confirmar nueva contraseña
- Validaciones:
  - Contraseña actual debe ser correcta
  - Nueva contraseña debe cumplir requisitos (min 8 caracteres, mayúscula, minúscula, número)
  - Nueva contraseña y confirmación deben coincidir
  - Nueva contraseña debe ser diferente a la actual

### CA-6: Guardado de Cambios
- Botón "Guardar Cambios" claramente visible
- Al guardar exitosamente, muestra mensaje: "Perfil actualizado correctamente"
- Si hay error, muestra mensaje específico del error
- Botón "Cancelar" que descarta cambios y recarga datos originales

### CA-7: Validación en Tiempo Real
- Validaciones de formato se ejecutan mientras el usuario escribe (debounce)
- Indicadores visuales de campos válidos/inválidos (borde verde/rojo)
- Mensajes de error claros bajo cada campo

## Notas Técnicas
- Actualización de datos mediante PATCH /api/users/:id
- Cambio de contraseña en endpoint separado: PUT /api/users/:id/password
- Verificar contraseña actual antes de permitir cambio
- Re-hashear nueva contraseña con bcrypt
- Considerar revalidación de token JWT si se cambia email

## Definición de Hecho
- [x] Frontend: Página de perfil implementada
- [x] Backend: API endpoint PATCH /api/users/:id
- [x] Backend: API endpoint PUT /api/users/:id/password
- [x] Validaciones de frontend implementadas
- [x] Validaciones de backend implementadas
- [x] Verificación de contraseña actual funcional
- [x] UI responsive y amigable
- [x] Pruebas unitarias y de integración (opcional para v1.0)
- [x] Documentación de API actualizada

## Dependencias
- US-AUTH-002 (Inicio de Sesión) debe estar completo
- Usuario debe estar autenticado

## Tags
`authentication`, `profile`, `user-management`, `medium-priority`
