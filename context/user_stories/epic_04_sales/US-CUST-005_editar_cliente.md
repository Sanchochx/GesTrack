# US-CUST-005: Editar Información del Cliente

## Historia de Usuario
**Como** personal de ventas,
**quiero** actualizar la información de contacto de un cliente,
**para** mantener los datos actualizados.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Acceso a Edición
- Botón "Editar" en perfil del cliente (US-CUST-004)
- Icono de lápiz o texto "Editar información"
- Al hacer click, carga formulario de edición
- Puede ser modal, página separada, o edición inline

### CA-2: Formulario Pre-llenado
- Todos los campos se cargan con los valores actuales del cliente
- Mismo diseño que formulario de creación (US-CUST-001)
- Título: "Editar Cliente: [Nombre]"
- Campos en el mismo orden y con las mismas validaciones

### CA-3: Campos Editables
- Todos los campos del cliente pueden editarse:
  - Nombre completo
  - Email
  - Teléfono principal
  - Teléfono secundario
  - Calle/Dirección
  - Ciudad
  - Código Postal
  - País
  - Notas
- Mismas validaciones que en creación

### CA-4: Validación de Email Único (Modificado)
- Si se cambia el email, validar que no esté en uso
- Excepción: si el email es el mismo que ya tenía (no cambió)
- Si el nuevo email ya existe: error "Este email ya está registrado por otro cliente"
- API: `GET /api/customers/check-email?email=nuevo@mail.com&exclude_id={customer_id}`
- Indicador visual de validación en tiempo real

### CA-5: Validaciones en Tiempo Real
- Todas las validaciones del formulario de creación aplican:
  - Formato de email
  - Formato de teléfono
  - Campos requeridos
  - Longitud máxima de campos
- Mensajes de error junto a cada campo
- Botón "Guardar" deshabilitado si hay errores

### CA-6: Detección de Cambios
- El sistema detecta si hubo cambios en los datos
- Si no hay cambios: mensaje "No hay cambios para guardar"
- Opcional: deshabilitar botón "Guardar" si no hay cambios
- Ayuda a evitar requests innecesarios

### CA-7: Registro de Última Actualización
- Al guardar, se actualiza campo `updated_at` con timestamp actual
- Se registra qué usuario realizó la modificación (auditoría)
- Opcional: registrar qué campos específicos cambiaron (changelog)
- Visible en sección de historial del perfil

### CA-8: Confirmación de Guardado
- Al guardar exitosamente:
  - Mensaje de confirmación: "Información del cliente actualizada correctamente"
  - Cierra el formulario/modal
  - Vuelve a vista de perfil con datos actualizados
- Si falla: mensaje de error claro y mantener datos en formulario

### CA-9: Cancelación
- Botón "Cancelar" cierra el formulario sin guardar
- Si hay cambios no guardados: confirmación "¿Descartar cambios?"
- Vuelve a vista de perfil sin modificar datos

### CA-10: Restricciones de Edición
- Solo usuarios con permisos pueden editar:
  - Personal de Ventas: puede editar todos los clientes
  - Admin: puede editar todos los clientes
- No se puede cambiar fecha de registro (campo de solo lectura)
- No se puede cambiar categoría del cliente manualmente (se calcula automáticamente)

## Notas Técnicas
- API endpoint: `PUT /api/customers/{id}` o `PATCH /api/customers/{id}`
  - PUT: reemplaza todos los campos
  - PATCH: actualiza solo campos enviados (preferible)
- Request body: similar a creación
  ```json
  {
    "full_name": "Juan Pérez",
    "email": "nuevo@example.com",
    "phone": "555-9999",
    ...
  }
  ```
- Validaciones en backend:
  - Email único (excluyendo el propio cliente)
  - Campos requeridos
  - Formatos válidos
- Actualizar timestamp `updated_at` automáticamente
- Considerar versionado optimista:
  - Enviar `updated_at` original en request
  - Validar que no cambió (otro usuario no editó simultáneamente)
  - Si cambió: error de conflicto (409)
- Sanitizar inputs para prevenir XSS
- Log de auditoría de cambios (qué cambió, quién, cuándo)

## Definición de Hecho
- [ ] Frontend: Formulario de edición de cliente
- [ ] Frontend: Pre-llenado de campos con datos actuales
- [ ] Frontend: Validaciones en tiempo real
- [ ] Frontend: Validación de email único (excluyendo propio)
- [ ] Frontend: Detección de cambios
- [ ] Frontend: Confirmación de guardado
- [ ] Frontend: Modal de confirmación de cancelación (si hay cambios)
- [ ] Backend: API PUT/PATCH /api/customers/{id}
- [ ] Backend: Validación de unicidad de email (excluyendo propio)
- [ ] Backend: Validación de campos requeridos y formatos
- [ ] Backend: Actualización de updated_at
- [ ] Backend: Registro de usuario que modificó
- [ ] Backend: Opcional: versionado optimista
- [ ] Backend: Sanitización de inputs
- [ ] Pruebas de edición exitosa
- [ ] Pruebas de validación de email duplicado
- [ ] Pruebas de campos requeridos
- [ ] Pruebas de detección de conflictos (opcional)
- [ ] Documentación de API

## Dependencias
- US-CUST-001 (Registrar Cliente) - mismas validaciones
- US-CUST-004 (Ver Perfil) - acceso desde perfil

## Tags
`customers`, `crud`, `edit`, `medium-priority`
