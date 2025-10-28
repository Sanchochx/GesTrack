# US-INV-009: Exportar Datos de Inventario

## Historia de Usuario
**Como** gerente de almacen,
**quiero** exportar el inventario actual a formato Excel/CSV,
**para** realizar análisis externos o respaldos.

## Prioridad
**Baja**

## Estimación
3 Story Points

## Criterios de Aceptación

### CA-1: Botón de Exportación
- Botón "Exportar Inventario" visible en:
  - Vista principal de inventario
  - Dashboard de inventario
  - Vista de inventario por categoría
- Icono de descarga para identificación visual
- Tooltip: "Exportar datos de inventario"

### CA-2: Selección de Formato
Modal o menú desplegable para elegir formato:
- **CSV**: Archivo de valores separados por comas
- **Excel (.xlsx)**: Hoja de cálculo con formato
- Opción por defecto: Excel
- Se recuerda última selección del usuario (localStorage)

### CA-3: Datos Incluidos en Exportación
El archivo exportado incluye las siguientes columnas:
1. SKU
2. Nombre del Producto
3. Categoría
4. Stock Actual
5. Stock Reservado (si aplica)
6. Stock Disponible
7. Punto de Reorden
8. Precio de Costo
9. Precio de Venta
10. Valor Total (Stock × Precio Costo)
11. Estado (En Stock / Stock Bajo / Sin Stock)
12. Última Actualización
13. Proveedor Principal (si está configurado)

### CA-4: Opciones de Filtrado
Antes de exportar, opción de seleccionar:
- **Todos los productos**: Exporta inventario completo
- **Solo productos filtrados**: Exporta según filtros activos en la vista actual
- **Solo productos con stock**: Excluye productos con stock = 0
- **Solo productos activos**: Excluye productos inactivos/descontinuados
- Checkbox para cada opción

### CA-5: Nombre de Archivo
Nomenclatura automática del archivo:
- Formato CSV: `inventario_YYYYMMDD_HHMMSS.csv`
- Formato Excel: `inventario_YYYYMMDD_HHMMSS.xlsx`
- Ejemplo: `inventario_20250127_143025.xlsx`
- Opción de personalizar prefijo del nombre

### CA-6: Formato Excel Mejorado
Si se exporta a Excel:
- Primera fila: Encabezados en negrita con fondo de color
- Columnas auto-ajustadas al contenido
- Filtros automáticos en encabezados
- Formatos de número:
  - Precios con formato moneda: $X,XXX.XX
  - Stock como número entero
  - Fechas en formato DD/MM/YYYY HH:MM
- Congelamiento de primera fila (encabezados)
- Hoja adicional con resumen:
  - Total de productos
  - Valor total de inventario
  - Productos por estado
  - Fecha de exportación

### CA-7: Descarga Automática
- El archivo se genera en el servidor
- Se descarga automáticamente al navegador
- Mensaje de confirmación: "Inventario exportado correctamente"
- Indicador de progreso para exportaciones grandes (>1000 productos)
- Límite: 50,000 productos por exportación

### CA-8: Log de Exportaciones
Registro de cada exportación:
- Usuario que exportó
- Fecha y hora
- Formato exportado
- Cantidad de productos incluidos
- Filtros aplicados
- Disponible en log de auditoría

## Notas Técnicas
- Librería para Excel: openpyxl (Python) o exceljs (Node.js)
- Generación asíncrona para grandes volúmenes
- Compresión del archivo si >10MB
- Límite de timeout: 60 segundos

```python
# Ejemplo de generación de Excel con openpyxl
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from datetime import datetime

def export_inventory_to_excel(products, filters_applied=None):
    wb = Workbook()
    ws = wb.active
    ws.title = "Inventario"

    # Encabezados
    headers = [
        'SKU', 'Nombre', 'Categoría', 'Stock Actual', 'Stock Reservado',
        'Stock Disponible', 'Punto Reorden', 'Precio Costo', 'Precio Venta',
        'Valor Total', 'Estado', 'Última Actualización', 'Proveedor'
    ]

    # Estilo de encabezados
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")

    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center')

    # Datos
    for row, product in enumerate(products, start=2):
        ws.cell(row=row, column=1, value=product.sku)
        ws.cell(row=row, column=2, value=product.name)
        ws.cell(row=row, column=3, value=product.category.name)
        ws.cell(row=row, column=4, value=product.stock)
        ws.cell(row=row, column=5, value=product.reserved_stock)
        ws.cell(row=row, column=6, value=product.stock - product.reserved_stock)
        ws.cell(row=row, column=7, value=product.reorder_point)

        # Formato de moneda
        cost_cell = ws.cell(row=row, column=8, value=product.cost_price)
        cost_cell.number_format = '$#,##0.00'

        price_cell = ws.cell(row=row, column=9, value=product.sale_price)
        price_cell.number_format = '$#,##0.00'

        value_cell = ws.cell(row=row, column=10, value=product.stock * product.cost_price)
        value_cell.number_format = '$#,##0.00'

        # Estado
        status = get_stock_status(product)
        ws.cell(row=row, column=11, value=status)

        # Fecha
        ws.cell(row=row, column=12, value=product.updated_at)
        ws.cell(row=row, column=13, value=product.supplier.name if product.supplier else '')

    # Auto-ajustar columnas
    for column in ws.columns:
        max_length = max(len(str(cell.value or '')) for cell in column)
        ws.column_dimensions[column[0].column_letter].width = min(max_length + 2, 50)

    # Filtros automáticos
    ws.auto_filter.ref = ws.dimensions

    # Congelar primera fila
    ws.freeze_panes = 'A2'

    # Hoja de resumen
    summary_sheet = wb.create_sheet(title="Resumen")
    summary_sheet['A1'] = "Resumen de Inventario"
    summary_sheet['A1'].font = Font(bold=True, size=14)
    summary_sheet['A3'] = f"Fecha de exportación: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    summary_sheet['A4'] = f"Total de productos: {len(products)}"
    summary_sheet['A5'] = f"Valor total: ${sum(p.stock * p.cost_price for p in products):,.2f}"

    # Guardar
    filename = f"inventario_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    wb.save(filename)

    return filename
```

## Definición de Hecho
- [ ] Backend: API POST /api/inventory/export
- [ ] Backend: Generación de archivos CSV
- [ ] Backend: Generación de archivos Excel con formato
- [ ] Backend: Aplicación de filtros en exportación
- [ ] Backend: Log de exportaciones en auditoría
- [ ] Backend: Límites y validaciones
- [ ] Frontend: Botón de exportación en vistas
- [ ] Frontend: Modal de opciones de exportación
- [ ] Frontend: Selección de formato (CSV/Excel)
- [ ] Frontend: Opciones de filtrado
- [ ] Frontend: Indicador de progreso
- [ ] Frontend: Descarga automática del archivo
- [ ] Pruebas con pequeños y grandes volúmenes
- [ ] Pruebas de formato Excel
- [ ] Documentación de API

## Dependencias
- US-INV-001 (datos de stock)
- US-PROD-001 (tabla products)
- US-PROD-007 (categorías)
- Librería de generación de archivos Excel

## Tags
`inventory`, `export`, `reporting`, `excel`, `csv`, `low-priority`
