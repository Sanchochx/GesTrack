# US-ORD-005: Listar Pedidos

## Historia de Usuario
**Como** personal de ventas,
**quiero** ver una lista de todos los pedidos registrados,
**para** dar seguimiento a las ventas.

## Prioridad
**Alta**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Tabla de Pedidos
- Tabla responsive con las siguientes columnas:
  - Número de pedido (ORD-XXXX)
  - Cliente (nombre completo)
  - Fecha del pedido
  - Total (formato moneda)
  - Estado del pedido (badge con color)
  - Estado de pago (badge con color)
  - Acciones (ver detalles, editar, etc.)
- Headers de columnas claramente identificados

### CA-2: Paginación
- Mostrar 20 pedidos por página por defecto
- Controles de paginación: Primera, Anterior, Números, Siguiente, Última
- Indicador: "Mostrando 1-20 de 150 pedidos"
- Selector de items por página: 10, 20, 50, 100
- Mantener filtros y ordenamiento al cambiar de página

### CA-3: Ordenamiento
- Cada columna permite ordenamiento (excepto Acciones)
- Click en header alterna entre: ascendente → descendente → sin orden
- Indicadores visuales: flechas ↑↓
- Ordenamientos disponibles:
  - Número de pedido (alfanumérico)
  - Cliente (alfabético)
  - Fecha (cronológico)
  - Total (numérico)
  - Estado (orden del flujo: Pendiente, Confirmado, etc.)
- Por defecto: ordenado por fecha descendente (más reciente primero)

### CA-4: Código de Colores para Estados
- **Estado del Pedido**:
  - Pendiente: amarillo (#FFC107)
  - Confirmado: azul (#2196F3)
  - Procesando: naranja (#FF9800)
  - Enviado: púrpura (#9C27B0)
  - Entregado: verde (#4CAF50)
  - Cancelado: rojo (#F44336)
- **Estado de Pago**:
  - Pendiente: rojo claro
  - Pagado Parcial: amarillo
  - Pagado Completo: verde
- Badges con contraste suficiente para accesibilidad

### CA-5: Botón de Crear Nuevo Pedido
- Botón "Nuevo Pedido" o "+ Crear Pedido" en parte superior derecha
- Estilo destacado (primary button)
- Redirige a formulario de creación de pedido
- Accesible en todas las páginas de la lista

### CA-6: Resumen de Totales
- Panel superior muestra métricas resumidas:
  - Total de pedidos (según filtros aplicados)
  - Monto total de ventas (suma de todos los totales)
  - Número de pedidos por estado (ej: 10 Pendientes, 5 Procesando)
  - Opcional: promedio de venta
- Formato: "150 pedidos | $45,230.50 en ventas"

### CA-7: Acciones Rápidas
- Botón/icono "Ver Detalles" abre vista de detalles del pedido
- Click en fila completa también abre detalles (UX mejorado)
- Icono de "Editar" si el pedido es editable (estado Pendiente o Confirmado)
- Menú de acciones adicionales (⋮):
  - Ver detalles
  - Editar
  - Cambiar estado
  - Registrar pago
  - Imprimir
  - Cancelar

### CA-8: Indicadores Visuales Adicionales
- Icono de alerta si el pedido tiene más de X días en estado Pendiente
- Icono de advertencia si hay saldo de pago pendiente
- Tooltip con información adicional al hacer hover en badges

### CA-9: Estados Vacíos
- Si no hay pedidos registrados:
  - Mensaje: "No hay pedidos registrados"
  - Ilustración o icono sugerente
  - Botón destacado "Crear primer pedido"
- Si hay filtros sin resultados:
  - Mensaje: "No se encontraron pedidos con los filtros aplicados"
  - Botón "Limpiar filtros"

### CA-10: Performance y Carga
- Loading skeleton mientras cargan los datos
- Lazy loading de imágenes (si se muestran fotos de productos)
- Paginación en backend (no cargar todos los pedidos al front)
- Caché de listado por 30 segundos (invalidar al crear/editar)

## Notas Técnicas
- API endpoint: `GET /api/orders?page=1&limit=20&sort=date&order=desc`
- Response incluye:
  - `items`: array de pedidos
  - `total`: total de pedidos (según filtros)
  - `page`: página actual
  - `limit`: items por página
  - `total_amount`: suma de totales
- Implementar query builder eficiente en backend
- Índices en base de datos: `order_date`, `status`, `payment_status`, `customer_id`
- Considerar vista materializada para métricas si el volumen es alto
- Frontend: usar tabla component (DataTable, AG Grid, etc.)
- Implementar virtual scrolling si hay muchos pedidos

## Definición de Hecho
- [ ] Frontend: Componente de tabla de pedidos
- [ ] Frontend: Paginación con controles completos
- [ ] Frontend: Ordenamiento por columnas
- [ ] Frontend: Badges con código de colores
- [ ] Frontend: Botón de crear nuevo pedido
- [ ] Frontend: Panel de resumen de totales
- [ ] Frontend: Menú de acciones rápidas
- [ ] Frontend: Estados vacíos y sin resultados
- [ ] Frontend: Loading states
- [ ] Backend: API GET /api/orders con paginación
- [ ] Backend: Soporte de ordenamiento dinámico
- [ ] Backend: Cálculo de totales y métricas
- [ ] Backend: Optimización de queries (eager loading)
- [ ] Base de datos: Índices creados
- [ ] Pruebas de paginación
- [ ] Pruebas de ordenamiento
- [ ] Pruebas de performance con volumen alto
- [ ] Responsive design (mobile, tablet, desktop)

## Dependencias
- US-ORD-001 (Crear Pedido) debe estar completo
- Sistema de autenticación para permisos de visualización

## Tags
`orders`, `listing`, `ui`, `high-priority`
