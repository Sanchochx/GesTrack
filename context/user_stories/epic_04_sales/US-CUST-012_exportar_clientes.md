# US-CUST-012: Exportar Lista de Clientes

## Historia de Usuario
**Como** administrador,
**quiero** exportar la lista de clientes a Excel/CSV,
**para** análisis externos o campañas de marketing.

## Prioridad
**Baja**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Botón de Exportar
- Botón "Exportar" en la vista de lista de clientes
- Ubicación: parte superior, junto a "Nuevo Cliente"
- Icono de descarga 📥 o tabla con flecha
- Tooltip: "Exportar lista de clientes"
- Accesible para Admin y Personal de Ventas

### CA-2: Opciones de Formato
- Dropdown con opciones de formato:
  - **CSV**: archivo de texto separado por comas
  - **Excel (.xlsx)**: hoja de cálculo de Excel
- Click en opción inicia descarga inmediatamente
- Alternativa: modal para elegir formato y configuraciones

### CA-3: Contenido del Archivo
- Columnas incluidas en la exportación:
  - Nombre completo
  - Email
  - Teléfono principal
  - Teléfono secundario (si existe)
  - Dirección completa (calle)
  - Ciudad
  - Código Postal
  - País
  - Fecha de registro
  - Estado (Activo/Inactivo)
  - Categoría (VIP, Frecuente, Regular)
  - Total de compras (monto)
  - Número de pedidos
  - Última compra (fecha)
- Formato de tabla con headers claros

### CA-4: Respeto de Filtros Actuales
- Se exportan solo los clientes **filtrados actualmente**
- Si hay búsqueda activa: exportar solo resultados de búsqueda
- Si hay filtros aplicados (categoría, estado): exportar solo esos
- Si no hay filtros: exportar todos los clientes
- Mensaje de confirmación: "Se exportarán X clientes (según filtros aplicados)"

### CA-5: Encabezado del Archivo
- Primera fila: encabezado con nombres de columnas
  - CSV: "Nombre,Email,Teléfono,Dirección,..."
  - Excel: header row con formato (negrita, fondo gris)
- Segunda fila: primera línea de datos
- Sin filas vacías al inicio

### CA-6: Formato de Datos
- Fechas en formato ISO (YYYY-MM-DD) o legible (DD/MM/YYYY)
- Montos con formato de moneda: $1,234.56
- Estado: "Activo" o "Inactivo" (texto, no booleano)
- Categoría: "VIP", "Frecuente", "Regular"
- Dirección completa en una celda (no separar en múltiples columnas)
- Texto UTF-8 para caracteres especiales (tildes, ñ)

### CA-7: Nombre del Archivo
- Nombre descriptivo con timestamp:
  - CSV: `clientes_2025-01-15_143022.csv`
  - Excel: `clientes_2025-01-15_143022.xlsx`
- Formato: `clientes_[YYYY-MM-DD]_[HHMMSS].[extension]`
- Alternativa: `clientes_[fecha].csv` (fecha legible)

### CA-8: Descarga Automática
- El archivo se descarga automáticamente al generarse
- No requiere navegación a otra página
- Usa atributo `download` o response como blob
- Indicador de progreso si el archivo es grande (muchos clientes)

### CA-9: Manejo de Grandes Volúmenes
- Si hay muchos clientes (>1000), generar archivo en background
- Mostrar mensaje: "Generando archivo... Esto puede tomar unos segundos"
- Opción: enviar por email cuando esté listo (para volúmenes muy grandes)
- Límite razonable: 10,000 clientes por exportación

### CA-10: Configuración de Columnas (Opcional)
- Modal avanzado de exportación:
  - Checkboxes para seleccionar qué columnas incluir
  - Opciones: incluir notas, incluir dirección detallada, etc.
  - Vista previa de primeras 5 filas
- Para exportaciones personalizadas
- Solo si es necesario (simplificar UX)

## Notas Técnicas
- **Backend - CSV**:
  ```python
  import csv
  from io import StringIO

  @app.route('/api/customers/export/csv')
  def export_customers_csv():
      # Aplicar mismos filtros que en lista
      customers = Customer.query.filter(...).all()

      # Crear CSV en memoria
      si = StringIO()
      writer = csv.writer(si)

      # Header
      writer.writerow(['Nombre', 'Email', 'Teléfono', ...])

      # Datos
      for customer in customers:
          writer.writerow([
              customer.full_name,
              customer.email,
              customer.phone,
              ...
          ])

      # Response
      output = si.getvalue()
      return Response(
          output,
          mimetype='text/csv',
          headers={
              'Content-Disposition': f'attachment; filename=clientes_{datetime.now().strftime("%Y-%m-%d_%H%M%S")}.csv'
          }
      )
  ```

- **Backend - Excel**:
  ```python
  from openpyxl import Workbook
  from io import BytesIO

  @app.route('/api/customers/export/xlsx')
  def export_customers_xlsx():
      customers = Customer.query.filter(...).all()

      wb = Workbook()
      ws = wb.active
      ws.title = "Clientes"

      # Header
      headers = ['Nombre', 'Email', 'Teléfono', ...]
      ws.append(headers)

      # Formato del header
      for cell in ws[1]:
          cell.font = Font(bold=True)
          cell.fill = PatternFill(start_color="CCCCCC", fill_type="solid")

      # Datos
      for customer in customers:
          ws.append([
              customer.full_name,
              customer.email,
              customer.phone,
              ...
          ])

      # Guardar en memoria
      bio = BytesIO()
      wb.save(bio)
      bio.seek(0)

      return send_file(
          bio,
          mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          as_attachment=True,
          download_name=f'clientes_{datetime.now().strftime("%Y-%m-%d_%H%M%S")}.xlsx'
      )
  ```

- Frontend:
  ```javascript
  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await fetch(`/api/customers/export/${format}?${currentFilters}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showError('Error al exportar clientes');
    } finally {
      setExporting(false);
    }
  };
  ```

- Para grandes volúmenes:
  - Usar streaming o generación por lotes
  - Considerar Celery task para background processing
  - Enviar email con link de descarga cuando esté listo

## Definición de Hecho
- [x] Frontend: Botón "Exportar" (junto a "Nuevo Cliente")
- [x] Frontend: Dropdown con opciones CSV y Excel (MUI Menu)
- [x] Frontend: Indicador de progreso durante exportación (CircularProgress en botón)
- [x] Frontend: Aplicación de filtros actuales a exportación (search, is_active, category)
- [x] Frontend: Descarga automática del archivo (blob + anchor click)
- [x] Frontend: Manejo de errores (setError en catch)
- [x] Frontend: Tooltip con conteo de clientes a exportar (CA-4 confirmación)
- [x] Backend: API GET /api/customers/export (parámetro format=csv|excel)
- [x] Backend: Aplicación de filtros en query (mismos que GET /api/customers)
- [x] Backend: Generación de CSV con csv module (via ExportHelper)
- [x] Backend: Generación de Excel con openpyxl (via ExportHelper)
- [x] Backend: Headers apropiados para descarga (Content-Disposition)
- [x] Backend: Nombre de archivo con timestamp (clientes_YYYYMMDD_HHMMSS.csv/xlsx)
- [x] Backend: Formato UTF-8 para caracteres especiales
- [x] Backend: Estadísticas de pedidos por cliente en exportación (join con Order)
- [x] Backend: Límite de 10 000 clientes por exportación (CA-9)
- [ ] Pruebas de exportación CSV (diferidas v1.0)
- [ ] Pruebas de exportación Excel (diferidas v1.0)
- [ ] Pruebas con filtros aplicados (diferidas v1.0)
- [ ] Pruebas con caracteres especiales (diferidas v1.0)
- [ ] Pruebas con volumen grande (diferidas v1.0)
- [ ] Documentación de formato de exportación

## Dependencias
- US-CUST-002 (Listar Clientes) - integración en misma vista
- US-CUST-003 (Buscar) - respetar filtros de búsqueda
- US-CUST-011 (Segmentación) - incluir categoría en export
- Biblioteca openpyxl instalada (para Excel)

## Tags
`customers`, `export`, `csv`, `excel`, `reporting`, `low-priority`
