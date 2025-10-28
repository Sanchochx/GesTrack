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
- [x] Frontend: Página "olvidé mi contraseña" **[COMPLETADO]**
- [x] Frontend: Página de establecer nueva contraseña **[COMPLETADO]**
- [x] Backend: API POST /api/auth/forgot-password
- [x] Backend: API POST /api/auth/reset-password
- [x] Base de datos: Tabla password_reset_tokens
- [x] Servicio de email configurado y funcional
- [x] Templates de email diseñados
- [x] Generación y validación de tokens
- [x] Expiración de tokens (1 hora)
- [ ] Rate limiting implementado **[OPCIONAL v1.0]**
- [x] Pruebas del flujo completo **[COMPLETADO]**
- [x] Documentación de API

## 📝 Estado de Implementación

### ✅ Completado (Backend - 100%)

**Archivos creados/modificados:**
1. `backend/app/models/password_reset_token.py` - Modelo de tokens con:
   - Generación segura de tokens (secrets.token_urlsafe)
   - Hash SHA256 para almacenamiento
   - Expiración automática (1 hora)
   - Validación de tokens
   - Métodos de búsqueda y limpieza

2. `backend/migrations/versions/705507412712_*.py` - Migración aplicada
   - Tabla password_reset_tokens creada
   - Índices en token_hash y user_id
   - Foreign key a users con CASCADE

3. `backend/app/services/email_service.py` - Servicio de email con:
   - Templates HTML profesionales
   - Email de recuperación de contraseña (CA-4)
   - Email de confirmación de cambio (CA-9)
   - Configuración SMTP via env variables

4. `backend/app/services/auth_service.py` - Métodos agregados:
   - `request_password_reset()` - CA-2, CA-3, CA-4, CA-5
   - `reset_password_with_token()` - CA-6, CA-7, CA-8, CA-9

5. `backend/app/routes/auth.py` - Endpoints agregados:
   - `POST /api/auth/forgot-password` - Solicita reset
   - `POST /api/auth/reset-password` - Resetea contraseña

6. `frontend/src/services/authService.js` - Métodos agregados:
   - `requestPasswordReset(email)`
   - `resetPassword(token, newPassword, confirmPassword)`

**Criterios de Aceptación Backend:**
- [x] CA-3: Validación de email sin revelar existencia (seguridad)
- [x] CA-4: Email con template profesional HTML
- [x] CA-5: Token seguro, hasheado, con expiración 1h
- [x] CA-6: Validación de contraseña (mínimo 8 chars, complejidad)
- [x] CA-7: Manejo de token inválido/expirado con mensajes claros
- [x] CA-8: Invalidación de token al cambiar contraseña
- [x] CA-9: Email de notificación de cambio de contraseña

### ✅ Completado (Frontend - 100%)

**Archivos creados:**
1. ✅ `frontend/src/pages/Auth/ForgotPassword.jsx` - Página con formulario
   - Input de email con validación
   - Botón "Enviar enlace de recuperación"
   - Mensaje informativo
   - Manejo de respuesta exitosa (CA-3)

2. ✅ `frontend/src/pages/Auth/ResetPassword.jsx` - Página de nueva contraseña
   - Extrae token de URL params usando `useSearchParams()`
   - Formulario con nueva contraseña y confirmación
   - Validación de fortaleza de contraseña con indicador visual
   - Manejo de token inválido/expirado (CA-7)
   - Redirección a login después de éxito con countdown (CA-8)

3. ✅ `frontend/src/App.jsx` - Rutas agregadas:
   ```jsx
   <Route path="/forgot-password" element={<ForgotPassword />} />
   <Route path="/reset-password" element={<ResetPassword />} />
   ```

4. ✅ `frontend/src/components/forms/LoginForm.jsx` - Link actualizado:
   - Enlace "¿Olvidaste tu contraseña?" visible (CA-1)
   - Navega a /forgot-password usando React Router (no recarga la página)
   - También actualizado link de registro

**Criterios de Aceptación Frontend:**
- [x] CA-1: Enlace "¿Olvidaste tu contraseña?" en login
- [x] CA-2: Página de solicitud de recuperación
- [x] CA-6: Formulario de nueva contraseña con validaciones
- [x] CA-7: Manejo de errores en UI
- [x] CA-8: Mensaje de éxito y redirección

### 🔧 Configuración Requerida

Para usar en producción, configurar variables de entorno en `backend/.env`:
```bash
# Email Service (usar MailHog en desarrollo)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_USE_TLS=false
FROM_EMAIL=noreply@gestrack.com
FROM_NAME=GesTrack

# Frontend URL para links en emails
FRONTEND_URL=http://localhost:5173
```

### 🎉 Estado Final

**US-AUTH-006 COMPLETADA** - Funcionalidad de recuperación de contraseña 100% implementada.

**Flujo completo:**
1. Usuario hace clic en "¿Olvidaste tu contraseña?" en login
2. Ingresa su email en ForgotPassword
3. Recibe email con link de recuperación (válido 1 hora)
4. Hace clic en el link → ResetPassword con token en URL
5. Ingresa nueva contraseña (con indicador de fortaleza)
6. Contraseña actualizada exitosamente
7. Redirección automática a login después de 3 segundos
8. Recibe email de confirmación de cambio

## Dependencias
- US-AUTH-002 (Login) debe estar completo
- Configuración de servicio de email (SMTP)
- Base de datos configurada

## Tags
`authentication`, `password-recovery`, `email`, `security`, `medium-priority`
