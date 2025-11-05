# US-PROD-009: Carga de Imagen de Producto

## Historia de Usuario
**Como** gerente de almacén,
**quiero** poder cargar y cambiar la imagen de un producto,
**para** tener una representación visual del mismo.

## Prioridad
**Media**

## Estimación
5 Story Points

## Criterios de Aceptación

### CA-1: Formatos Aceptados
El sistema acepta los siguientes formatos de imagen:
- JPG / JPEG
- PNG
- WEBP
- Validación en frontend (por extensión) y backend (por MIME type)
- Si se intenta cargar otro formato:
  - Error: "Formato no válido. Solo se aceptan JPG, PNG y WEBP"

### CA-2: Tamaño Máximo de Archivo
- Tamaño máximo: 5MB (5,242,880 bytes)
- Validación en frontend antes de subir
- Validación en backend al recibir
- Si excede el tamaño:
  - Error: "La imagen no debe superar 5MB. Tu archivo pesa X.XX MB"
  - Sugerencia: "Intenta comprimir la imagen o usar un archivo más pequeño"

### CA-3: Componente de Carga en Crear Producto
En el formulario de crear producto:
- Área de carga con estilo drag-and-drop:
  - Texto: "Arrastra una imagen o haz clic para seleccionar"
  - Icono de imagen/cámara
  - Formatos aceptados visibles: "JPG, PNG, WEBP (máx. 5MB)"
- Al hacer clic, abre diálogo de selección de archivo
- Soporte drag-and-drop:
  - Resalta área al arrastrar archivo sobre ella
  - Acepta soltar archivo

### CA-4: Preview de Imagen
Después de seleccionar archivo:
- Muestra preview de la imagen:
  - Tamaño: 300x300px (proporcional)
  - Borde o marco visual
  - Nombre del archivo debajo
  - Tamaño del archivo en formato legible: "X.XX MB"
- Botones:
  - "Cambiar imagen" (seleccionar otra)
  - "Quitar imagen" (eliminar selección)
- El preview se actualiza instantáneamente al cambiar imagen

### CA-5: Optimización Automática
Al subir la imagen:
- Se optimiza automáticamente en el backend:
  - Redimensionar si el ancho o alto > 1200px (mantener proporción)
  - Compresión con calidad 85%
  - Conversión a formato WEBP para almacenamiento (opcional)
- Generación de thumbnail:
  - Tamaño: 200x200px
  - Usado en listas y cards
- El usuario no nota el proceso, es transparente

### CA-6: Nombrado de Archivo
- Archivos se nombran con patrón: `{sku}_{timestamp}.{extension}`
- Ejemplo: `PROD-001_1634567890123.webp`
- Evita conflictos de nombres
- Permite múltiples versiones (histórico)
- Los archivos antiguos se eliminan al subir nueva imagen

### CA-7: Cambiar Imagen en Editar Producto
En el formulario de editar producto:
- Muestra imagen actual del producto (si existe)
- Botón "Cambiar imagen"
- Al hacer clic:
  - Abre selector de archivo o muestra área de drag-and-drop
  - Permite previsualizar nueva imagen
  - Opción de "Cancelar" para mantener imagen actual
- Al guardar:
  - Reemplaza imagen anterior
  - Elimina archivo anterior del servidor

### CA-8: Placeholder por Defecto
Si no se carga imagen:
- Muestra imagen placeholder genérica:
  - Icono de imagen roto o caja
  - Color de fondo neutral
  - Texto: "Sin imagen"
- Considerar placeholders por categoría (opcional):
  - Categoría "Electrónica" → placeholder de dispositivo
  - Categoría "Alimentos" → placeholder de comida
  - etc.

### CA-9: Eliminar Imagen
En editar producto:
- Opción de eliminar imagen actual:
  - Botón "Eliminar imagen" (rojo/secundario)
  - Confirmación: "¿Eliminar imagen del producto?"
  - Al confirmar:
    - Elimina archivo del servidor
    - Producto queda sin imagen (usa placeholder)
    - Campo `image_url` se establece en NULL

### CA-10: Visualización en Diferentes Contextos
La imagen se usa en múltiples lugares:
- **Lista de productos**: Thumbnail 100x100px
- **Detalles de producto**: Imagen grande 400x400px (clickeable para ver fullsize)
- **Cards de producto**: Thumbnail 150x150px
- **Seleccionar producto en pedidos**: Thumbnail 50x50px
- Lazy loading en listas para mejor performance

### CA-11: Zoom de Imagen (Opcional)
En vista de detalles:
- Al hacer clic en imagen grande, abre modal con:
  - Imagen en tamaño original (o máximo 1200px)
  - Fondo oscuro semitransparente
  - Botón cerrar (X)
  - Opción de zoom in/out (opcional)

### CA-12: Manejo de Errores de Carga
Si falla la carga de imagen:
- Error de red o servidor:
  - Mensaje: "Error al subir la imagen. Intenta nuevamente."
  - Mantener formulario con datos para no perder información
- Timeout:
  - Mensaje: "La carga está tomando demasiado tiempo. Verifica tu conexión."
- Error de validación backend:
  - Mostrar mensaje específico del backend

## Notas Técnicas
- Almacenamiento:
  - Opción 1: Servidor local en `/uploads/products/`
  - Opción 2: Servicio cloud (AWS S3, Cloudinary, etc.)
- API endpoints:
  - `POST /api/products/{id}/image` - Subir/actualizar imagen
  - `DELETE /api/products/{id}/image` - Eliminar imagen
- Campo `image_url` en tabla `products` (string, nullable)
- Campo `image_thumbnail_url` (opcional, para thumbnail separado)
- Usar librería de optimización de imágenes:
  - Sharp (Node.js)
  - Pillow (Python)
  - Intervention Image (PHP)
- Implementar límite de rate para prevenir abuso (ej: 10 uploads por minuto)
- CORS configurado si se usa almacenamiento externo
- Validación de dimensiones mínimas: 200x200px (opcional)
- Escaneo antivirus para archivos subidos (opcional, para seguridad)

## Definición de Hecho
- [x] Frontend: Componente de carga drag-and-drop ✅
- [x] Frontend: Preview de imagen antes de guardar ✅
- [x] Frontend: Validación de formato y tamaño en cliente ✅
- [x] Frontend: Botón cambiar/eliminar imagen en editar ✅
- [x] Frontend: Placeholder por defecto ✅
- [x] Frontend: Visualización de imágenes en lista y detalles ✅
- [x] Frontend: Lazy loading de imágenes ✅ (ya existente)
- [x] Frontend: Modal de zoom (opcional) ✅
- [x] Backend: API para subir imagen ✅
- [x] Backend: Validación de formato y tamaño ✅
- [x] Backend: Optimización automática de imagen ✅
- [ ] Backend: Generación de thumbnail (preparado pero no implementado en v1.0)
- [x] Backend: Nombrado de archivo con patrón ✅
- [x] Backend: Eliminación de imagen anterior ✅
- [x] Backend: API para eliminar imagen ✅
- [x] Almacenamiento configurado (local) ✅
- [x] Manejo de errores robusto ✅
- [ ] Pruebas de carga con diferentes formatos y tamaños (testing manual)
- [ ] Pruebas de seguridad (inyección de archivos maliciosos) (v2.0)
- [ ] Documentación de API (en comentarios de código)

## Dependencias
- US-PROD-001 (Crear Producto) debe estar completo
- US-PROD-005 (Editar Producto) debe estar completo
- Sistema de almacenamiento de archivos configurado
- Librería de procesamiento de imágenes instalada

## Tags
`products`, `images`, `upload`, `media`, `medium-priority`, `optimization`
