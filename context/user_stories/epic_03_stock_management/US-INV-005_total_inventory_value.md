# US-INV-005: Valor Total del Inventario

## Historia de Usuario
**Como** administrador,
**quiero** conocer el valor total del inventario actual,
**para** evaluar el capital invertido en stock.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Cálculo del Valor Total
- Fórmula: `Σ (precio_costo × stock_actual)` para todos los productos
- Se incluyen solo productos con stock > 0
- Se excluyen productos marcados como inactivos o descontinuados
- Precisión: 2 decimales
- Formato de moneda: $X,XXX,XXX.XX

### CA-2: Visualización en Dashboard Principal
- Tarjeta/Widget destacado en dashboard:
  - Título: "Valor Total de Inventario"
  - Valor principal en grande
  - Indicador de cambio vs período anterior (+X% o -X%)
  - Icono representativo (caja con símbolo de moneda)
- Se actualiza automáticamente cada vez que cambia stock o precios

### CA-3: Desglose por Categoría
- Tabla o lista mostrando valor por categoría:
  - Nombre de categoría
  - Cantidad de productos en stock
  - Valor total de esa categoría
  - Porcentaje del total
- Gráfico de pastel o barra mostrando distribución porcentual
- Se puede hacer clic en categoría para ver productos de esa categoría

### CA-4: Gráfico de Evolución Temporal
- Gráfico de línea mostrando valor del inventario en el tiempo
- Períodos seleccionables:
  - Últimos 7 días
  - Últimos 30 días
  - Últimos 3 meses
  - Último año
  - Personalizado (rango de fechas)
- Marcadores en eventos importantes (grandes compras, ventas masivas)
- Tooltip al pasar sobre puntos del gráfico

### CA-5: Métricas Adicionales
Panel con métricas relacionadas:
- **Rotación de Inventario**: Valor vendido / Valor promedio de inventario
- **Días de Inventario**: Stock actual en días de venta promedio
- **Productos de Mayor Valor**: Top 10 productos por valor (precio × stock)
- **Categorías de Mayor Inversión**: Top 5 categorías por valor

### CA-6: Actualización Automática
- El valor se recalcula automáticamente cuando:
  - Cambia el stock de cualquier producto
  - Se actualiza el precio de costo de un producto
  - Se crea o elimina un producto
  - Se realiza un ajuste de inventario
- Indicador de última actualización: "Actualizado: hace X minutos"

### CA-7: Exportación de Reporte
- Botón "Exportar Reporte de Valor"
- Formato: PDF o Excel
- Incluye:
  - Valor total
  - Desglose por categoría
  - Gráfico de evolución
  - Lista completa de productos con su valor individual
  - Fecha y hora de generación
  - Usuario que generó el reporte

## Notas Técnicas
- Query optimizada para cálculo de valor total
- Considerar vista materializada para performance si inventario es muy grande
- Cache de valor total con invalidación al cambiar stock/precios
- Histórico de valores en tabla separada para gráficos

```sql
-- Vista para valor de inventario
CREATE OR REPLACE VIEW inventory_value_by_category AS
SELECT
    c.id as category_id,
    c.name as category_name,
    COUNT(p.id) as product_count,
    SUM(p.stock * p.cost_price) as total_value,
    SUM(p.stock) as total_stock
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.stock > 0 AND p.is_active = true
GROUP BY c.id, c.name
ORDER BY total_value DESC;

-- Tabla para histórico de valores (para gráficos)
CREATE TABLE inventory_value_history (
    id SERIAL PRIMARY KEY,
    total_value DECIMAL(12,2) NOT NULL,
    total_products INTEGER NOT NULL,
    total_units INTEGER NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inv_value_history_date ON inventory_value_history(recorded_at DESC);

-- Job diario para registrar valor histórico
INSERT INTO inventory_value_history (total_value, total_products, total_units)
SELECT
    SUM(stock * cost_price),
    COUNT(*),
    SUM(stock)
FROM products
WHERE is_active = true AND stock > 0;
```

## Definición de Hecho
- [ ] Backend: Query optimizado para cálculo de valor total
- [ ] Backend: API GET /api/inventory/value
- [ ] Backend: API GET /api/inventory/value/by-category
- [ ] Backend: API GET /api/inventory/value/history
- [ ] Backend: Job programado para registrar histórico diario
- [ ] Backend: Endpoint de exportación de reporte
- [ ] Frontend: Widget en dashboard con valor total
- [ ] Frontend: Tabla de desglose por categoría
- [ ] Frontend: Gráfico de evolución temporal
- [ ] Frontend: Panel de métricas adicionales
- [ ] Frontend: Top 10 productos de mayor valor
- [ ] Base de datos: Vista inventory_value_by_category
- [ ] Base de datos: Tabla inventory_value_history
- [ ] Pruebas de cálculo de valor
- [ ] Pruebas de performance con >10k productos
- [ ] Documentación de API

## Dependencias
- US-PROD-001 (tabla products con cost_price y stock)
- US-PROD-007 (tabla categories)
- US-INV-001 (actualizaciones de stock)
- Sistema de reportes/exportación

## Tags
`inventory`, `metrics`, `reporting`, `analytics`, `medium-priority`
