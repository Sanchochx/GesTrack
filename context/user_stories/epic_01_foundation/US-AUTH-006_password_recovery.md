# US-AUTH-006: Recuperación de Contraseña

## Historia de Usuario
**Como** usuario que olvidó su contraseña,
**quiero** poder recuperar el acceso a mi cuenta,
**para** poder seguir usando el sistema.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Enlace en Login
- Existe un enlace "¿Olvidaste tu contraseña?" en la página de login
- El enlace es claramente visible
- Redirige a página de recuperación

### CA-2: Solicitud de Recuperación
- Página con formulario que solicita el email del usuario
- Campo de email con validación de formato
- Botón "Enviar enlace de recuperación"
- Mensaje informativo: "Te enviaremos un email con instrucciones para recuperar tu contraseña"

### CA-3: Validación de Email
- Si el email existe en el sistema, se envía el correo de recuperación
- Si el email NO existe, por seguridad muestra el mismo mensaje de éxito
- Mensaje: "Si el email está registrado, recibirás instrucciones para recuperar tu contraseña"
- Esto evita enumeration attacks

### CA-4: Email de Recuperación
- El email contiene:
  - Asunto: "Recuperación de contraseña - GesTrack"
  - Saludo personalizado con nombre del usuario
  - Enlace con token único de recuperación
  - Validez del enlace (1 hora)
  - Instrucciones claras
  - Nota de seguridad: "Si no solicitaste esto, ignora este email"
- Diseño profesional del email (HTML template)

### CA-5: Token de Recuperación
- El token es único, aleatorio y seguro (UUID o similar)
- Se almacena en base de datos vinculado al usuario
- Tiene fecha de expiración (1 hora desde generación)
- Solo puede usarse una vez
- Se invalida al establecer nueva contraseña

### CA-6: Página de Nueva Contraseña
- El enlace del email redirige a página de establecer nueva contraseña
- Si el token es válido, muestra formulario:
  - Nueva contraseña
  - Confirmar nueva contraseña
- Validaciones:
  - Mínimo 8 caracteres
  - Debe contener mayúscula, minúscula, número
  - Ambos campos deben coincidir
- Indicador de fortaleza de contraseña

### CA-7: Token Inválido o Expirado
- Si el token expiró (>1 hora), muestra mensaje: "Este enlace ha expirado. Solicita uno nuevo"
- Si el token no existe o fue usado, muestra: "Enlace inválido o ya utilizado"
- Botón para regresar a solicitar nuevo enlace

### CA-8: Éxito al Cambiar Contraseña
- Al establecer nueva contraseña exitosamente:
  - Muestra mensaje: "Tu contraseña ha sido actualizada correctamente"
  - Se invalida el token de recuperación
  - Opción de iniciar sesión inmediatamente
  - Redirige a login después de 3 segundos

### CA-9: Notificación de Cambio
- Enviar email de confirmación al usuario notificando el cambio de contraseña
- Incluir fecha/hora del cambio
- Nota de seguridad: "Si no fuiste tú, contacta al administrador"

## Notas Técnicas
- Token generado con `secrets.token_urlsafe()` o similar
- Tabla `password_reset_tokens` en base de datos con:
  - user_id
  - token (hasheado)
  - created_at
  - expires_at
  - used (boolean)
- Servicio de email: configurar SMTP (Gmail, SendGrid, etc.)
- Rate limiting en solicitud de recuperación (máx 3 por hora por email)
- URL del enlace: `https://gestrack.com/reset-password?token={token}`

## Definición de Hecho
- [ ] Frontend: Página "olvidé mi contraseña"
- [ ] Frontend: Página de establecer nueva contraseña
- [ ] Backend: API POST /api/auth/forgot-password
- [ ] Backend: API POST /api/auth/reset-password
- [ ] Base de datos: Tabla password_reset_tokens
- [ ] Servicio de email configurado y funcional
- [ ] Templates de email diseñados
- [ ] Generación y validación de tokens
- [ ] Expiración de tokens (1 hora)
- [ ] Rate limiting implementado
- [ ] Pruebas del flujo completo
- [ ] Documentación de API

## Dependencias
- US-AUTH-002 (Login) debe estar completo
- Configuración de servicio de email (SMTP)
- Base de datos configurada

## Tags
`authentication`, `password-recovery`, `email`, `security`, `medium-priority`
