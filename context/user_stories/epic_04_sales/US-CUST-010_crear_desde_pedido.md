# US-CUST-010: Crear Cliente desde Pedido

## Historia de Usuario
**Como** personal de ventas,
**quiero** poder crear un nuevo cliente mientras creo un pedido,
**para** agilizar el proceso de venta.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Opción en Formulario de Pedido
- En formulario de crear pedido (US-ORD-001), en selector de cliente
- Botón "+ Nuevo Cliente" junto al buscador de clientes
- Icono de persona con signo +
- Texto claro: "Crear nuevo cliente"
- Posición prominente pero no intrusiva

### CA-2: Modal de Registro Rápido
- Al hacer click en "+ Nuevo Cliente", abre modal
- Título: "Crear nuevo cliente"
- Formulario simplificado pero completo
- Mismo diseño que US-CUST-001 pero en modal
- Tamaño apropiado del modal (responsive)

### CA-3: Campos del Formulario
- **Campos requeridos**:
  - Nombre completo
  - Email
  - Teléfono principal
  - Dirección (calle)
  - Ciudad
  - Código Postal
  - País
- **Campos opcionales**:
  - Teléfono secundario
  - Notas
- Mismo orden y validaciones que registro normal

### CA-4: Validaciones en Tiempo Real
- Todas las validaciones de US-CUST-001 aplican:
  - Email único
  - Formato de email válido
  - Formato de teléfono válido
  - Campos requeridos no vacíos
- Mensajes de error junto a cada campo
- Botón "Crear" deshabilitado si hay errores

### CA-5: Guardado del Cliente
- Botón "Crear cliente" al final del formulario
- Al guardar exitosamente:
  - Cliente se crea en base de datos
  - Cliente se selecciona automáticamente en el pedido
  - Modal se cierra automáticamente
  - El nombre del cliente aparece en el selector
  - Mensaje de confirmación: "Cliente [Nombre] creado correctamente"
- NO interrumpe el flujo de creación del pedido

### CA-6: Cancelación
- Botón "Cancelar" cierra el modal sin crear cliente
- Si hay datos ingresados: confirmación "¿Descartar cliente?"
- Vuelve al formulario de pedido sin cliente seleccionado
- No se pierde información del pedido en progreso

### CA-7: Persistencia del Pedido en Progreso
- Mientras se crea el cliente, los datos del pedido se mantienen:
  - Productos agregados
  - Cantidades
  - Descuentos
  - Notas
- Usar localStorage o state management para persistir
- Al volver del modal, todo está como se dejó

### CA-8: Selección Automática
- Al crear el cliente exitosamente:
  - Se selecciona automáticamente en el campo "Cliente" del pedido
  - Se muestran sus datos (dirección, teléfono) en el pedido
  - Se puede proceder a finalizar el pedido inmediatamente
- No requiere buscarlo manualmente después de crear

### CA-9: Manejo de Errores
- Si falla la creación (ej: email duplicado):
  - Mensaje de error claro en el modal
  - Modal permanece abierto con datos ingresados
  - Usuario puede corregir y reintentar
  - No se pierde información del pedido
- Si hay error de conexión: mensaje apropiado y opción de reintentar

### CA-10: Alternativa sin Modal (Opcional)
- En lugar de modal, abrir vista inline expandible
- O página separada con botón "Volver al pedido"
- Mantener contexto claro de que está en proceso de crear pedido
- Cualquier implementación debe mantener datos del pedido

## Notas Técnicas
- Reutilizar componente de formulario de US-CUST-001
- API: mismo endpoint `POST /api/customers`
- Frontend debe manejar estado del pedido:
  ```javascript
  // Guardar estado antes de abrir modal
  const [orderDraft, setOrderDraft] = useState(null);

  const handleCreateCustomer = () => {
    // Guardar draft del pedido
    setOrderDraft({
      products: selectedProducts,
      discount: discount,
      notes: notes,
      // ...
    });
    // Abrir modal
    setShowCustomerModal(true);
  };

  const handleCustomerCreated = (newCustomer) => {
    // Seleccionar cliente nuevo
    setSelectedCustomer(newCustomer);
    // Cerrar modal
    setShowCustomerModal(false);
    // El draft se mantiene en state
  };
  ```
- Considerar guardar en localStorage como respaldo
- Validar mismo comportamiento que creación normal
- El flujo completo: Crear Pedido → Crear Cliente → Volver a Pedido → Finalizar Pedido

## Definición de Hecho
- [ ] Frontend: Botón "+ Nuevo Cliente" en formulario de pedido
- [ ] Frontend: Modal de creación de cliente
- [ ] Frontend: Formulario con todos los campos requeridos
- [ ] Frontend: Validaciones en tiempo real
- [ ] Frontend: Guardado del cliente
- [ ] Frontend: Selección automática del cliente creado
- [ ] Frontend: Persistencia de datos del pedido durante creación de cliente
- [ ] Frontend: Confirmación de cancelación si hay datos
- [ ] Frontend: Manejo de errores sin perder contexto
- [ ] Backend: Usar mismo endpoint POST /api/customers
- [ ] Pruebas de creación de cliente desde pedido
- [ ] Pruebas de selección automática
- [ ] Pruebas de persistencia de datos del pedido
- [ ] Pruebas de validaciones (email duplicado, etc.)
- [ ] UX testing del flujo completo

## Dependencias
- US-CUST-001 (Registrar Cliente) - reutilizar lógica
- US-ORD-001 (Crear Pedido) - integración en formulario
- API de clientes debe estar operativa

## Tags
`customers`, `orders`, `create`, `ux`, `workflow`, `medium-priority`
