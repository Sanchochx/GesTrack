# Epic 04: Sales - Gestión de Pedidos y Clientes

## Descripción
Esta épica implementa el módulo completo de ventas, incluyendo la gestión de pedidos con múltiples productos, seguimiento de estados, procesamiento de pagos, devoluciones, y la administración completa de clientes con su historial de compras. Es el núcleo del sistema de ventas y CRM de GesTrack.

## Objetivos
- Implementar sistema completo de gestión de pedidos (creación, edición, seguimiento)
- Desarrollar flujo de estados del pedido (Pendiente → Confirmado → Procesando → Enviado → Entregado)
- Implementar control de estados de pago y registro de pagos parciales
- Habilitar procesamiento de devoluciones y notas de crédito
- Gestionar base de datos de clientes con información de contacto
- Proporcionar historial completo de compras por cliente
- Implementar segmentación de clientes por nivel de compra
- Validar disponibilidad de stock en tiempo real al crear pedidos
- Calcular totales automáticamente (subtotal, impuestos, envío)
- Permitir aplicación de descuentos con autorización

## Roles con Acceso
- **Admin**: Acceso completo (CRUD pedidos y clientes, autorización de descuentos, eliminación)
- **Personal de Ventas**: Acceso completo a pedidos y clientes (CRUD), ver reportes
- **Gerente de Almacén**: Solo lectura de pedidos para preparar envíos
- **Usuario Regular**: Sin acceso al módulo de ventas

## Historias de Usuario

### Módulo de Pedidos (14 historias)
1. **US-ORD-001**: Crear Pedido
2. **US-ORD-002**: Cálculo Automático de Totales
3. **US-ORD-003**: Gestión de Estados del Pedido
4. **US-ORD-004**: Estado de Pago del Pedido
5. **US-ORD-005**: Listar Pedidos
6. **US-ORD-006**: Buscar y Filtrar Pedidos
7. **US-ORD-007**: Ver Detalles del Pedido
8. **US-ORD-008**: Editar Pedido
9. **US-ORD-009**: Cancelar Pedido
10. **US-ORD-010**: Historial de Pedidos por Cliente
11. **US-ORD-011**: Procesamiento de Devoluciones
12. **US-ORD-012**: Imprimir/Exportar Pedido
13. **US-ORD-013**: Validación de Stock al Crear Pedido
14. **US-ORD-014**: Descuentos en Pedidos

### Módulo de Clientes (12 historias)
1. **US-CUST-001**: Registrar Nuevo Cliente
2. **US-CUST-002**: Listar Clientes
3. **US-CUST-003**: Buscar Clientes
4. **US-CUST-004**: Ver Perfil del Cliente
5. **US-CUST-005**: Editar Información del Cliente
6. **US-CUST-006**: Eliminar Cliente
7. **US-CUST-007**: Historial de Compras del Cliente
8. **US-CUST-008**: Inactivar/Activar Cliente
9. **US-CUST-009**: Notas sobre el Cliente
10. **US-CUST-010**: Crear Cliente desde Pedido
11. **US-CUST-011**: Segmentación de Clientes
12. **US-CUST-012**: Exportar Lista de Clientes

## Dependencias
- Epic 01 (Foundation) debe estar completa
- Epic 02 (Core Data - Productos) debe estar completa
- Epic 03 (Inventory) debe estar completa
- Sistema de autenticación y autorización funcional
- Base de datos configurada con tablas de productos e inventario

## Modelo de Datos Principal

```
Order:
  - id (PK)
  - order_number (único, auto-generado)
  - customer_id (FK → Customer)
  - order_date
  - status (Pendiente, Confirmado, Procesando, Enviado, Entregado, Cancelado)
  - payment_status (Pendiente, Pagado Parcial, Pagado Completo)
  - subtotal
  - tax_rate
  - tax_amount
  - shipping_cost
  - discount_amount
  - discount_reason
  - total
  - notes
  - created_by (FK → User)
  - created_at
  - updated_at
  - cancelled_at
  - cancellation_reason

OrderItem:
  - id (PK)
  - order_id (FK → Order)
  - product_id (FK → Product)
  - quantity
  - unit_price
  - subtotal
  - created_at

OrderStatusHistory:
  - id (PK)
  - order_id (FK → Order)
  - status
  - changed_by (FK → User)
  - notes
  - created_at

Payment:
  - id (PK)
  - order_id (FK → Order)
  - amount
  - payment_method (Efectivo, Tarjeta, Transferencia)
  - payment_date
  - notes
  - created_by (FK → User)
  - created_at

Return:
  - id (PK)
  - order_id (FK → Order)
  - return_date
  - reason
  - status (Pendiente, Aprobado, Rechazado)
  - total_amount
  - created_by (FK → User)
  - created_at

ReturnItem:
  - id (PK)
  - return_id (FK → Return)
  - product_id (FK → Product)
  - quantity
  - reason

Customer:
  - id (PK)
  - full_name
  - email (único)
  - phone
  - secondary_phone
  - address_street
  - address_city
  - address_postal_code
  - address_country
  - customer_category (Regular, Frecuente, VIP)
  - is_active
  - notes
  - registered_at
  - updated_at
  - inactivated_at

CustomerNote:
  - id (PK)
  - customer_id (FK → Customer)
  - content
  - created_by (FK → User)
  - created_at
  - updated_at
```

## Criterios de Éxito
- ✓ Pedidos pueden crearse con múltiples productos y cliente asociado
- ✓ Validación de stock en tiempo real al agregar productos
- ✓ Cálculo automático de totales (subtotal, impuestos, envío, descuentos)
- ✓ Flujo completo de estados del pedido funcional
- ✓ Sistema de pagos parciales y completos operativo
- ✓ Procesamiento de devoluciones con actualización de inventario
- ✓ Clientes pueden registrarse, editarse, inactivarse
- ✓ Historial completo de compras por cliente
- ✓ Segmentación automática de clientes por volumen de compra
- ✓ Búsqueda y filtrado eficiente de pedidos y clientes
- ✓ Generación de documentos imprimibles/PDF de pedidos
- ✓ Sistema de descuentos con autorización para montos altos
- ✓ Creación rápida de clientes desde formulario de pedido
- ✓ Exportación de listados de clientes y pedidos

## Stack Técnico
- Backend: Flask + SQLAlchemy
- Base de datos: PostgreSQL
- Generación de PDF: ReportLab o WeasyPrint
- Frontend: React/Vue con formularios complejos
- Validación de formularios: Formik/Yup o Vuelidate
- Manejo de estado: Redux/Vuex
- Notificaciones en tiempo real: WebSockets (opcional)

## Prioridad
**ALTA** - Módulo crítico de ventas. Debe completarse antes de Epic 05 (Reportes y Análisis)

## Notas de Implementación
- Implementar transacciones de base de datos para operaciones críticas (creación de pedido, cancelación, devolución)
- Considerar bloqueos optimistas para evitar conflictos de stock
- Implementar auditoria completa de todas las operaciones (quién, cuándo, qué)
- Los números de pedido deben ser únicos y secuenciales
- Las devoluciones deben actualizar automáticamente el inventario
- Los descuentos mayores al 20% requieren aprobación de Admin
- Implementar soft delete para clientes con pedidos históricos
- Considerar cache para listados de clientes frecuentes
