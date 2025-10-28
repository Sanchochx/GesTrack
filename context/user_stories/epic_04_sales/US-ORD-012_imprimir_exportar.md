# US-ORD-012: Imprimir/Exportar Pedido

## Historia de Usuario
**Como** personal de ventas,
**quiero** imprimir o exportar la información del pedido,
**para** entregar documentación al cliente o para archivo.

## Prioridad
**Baja**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Botón de Imprimir
- Botón "Imprimir" en vista de detalles del pedido
- Icono de impresora 🖨️
- Ubicación: barra de acciones junto a Editar, Cancelar, etc.
- Disponible para todos los usuarios con acceso al pedido
- Tooltip: "Imprimir pedido"

### CA-2: Formato Imprimible - Cabecera
- Logo de la empresa (si está configurado)
- Nombre de la empresa y datos de contacto
- Título: "PEDIDO" o "ORDEN DE COMPRA" (configurable)
- Número de pedido prominente: "ORD-XXXXXX"
- Fecha del pedido
- Estado del pedido (si es relevante para impresión)

### CA-3: Información del Cliente
- Sección "Cliente" o "Entregar a":
  - Nombre completo
  - Dirección completa de envío (multilínea)
  - Teléfono
  - Email
- Formato claro y legible

### CA-4: Tabla de Productos
- Tabla profesional con columnas:
  - Cantidad
  - Descripción/Nombre del Producto
  - SKU (opcional, según configuración)
  - Precio Unitario
  - Subtotal
- Formato alineado y limpio
- Bordes sutiles o separadores claros
- Tipografía legible (tamaño adecuado)

### CA-5: Desglose de Totales
- Sección de totales alineada a la derecha:
  - Subtotal: $X,XXX.XX
  - Descuento (si aplica): -$XXX.XX
  - Impuesto (XX%): $XXX.XX
  - Envío: $XXX.XX
  - **TOTAL**: $X,XXX.XX (destacado, negrita, tamaño mayor)
- Formato de moneda consistente

### CA-6: Información Adicional
- Campo de notas del pedido (si existen)
- Términos y condiciones (si están configurados)
- Información de contacto para dudas
- Firma del vendedor (opcional, espacio para firma física)
- Firma del cliente (opcional, espacio para firma de recibido)

### CA-7: Diseño y Estilo
- Diseño limpio y profesional
- Colores sutiles (principalmente blanco y negro para impresión)
- Logo y marca de la empresa (branding)
- Layout optimizado para hoja tamaño carta (8.5" x 11") o A4
- Sin elementos de navegación o UI del sistema
- CSS específico para impresión (@media print)

### CA-8: Vista Previa de Impresión
- Al hacer click en "Imprimir", se abre diálogo de impresión del navegador
- Vista previa nativa del navegador muestra el formato correctamente
- Opciones de impresión disponibles: impresora, número de copias, orientación
- Opción "Guardar como PDF" del navegador disponible

### CA-9: Exportar a PDF
- Botón adicional "Exportar PDF" o dropdown "Imprimir ▼" con opciones
- Genera archivo PDF del pedido con el mismo formato
- Descarga automática con nombre: "Pedido_ORD-XXXX_[Cliente].pdf"
- PDF generado en backend para mejor calidad
- Tamaño de archivo optimizado

### CA-10: Enviar por Email (Opcional)
- Opción adicional: "Enviar por email"
- Modal para confirmar email del cliente (prellenado)
- Asunto: "Pedido ORD-XXXX de [Empresa]"
- Cuerpo del email con mensaje personalizable
- Adjunta PDF del pedido
- Confirmación de envío exitoso

## Notas Técnicas
- **Opción 1 - Impresión desde Frontend**:
  - Usar CSS @media print para formato específico de impresión
  - Ocultar elementos de UI (botones, navegación, etc.)
  - window.print() para invocar diálogo de impresión
  - Ventajas: rápido, no requiere backend
  - Desventajas: depende del navegador, menos control

- **Opción 2 - Generación de PDF en Backend**:
  - API endpoint: `GET /api/orders/{id}/pdf`
  - Bibliotecas Python:
    - **ReportLab**: control total, complejidad media
    - **WeasyPrint**: genera PDF desde HTML/CSS, más fácil
    - **xhtml2pdf**: alternativa simple
  - Response: archivo PDF como binary
  - Ventajas: formato consistente, mejor calidad
  - Desventajas: carga en servidor, más complejo

- **Recomendación**: Opción 2 (backend) para PDF, Opción 1 (CSS print) para impresión rápida

- Configuración para personalizar:
  - Logo de empresa
  - Colores de marca
  - Información de contacto
  - Términos y condiciones
  - Mostrar/ocultar campos (SKU, notas, etc.)

- Para envío de email:
  - Usar sistema de email configurado (SMTP)
  - Template de email con Jinja2 o similar
  - Adjuntar PDF generado
  - Log de emails enviados

## Definición de Hecho
- [ ] Frontend: Botón de imprimir
- [ ] Frontend: CSS @media print para formato imprimible
- [ ] Frontend: Vista previa correcta en diálogo de impresión
- [ ] Frontend: Botón de exportar PDF
- [ ] Frontend: Descarga automática de PDF
- [ ] Backend: API GET /api/orders/{id}/pdf
- [ ] Backend: Generación de PDF con biblioteca elegida
- [ ] Backend: Template de PDF con diseño profesional
- [ ] Backend: Inclusión de logo y datos de empresa
- [ ] Configuración de empresa (logo, datos, términos)
- [ ] Opcional: Funcionalidad de envío por email
- [ ] Opcional: Template de email
- [ ] Pruebas de generación de PDF
- [ ] Pruebas de formato de impresión en diferentes navegadores
- [ ] Pruebas de descarga de archivo
- [ ] Documentación de configuración

## Dependencias
- US-ORD-007 (Ver Detalles del Pedido) para acceso
- Configuración de información de empresa
- Biblioteca de generación de PDF instalada

## Tags
`orders`, `printing`, `pdf`, `export`, `low-priority`
