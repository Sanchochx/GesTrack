# US-CUST-001: Registrar Nuevo Cliente

## Historia de Usuario
**Como** personal de ventas,
**quiero** registrar nuevos clientes en el sistema,
**para** mantener una base de datos de compradores.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Formulario de Registro
- Formulario accesible desde botón "+ Nuevo Cliente" en lista de clientes
- Título: "Registrar Nuevo Cliente"
- Diseño limpio y organizado en secciones

### CA-2: Información Personal
- **Nombre completo**: campo de texto (requerido, max 200 caracteres)
  - Validación: no vacío, solo letras y espacios
- **Email**: campo de email (requerido, max 100 caracteres)
  - Validación: formato válido de email (usuario@dominio.com)
  - Validación: único en el sistema (no duplicados)
  - Mensaje si ya existe: "Este email ya está registrado"
- **Teléfono principal**: campo de texto (requerido, formato variable según país)
  - Validación: solo números, guiones y paréntesis
  - Ejemplo: (555) 123-4567 o +52 123 456 7890
- **Teléfono secundario**: campo de texto (opcional)
  - Mismas validaciones que teléfono principal

### CA-3: Dirección Completa
- **Calle/Dirección**: campo de texto (requerido, max 300 caracteres)
  - Incluye número, calle, colonia, referencias
- **Ciudad**: campo de texto (requerido, max 100 caracteres)
- **Código Postal**: campo de texto (requerido, max 20 caracteres)
  - Validación: formato según país (ej: 5 dígitos en USA, 5 en México)
- **País**: dropdown o campo de texto (requerido)
  - Lista de países predefinida (opcional)
  - Por defecto: país de la empresa

### CA-4: Información Adicional
- **Notas**: área de texto (opcional, max 500 caracteres)
  - Placeholder: "Información adicional sobre el cliente..."
  - Útil para preferencias, observaciones, etc.

### CA-5: Validación de Email Único
- Al perder foco del campo email (onBlur), validar que no exista
- API call: `GET /api/customers/check-email?email=...`
- Si existe: mensaje de error "Este email ya está registrado"
- Sugerencia: "Ver cliente existente" (link al perfil)
- Indicador visual: ✓ (verde) si es válido, ✗ (rojo) si está en uso

### CA-6: Fecha de Registro Automática
- El sistema captura automáticamente la fecha/hora de registro
- Campo: `registered_at` (timestamp)
- No visible en formulario de creación
- Visible en perfil del cliente después de registrar

### CA-7: Estado Inicial
- Nuevo cliente se crea con estado "Activo" por defecto
- Campo: `is_active = true`
- Categoría inicial: "Regular" (se actualizará según compras)

### CA-8: Validaciones del Formulario
- Todos los campos requeridos deben estar completos
- Formato de email válido
- Teléfono con formato aceptable
- Código postal con formato correcto
- Validaciones en tiempo real (mientras se escribe)
- Mensaje de error específico junto a cada campo inválido
- Botón "Guardar" deshabilitado si hay errores

### CA-9: Guardado y Confirmación
- Botón "Guardar Cliente" al final del formulario
- Al guardar exitosamente:
  - Mensaje de confirmación: "Cliente [Nombre] registrado correctamente"
  - Opciones:
    - Redirigir al perfil del cliente recién creado
    - O volver a la lista de clientes
    - O botón "Registrar otro cliente"
- Si falla: mensaje de error claro y mantener datos en formulario

### CA-10: Cancelación
- Botón "Cancelar" cierra el formulario sin guardar
- Si hay datos ingresados: confirmación "¿Descartar cambios?"
- Vuelve a la lista de clientes o cierra el modal

## Notas Técnicas
- API endpoint: `POST /api/customers`
- Request body:
  ```json
  {
    "full_name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "555-1234",
    "secondary_phone": "555-5678",
    "address_street": "Calle Principal 123",
    "address_city": "Ciudad",
    "address_postal_code": "12345",
    "address_country": "México",
    "notes": "Cliente preferente"
  }
  ```
- Validaciones en backend:
  - Email único (constraint en base de datos)
  - Campos requeridos no vacíos
  - Formatos válidos
- Índice único en campo `email` para performance y unicidad
- Sanitizar inputs para prevenir XSS
- Considerar auto-completar dirección con API de geolocalización (futuro)
- Normalizar formato de teléfonos para consistencia

## Definición de Hecho
- [x] Frontend: Formulario de registro de cliente
- [x] Frontend: Validaciones en tiempo real
- [x] Frontend: Validación de email único con API
- [x] Frontend: Indicadores visuales de validación
- [x] Frontend: Manejo de estados (loading, error, success)
- [x] Frontend: Confirmación y redirección
- [x] Frontend: Modal o vista de confirmación de cancelación
- [x] Backend: API POST /api/customers
- [x] Backend: Validación de unicidad de email
- [x] Backend: Validación de campos requeridos y formatos
- [x] Backend: Sanitización de inputs
- [x] Base de datos: Tabla customers creada
- [x] Base de datos: Índice único en email
- [x] Base de datos: Campos con tipos y constraints apropiados
- [ ] Pruebas unitarias de validaciones
- [ ] Pruebas de creación exitosa
- [ ] Pruebas de email duplicado
- [ ] Pruebas de campos requeridos
- [ ] Documentación de API

## Dependencias
- Epic 01 (Authentication) para sistema de usuarios
- Base de datos configurada

## Tags
`customers`, `crud`, `create`, `high-priority`
