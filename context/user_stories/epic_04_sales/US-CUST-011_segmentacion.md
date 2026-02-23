# US-CUST-011: Segmentación de Clientes

## Historia de Usuario
**Como** administrador,
**quiero** ver clientes segmentados por nivel de compra,
**para** identificar clientes más valiosos.

## Prioridad
**Baja**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Categorías de Clientes
- Sistema clasifica automáticamente clientes en 3 categorías según monto total gastado:
  1. **VIP**: > $10,000
  2. **Frecuente**: $5,000 - $10,000
  3. **Regular**: < $5,000
- Los rangos son configurables por Admin
- Campo: `customer_category` en tabla customers

### CA-2: Cálculo Automático de Categoría
- La categoría se recalcula automáticamente después de cada pedido completado
- No se cuentan pedidos cancelados
- Trigger o lógica en backend al confirmar/entregar pedido
- Fórmula: `SUM(orders.total) WHERE status NOT IN ('Cancelado')`
- La categoría se actualiza sin intervención manual

### CA-3: Visualización de Badge en Perfil
- Badge de categoría destacado en perfil del cliente:
  - **VIP**: color dorado/morado, icono de corona 👑
  - **Frecuente**: color azul, icono de estrella ⭐
  - **Regular**: color gris, icono de persona 👤
- Badge visible junto al nombre del cliente
- Tooltip al hacer hover: "Cliente VIP - Ha gastado $15,350.00"

### CA-4: Badge en Lista de Clientes
- Columna o badge de categoría en tabla de clientes
- Mismo código de colores que en perfil
- Ordenamiento por categoría disponible (VIP primero)
- Filtro por categoría en lista

### CA-5: Filtro por Categoría
- En lista de clientes, filtro de categoría:
  - Dropdown o checkboxes múltiples
  - Opciones: VIP, Frecuente, Regular
  - Se puede seleccionar una o múltiples
  - Contador: "12 clientes VIP, 35 Frecuentes, 103 Regulares"
- Combinable con otros filtros (búsqueda, estado)

### CA-6: Dashboard de Segmentación
- Panel o página de análisis de clientes:
  - Gráfico de pastel o barras con distribución:
    - X% VIP
    - Y% Frecuente
    - Z% Regular
  - Métricas por categoría:
    - Número de clientes en cada categoría
    - Monto total gastado por categoría
    - Promedio de compra por categoría
  - Lista de top 10 clientes VIP con monto gastado

### CA-7: Configuración de Rangos
- Panel de administración para configurar rangos:
  - Campo: Monto mínimo para VIP (ej: $10,000)
  - Campo: Monto mínimo para Frecuente (ej: $5,000)
  - Regular: todo lo que esté debajo de Frecuente
- Al cambiar rangos, recalcular categorías de todos los clientes
- Botón "Aplicar cambios" con confirmación
- Solo Admin puede modificar rangos

### CA-8: Historial de Cambios de Categoría
- Registro cuando un cliente cambia de categoría:
  - Fecha del cambio
  - Categoría anterior → Nueva categoría
  - Pedido que causó el cambio
- Visible en historial de actividad del cliente
- Útil para reconocer clientes en ascenso

### CA-9: Acciones Especiales por Categoría (Futuro)
- Placeholder para funcionalidades futuras:
  - Descuentos automáticos para VIP
  - Envío gratis para Frecuente
  - Comunicaciones personalizadas
- Por ahora, solo categorización visual

### CA-10: Exportación con Categoría
- Al exportar lista de clientes, incluir columna de categoría
- Reporte de clientes por categoría
- Formato CSV/Excel con segmentación clara

## Notas Técnicas
- Tabla `customers`:
  ```sql
  ALTER TABLE customers ADD COLUMN customer_category VARCHAR(20) DEFAULT 'Regular';
  -- Valores: 'VIP', 'Frecuente', 'Regular'
  ```
- Tabla de configuración (opcional):
  ```sql
  CREATE TABLE customer_segmentation_config (
    id SERIAL PRIMARY KEY,
    vip_threshold DECIMAL(10,2) DEFAULT 10000.00,
    frequent_threshold DECIMAL(10,2) DEFAULT 5000.00,
    updated_at TIMESTAMP
  );
  ```
- Función de recálculo de categoría:
  ```python
  def update_customer_category(customer_id):
      total_spent = db.session.query(func.sum(Order.total))\
          .filter(Order.customer_id == customer_id)\
          .filter(Order.status != 'Cancelado')\
          .scalar() or 0

      config = SegmentationConfig.query.first()

      if total_spent >= config.vip_threshold:
          category = 'VIP'
      elif total_spent >= config.frequent_threshold:
          category = 'Frecuente'
      else:
          category = 'Regular'

      customer = Customer.query.get(customer_id)
      old_category = customer.customer_category
      customer.customer_category = category

      # Registrar cambio si es diferente
      if old_category != category:
          log_category_change(customer_id, old_category, category)

      db.session.commit()
  ```
- Trigger en cambio de estado de pedido:
  - Al cambiar a "Entregado": recalcular categoría del cliente
  - Al cancelar pedido: recalcular categoría (puede bajar)
- Índice en campo `customer_category` para filtros rápidos
- API endpoints:
  - `GET /api/customers/segmentation` - datos del dashboard
  - `GET /api/admin/segmentation-config` - obtener configuración
  - `PUT /api/admin/segmentation-config` - actualizar configuración
  - `POST /api/admin/recalculate-categories` - recalcular todas las categorías

## Definición de Hecho
- [x] Frontend: Badge de categoría en perfil del cliente
- [x] Frontend: Badge en lista de clientes
- [x] Frontend: Filtro por categoría
- [x] Frontend: Dashboard de segmentación con gráficos
- [x] Frontend: Panel de configuración de rangos (Admin)
- [x] Frontend: Contador de clientes por categoría
- [x] Backend: Campo customer_category en tabla customers
- [x] Backend: Tabla de configuración de rangos
- [x] Backend: Función de cálculo de categoría
- [x] Backend: Trigger/lógica de recálculo automático (calculado al ver perfil; auto-trigger diferido a US-ORD-003)
- [x] Backend: API de dashboard de segmentación
- [x] Backend: API de configuración de rangos
- [x] Backend: API de recálculo manual de categorías
- [x] Backend: Registro de cambios de categoría (CustomerCategoryHistory)
- [x] Base de datos: Campos y tablas creadas
- [x] Base de datos: Índices en customer_category
- [ ] Pruebas de cálculo de categoría (diferidas v1.0)
- [ ] Pruebas de recálculo automático (diferidas v1.0)
- [ ] Pruebas de cambio de configuración (diferidas v1.0)
- [ ] Pruebas de filtros por categoría (diferidas v1.0)
- [ ] Documentación de lógica de segmentación

## Dependencias
- US-CUST-001 (Registrar Cliente) - clientes existentes
- US-ORD-001 (Crear Pedido) - pedidos para calcular
- US-ORD-003 (Estados) - trigger en cambio de estado
- Biblioteca de gráficos (Chart.js, Recharts, etc.)

## Tags
`customers`, `segmentation`, `analytics`, `crm`, `low-priority`
