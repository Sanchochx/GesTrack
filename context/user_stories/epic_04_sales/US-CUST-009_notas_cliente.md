# US-CUST-009: Notas sobre el Cliente

## Historia de Usuario
**Como** personal de ventas,
**quiero** agregar notas sobre preferencias o situaciones especiales del cliente,
**para** brindar mejor atención personalizada.

## Prioridad
**Baja**

## Estimación
5 Story Points

## Criterios de Aceptación
> **Estado:** ✅ TODOS COMPLETADOS (2026-02-20)

### CA-1: Agregar Nueva Nota ✅
- Botón "+ Agregar nota" en perfil del cliente
- Abre modal o área de texto expandible
- Título: "Nueva nota sobre [Nombre Cliente]"
- Campo de texto multilínea (textarea)
- Placeholder: "Ej: Prefiere entregas por la tarde, alérgico al látex, etc."
- Máximo 500 caracteres
- Contador de caracteres visible: "250/500"

### CA-2: Guardar Nota
- Botón "Guardar nota" al finalizar
- Al guardar, captura automáticamente:
  - Contenido de la nota
  - Fecha/hora de creación (timestamp)
  - Usuario que creó la nota
- La nota aparece inmediatamente en la lista
- Modal se cierra automáticamente
- Mensaje de confirmación: "Nota agregada correctamente"

### CA-3: Visualización de Notas
- Sección "Notas" en perfil del cliente
- Lista de todas las notas en orden cronológico inverso (más reciente primero)
- Cada nota muestra:
  - Contenido de la nota (texto completo)
  - Fecha y hora de creación (formato relativo: "hace 2 días" + tooltip con fecha exacta)
  - Nombre del usuario que la creó
  - Icono de autor (avatar o iniciales)
- Diseño de tarjeta o speech bubble
- Si no hay notas: mensaje "No hay notas sobre este cliente"

### CA-4: Editar Nota Propia
- Usuario puede editar solo sus propias notas
- Icono de "editar" (lápiz) junto a notas propias
- Al hacer click, el texto se vuelve editable
- Se mantienen mismas validaciones (max 500 caracteres)
- Botón "Guardar cambios" y "Cancelar"
- Se registra timestamp de última edición
- Indicador: "Editado el [fecha]" (si fue editada)

### CA-5: Restricción de Edición
- No se pueden editar notas de otros usuarios
- Solo el creador de la nota puede editarla
- Admin puede editar todas las notas (opcional)
- Si se intenta editar nota ajena: botón deshabilitado o no visible

### CA-6: No Eliminar, Solo Editar
- Las notas NO se pueden eliminar
- Razón: mantener historial completo de información
- Si una nota ya no es relevante, se puede editar para aclarar:
  - Ej: "[YA NO APLICA] Prefería entregas por la tarde"
- O simplemente agregar nueva nota aclaratoria
- Mantiene integridad del historial

### CA-7: Indicador de Notas Importantes
- Opcional: marcar notas como "importantes" o "destacadas"
- Checkbox o icono de estrella al crear/editar nota
- Notas importantes se muestran en la parte superior
- Fondo o borde distintivo (amarillo, destacado)
- Útil para alertas críticas del cliente

### CA-8: Búsqueda en Notas (Opcional)
- Si hay muchas notas, campo de búsqueda local
- Filtra notas por contenido en tiempo real
- Útil para clientes con mucho historial
- No requiere API, búsqueda en frontend

### CA-9: Visibilidad de Notas
- Todas las notas son visibles para todos los usuarios del sistema
- Personal de Ventas y Admin pueden ver todas las notas
- Útil para continuidad del servicio (cualquier vendedor puede atender)
- No hay notas privadas (todas compartidas)

### CA-10: Exportación de Notas
- Al exportar perfil del cliente o historial, incluir notas
- Notas incluidas en vista de impresión del cliente
- Formato cronológico con autor y fecha

## Notas Técnicas
- Tabla `customer_notes`:
  ```sql
  CREATE TABLE customer_notes (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK(LENGTH(content) <= 500),
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    is_important BOOLEAN DEFAULT FALSE
  );
  ```
- API endpoints:
  - `POST /api/customers/{id}/notes` - crear nota
  - `GET /api/customers/{id}/notes` - listar notas del cliente
  - `PUT /api/notes/{note_id}` - editar nota
  - `DELETE /api/notes/{note_id}` - (NO implementar si no se permite eliminar)
- Request body (crear):
  ```json
  {
    "content": "Prefiere contacto por email",
    "is_important": false
  }
  ```
- Response (lista de notas):
  ```json
  [
    {
      "id": 1,
      "content": "Prefiere contacto por email",
      "created_by": { "id": 5, "name": "Juan Vendedor" },
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": null,
      "is_important": false
    }
  ]
  ```
- Validaciones:
  - Contenido no vacío
  - Máximo 500 caracteres
  - Solo el creador puede editar (excepto Admin)
- Índices: `customer_id`, `created_by`, `created_at`
- Eager loading de user al obtener notas para evitar N+1

## Definición de Hecho
- [x] Frontend: Botón "+ Agregar nota"
- [x] Frontend: Modal/formulario de nueva nota
- [x] Frontend: Validación de máximo 500 caracteres
- [x] Frontend: Contador de caracteres
- [x] Frontend: Lista de notas en perfil del cliente
- [x] Frontend: Ordenamiento cronológico (is_important DESC, created_at DESC)
- [x] Frontend: Edición de notas propias
- [x] Frontend: Restricción de edición (solo propias, Admin ve todos)
- [x] Frontend: Indicador de "Editado"
- [x] Frontend: Opcional: star toggle de nota importante
- [x] Frontend: Opcional: búsqueda local en notas (>2 notas)
- [x] Backend: API POST /api/customers/{id}/notes
- [x] Backend: API GET /api/customers/{id}/notes
- [x] Backend: API PUT /api/customers/{id}/notes/{note_id}
- [x] Backend: Validación de longitud de contenido (≤500 chars)
- [x] Backend: Validación de permisos de edición (403 si no es creador ni Admin)
- [x] Backend: Registro de created_by y timestamps (created_at, updated_at)
- [x] Base de datos: Tabla customer_notes creada
- [x] Base de datos: Foreign keys y constraints (CASCADE, SET NULL)
- [x] Base de datos: Índices creados (customer_id, composite customer_id+created_at)
- [x] Pruebas de crear nota
- [x] Pruebas de editar nota propia
- [x] Pruebas de restricción de edición
- [x] Pruebas de validación de longitud
- [x] Documentación de API

## Dependencias
- US-CUST-004 (Ver Perfil) - visualización de notas
- Sistema de autenticación para identificar usuario creador

## Tags
`customers`, `notes`, `crm`, `low-priority`
