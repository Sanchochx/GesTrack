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

### [x] CA-1: Acceso a Edición
- [x] Botón "Editar" en perfil del cliente (US-CUST-004)
- [x] Icono de lápiz o texto "Editar información"
- [x] Al hacer click, carga formulario de edición
- [x] Página separada /customers/:id/edit

### [x] CA-2: Formulario Pre-llenado
- [x] Todos los campos se cargan con los valores actuales del cliente
- [x] Mismo diseño que formulario de creación (US-CUST-001)
- [x] Título: "Editar Cliente: [Nombre]"
- [x] Campos en el mismo orden y con las mismas validaciones

### [x] CA-3: Campos Editables
- [x] Todos los campos del cliente pueden editarse:
  - [x] Nombre completo
  - [x] Email
  - [x] Teléfono principal
  - [x] Teléfono secundario
  - [x] Calle/Dirección
  - [x] Ciudad
  - [x] Código Postal
  - [x] País
  - [x] Notas
- [x] Mismas validaciones que en creación

### [x] CA-4: Validación de Email Único (Modificado)
- [x] Si se cambia el email, validar que no esté en uso
- [x] Excepción: si el email es el mismo que ya tenía (no cambió)
- [x] Si el nuevo email ya existe: error "Este email ya está registrado por otro cliente"
- [x] API: `GET /api/customers/check-email?email=nuevo@mail.com&exclude_id={customer_id}`
- [x] Indicador visual de validación en tiempo real

### [x] CA-5: Validaciones en Tiempo Real
- [x] Todas las validaciones del formulario de creación aplican:
  - [x] Formato de email
  - [x] Formato de teléfono
  - [x] Campos requeridos
  - [x] Longitud máxima de campos
- [x] Mensajes de error junto a cada campo
- [x] Botón "Guardar" deshabilitado si hay errores

### [x] CA-6: Detección de Cambios
- [x] El sistema detecta si hubo cambios en los datos
- [x] Si no hay cambios: mensaje "No hay cambios para guardar"
- [x] Ayuda a evitar requests innecesarios

### [x] CA-7: Registro de Última Actualización
- [x] Al guardar, se actualiza campo `updated_at` con timestamp actual
- [ ] Se registra qué usuario realizó la modificación (auditoría) - diferido v2.0
- [ ] Opcional: registrar qué campos específicos cambiaron (changelog) - diferido v2.0
- [x] Visible en sección de historial del perfil (updated_at)

### [x] CA-8: Confirmación de Guardado
- [x] Al guardar exitosamente:
  - [x] Mensaje de confirmación: "Información del cliente actualizada correctamente"
  - [x] Cierra el formulario/modal
  - [x] Vuelve a vista de perfil con datos actualizados
- [x] Si falla: mensaje de error claro y mantener datos en formulario

### [x] CA-9: Cancelación
- [x] Botón "Cancelar" cierra el formulario sin guardar
- [x] Si hay cambios no guardados: confirmación "¿Descartar cambios?"
- [x] Vuelve a vista de perfil sin modificar datos

### [x] CA-10: Restricciones de Edición
- [x] Solo usuarios con permisos pueden editar:
  - [x] Personal de Ventas: puede editar todos los clientes
  - [x] Admin: puede editar todos los clientes
  - [x] Gerente de Almacén: puede editar todos los clientes
- [x] No se puede cambiar fecha de registro (campo de solo lectura)
- [x] No se puede cambiar categoría del cliente manualmente (se calcula automáticamente)

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
- [x] Frontend: Formulario de edición de cliente (EditCustomer.jsx)
- [x] Frontend: Pre-llenado de campos con datos actuales
- [x] Frontend: Validaciones en tiempo real
- [x] Frontend: Validación de email único (excluyendo propio con exclude_id)
- [x] Frontend: Detección de cambios (hasChanges() en CustomerForm)
- [x] Frontend: Confirmación de guardado (Snackbar + navegación)
- [x] Frontend: Modal de confirmación de cancelación (si hay cambios)
- [x] Backend: API PUT /api/customers/{id}
- [x] Backend: Validación de unicidad de email (excluyendo propio)
- [x] Backend: Validación de campos requeridos y formatos
- [x] Backend: Actualización de updated_at automática
- [ ] Backend: Registro de usuario que modificó (diferido v2.0)
- [ ] Backend: Opcional: versionado optimista (diferido v2.0)
- [x] Backend: Sanitización de inputs (.strip(), .lower())
- [ ] Pruebas de edición exitosa (diferido)
- [ ] Pruebas de validación de email duplicado (diferido)
- [ ] Pruebas de campos requeridos (diferido)
- [ ] Pruebas de detección de conflictos (opcional, diferido)
- [x] Documentación de API (docstrings en routes/customers.py)

## Dependencias
- US-CUST-001 (Registrar Cliente) - mismas validaciones
- US-CUST-004 (Ver Perfil) - acceso desde perfil

## Tags
`customers`, `crud`, `edit`, `medium-priority`
